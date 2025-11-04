import express from 'express';
import {
  getAllArticleFiles,
  readArticleFile,
  writeArticleFile,
  generateFilename,
  articleFileExists,
  findFileByArticleId,
  deleteArticleFile
} from '../utils/fileSystem.js';

const router = express.Router();

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
      updatedAt: new Date().toISOString()
    };
    
    const filename = generateFilename(article.title);
    await writeArticleFile(filename, article);
    
    console.log(`Article created: ${article.id} (${filename})`);
    
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
      updatedAt: new Date().toISOString()
    };
    
    // Write the updated article back to the same file
    await writeArticleFile(filename, updatedArticle);
    
    console.log(`Article updated: ${id} (${filename})`);
    
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
    
    // Delete the article file
    await deleteArticleFile(filename);
    
    console.log(`Article deleted: ${id} (${filename})`);
    
    res.json({
      success: true,
      message: 'Article deleted successfully',
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
});

export default router;

