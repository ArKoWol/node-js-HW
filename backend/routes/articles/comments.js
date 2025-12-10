import express from 'express';
import Article from '../../models/Article.js';
import Comment from '../../models/Comment.js';
import { formatComment } from './helpers.js';

function registerCommentRoutes(router) {
  const commentRouter = express.Router({ mergeParams: true });

  commentRouter.get('/', async (req, res, next) => {
    try {
      const { id } = req.params;
      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

      const comments = await Comment.findAll({
        where: { articleId: id },
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        count: comments.length,
        comments: comments.map(formatComment),
      });
    } catch (error) {
      next(error);
    }
  });

  commentRouter.post('/', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      // Author is automatically set from logged-in user's email
      // req.user is guaranteed to exist because verifyToken middleware ensures it
      const author = req.user.email;

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Content is required and must be a non-empty string'],
          status: 400,
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Content is too large (max 5,000 characters)'],
          status: 400,
        });
      }

      const comment = await Comment.create({
        articleId: article.id,
        workspaceId: article.workspaceId,
        author: author,
        userId: req.user.id,
        content: content.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        comment: formatComment(comment),
      });
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: error.errors.map((e) => e.message),
          status: 400,
        });
      }
      next(error);
    }
  });

  commentRouter.put('/:commentId', async (req, res, next) => {
    try {
      const { id, commentId } = req.params;
      const { content } = req.body;

      const comment = await Comment.findOne({
        where: { id: commentId, articleId: id },
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
          status: 404,
        });
      }

      if (comment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only edit your own comments',
          status: 403,
        });
      }

      if (content && (typeof content !== 'string' || content.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Content must be a non-empty string if provided'],
          status: 400,
        });
      }

      if (content && content.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Content is too large (max 5,000 characters)'],
          status: 400,
        });
      }

      await comment.update({
        content: content?.trim() || comment.content,
      });

      res.json({
        success: true,
        message: 'Comment updated successfully',
        comment: formatComment(comment),
      });
    } catch (error) {
      next(error);
    }
  });

  commentRouter.delete('/:commentId', async (req, res, next) => {
    try {
      const { id, commentId } = req.params;

      const comment = await Comment.findOne({
        where: { id: commentId, articleId: id },
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: 'Comment not found',
          status: 404,
        });
      }

      if (comment.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own comments',
          status: 403,
        });
      }

      await comment.destroy();

      res.json({
        success: true,
        message: 'Comment deleted successfully',
        deletedId: commentId,
      });
    } catch (error) {
      next(error);
    }
  });

  router.use('/:id/comments', commentRouter);
}

export default registerCommentRoutes;

