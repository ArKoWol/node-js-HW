import express from 'express';
import multer from 'multer';
import {
  getAllArticleFiles,
  readArticleFile,
  writeArticleFile,
  generateFilename,
  findFileByArticleId,
  deleteArticleFile,
  saveAttachment,
  deleteAttachment,
  getAttachmentPath
} from '../utils/fileSystem.js';
import {
  notifyArticleCreated,
  notifyArticleUpdated,
  notifyArticleDeleted,
  notifyFileAttached,
  notifyFileDeleted
} from '../utils/notifications.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed.'));
    }
  }
});

function validateArticle(data) {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  
  if (data.title && data.title.trim().length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required and must be a non-empty string');
  }
  
  if (data.content && data.content.length > 1000000) {
    errors.push('Content is too large (max 1MB)');
  }
  
  return errors;
}

router.get('/', async (req, res, next) => {
  try {
    const files = await getAllArticleFiles();
    
    const articles = await Promise.all(
      files.map(async (file) => {
        try {
          const article = await readArticleFile(file);
          return {
            id: article.id,
            title: article.title,
            createdAt: article.createdAt,
            summary: article.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...'
          };
        } catch (error) {
          console.error(`Error reading article ${file}:`, error);
          return null;
        }
      })
    );
    
    const validArticles = articles
      .filter(article => article !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      count: validArticles.length,
      articles: validArticles
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = await getAllArticleFiles();
    
    for (const file of files) {
      try {
        const article = await readArticleFile(file);
        if (article.id === id) {
          return res.json({
            success: true,
            article
          });
        }
      } catch (error) {
        console.error(`Error reading article ${file}:`, error);
      }
    }
    
    res.status(404).json({
      success: false,
      error: 'Article not found',
      status: 404
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, content, author } = req.body;
    
    const errors = validateArticle({ title, content });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
        status: 400
      });
    }
    
    const article = {
      id: `article-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: []
    };
    
    const filename = generateFilename(article.title, article.id);
    await writeArticleFile(filename, article);

    notifyArticleCreated(article);
    
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, author } = req.body;
    
    // Find the existing article file
    const filename = await findFileByArticleId(id);
    if (!filename) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    // Validate the updated article data
    const errors = validateArticle({ title, content });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
        status: 400
      });
    }
    
    // Read the existing article to preserve fields
    const existingArticle = await readArticleFile(filename);
    
    // Update the article with new data
    const updatedArticle = {
      ...existingArticle,
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || existingArticle.author || 'Anonymous',
      updatedAt: new Date().toISOString(),
      attachments: existingArticle.attachments || []
    };
    
    // Write the updated article back to the same file
    await writeArticleFile(filename, updatedArticle);

    notifyArticleUpdated(updatedArticle);
    
    res.json({
      success: true,
      message: 'Article updated successfully',
      article: updatedArticle
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the article file
    const filename = await findFileByArticleId(id);
    if (!filename) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    const article = await readArticleFile(filename);
    
    if (article.attachments && article.attachments.length > 0) {
      for (const attachment of article.attachments) {
        await deleteAttachment(attachment.storedFilename);
      }
    }
    
    await deleteArticleFile(filename);

    notifyArticleDeleted(id, article.title);
    
    res.json({
      success: true,
      message: 'Article deleted successfully',
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/attachments', upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        status: 400
      });
    }
    
    const filename = await findFileByArticleId(id);
    if (!filename) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    const article = await readArticleFile(filename);
    
    const attachment = await saveAttachment(req.file, id);
    
    if (!article.attachments) {
      article.attachments = [];
    }
    article.attachments.push(attachment);
    article.updatedAt = new Date().toISOString();
    
    await writeArticleFile(filename, article);

    notifyFileAttached(article, attachment);
    
    res.status(201).json({
      success: true,
      message: 'File attached successfully',
      attachment
    });
  } catch (error) {
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        status: 400
      });
    }
    next(error);
  }
});

router.delete('/:id/attachments/:attachmentId', async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    
    const filename = await findFileByArticleId(id);
    if (!filename) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    const article = await readArticleFile(filename);
    
    const attachmentIndex = article.attachments?.findIndex(a => a.id === attachmentId);
    
    if (attachmentIndex === -1 || attachmentIndex === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
        status: 404
      });
    }
    
    const attachment = article.attachments[attachmentIndex];
    
    await deleteAttachment(attachment.storedFilename);
    
    article.attachments.splice(attachmentIndex, 1);
    article.updatedAt = new Date().toISOString();
    
    await writeArticleFile(filename, article);

    notifyFileDeleted(id, article.title, attachment.filename);
    
    res.json({
      success: true,
      message: 'Attachment deleted successfully',
      deletedId: attachmentId
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/attachments/:attachmentId', async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    
    const filename = await findFileByArticleId(id);
    if (!filename) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    const article = await readArticleFile(filename);
    
    const attachment = article.attachments?.find(a => a.id === attachmentId);
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
        status: 404
      });
    }
    
    const filePath = await getAttachmentPath(attachment.storedFilename);
    
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
    
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;

