import express from 'express';
import multer from 'multer';
import Article from '../models/Article.js';
import Attachment from '../models/Attachment.js';
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

router.get('/', async (req, res, next) => {
  try {
    const articles = await Article.findAll({
      attributes: ['id', 'title', 'content', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    const articlesWithSummary = articles.map(article => ({
      id: article.id,
      title: article.title,
      createdAt: article.createdAt,
      summary: article.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...'
    }));
    
    res.json({
      success: true,
      count: articlesWithSummary.length,
      articles: articlesWithSummary
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByPk(id, {
      include: [{
        model: Attachment,
        as: 'attachments',
        attributes: ['id', 'filename', ['mime_type', 'mimeType'], 'size', ['created_at', 'createdAt']]
      }]
    });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    res.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        author: article.author,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        attachments: article.attachments || []
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, content, author } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Title is required and must be a non-empty string'],
        status: 400
      });
    }
    
    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Title must be less than 200 characters'],
        status: 400
      });
    }
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Content is required and must be a non-empty string'],
        status: 400
      });
    }
    
    if (content.length > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Content is too large (max 1MB)'],
        status: 400
      });
    }
    
    const article = await Article.create({
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || 'Anonymous'
    });

    notifyArticleCreated({
      id: article.id,
      title: article.title,
      author: article.author,
      createdAt: article.createdAt
    });
    
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        author: article.author,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        attachments: []
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors.map(e => e.message),
        status: 400
      });
    }
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, author } = req.body;
    
    const article = await Article.findByPk(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Title is required and must be a non-empty string'],
        status: 400
      });
    }
    
    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Title must be less than 200 characters'],
        status: 400
      });
    }
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Content is required and must be a non-empty string'],
        status: 400
      });
    }
    
    if (content.length > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: ['Content is too large (max 1MB)'],
        status: 400
      });
    }
    
    await article.update({
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || article.author
    });

    notifyArticleUpdated({
      id: article.id,
      title: article.title,
      updatedAt: article.updatedAt
    });
    
    res.json({
      success: true,
      message: 'Article updated successfully',
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        author: article.author,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        attachments: []
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors.map(e => e.message),
        status: 400
      });
    }
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByPk(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    const articleTitle = article.title;
    await article.destroy();

    notifyArticleDeleted(id, articleTitle);
    
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
    
    const article = await Article.findByPk(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        status: 404
      });
    }
    
    const attachment = await Attachment.create({
      articleId: id,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer
    });

    notifyFileAttached(
      { id: article.id, title: article.title },
      { id: attachment.id, filename: attachment.filename }
    );
    
    res.status(201).json({
      success: true,
      message: 'File attached successfully',
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt
      }
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
    
    const attachment = await Attachment.findOne({
      where: { id: attachmentId, articleId: id }
    });
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
        status: 404
      });
    }
    
    const article = await Article.findByPk(id);
    const filename = attachment.filename;
    
    await attachment.destroy();

    notifyFileDeleted(id, article?.title || 'Article', filename);
    
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
    
    const attachment = await Attachment.findOne({
      where: { id: attachmentId, articleId: id }
    });
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
        status: 404
      });
    }
    
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.filename}"`);
    res.setHeader('Content-Length', attachment.size);
    
    res.send(attachment.data);
  } catch (error) {
    next(error);
  }
});

export default router;