import Article from '../../models/Article.js';
import ArticleVersion from '../../models/ArticleVersion.js';
import Attachment from '../../models/Attachment.js';
import Workspace from '../../models/Workspace.js';
import Comment from '../../models/Comment.js';
import sequelize from '../../models/index.js';
import {
  notifyArticleCreated,
  notifyArticleUpdated,
  notifyArticleDeleted,
} from '../../utils/notifications.js';
import { formatWorkspace, formatComment, formatVersionMetadata } from './helpers.js';

const mapVersionHistory = (versions = []) =>
  (versions || [])
    .map(formatVersionMetadata)
    .sort((a, b) => b.versionNumber - a.versionNumber);

function registerBaseRoutes(router) {
  router.get('/', async (req, res, next) => {
    try {
      const { workspaceId } = req.query;
      const workspaceFilter = {};

      if (workspaceId) {
        const workspaceExists = await Workspace.findByPk(workspaceId);
        if (!workspaceExists) {
          return res.status(404).json({
            success: false,
            error: 'Workspace not found',
            status: 404,
          });
        }
        workspaceFilter.workspaceId = workspaceId;
      }

      const articles = await Article.findAll({
        where: workspaceFilter,
        attributes: ['id', 'title', 'content', 'createdAt'],
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Workspace,
            as: 'workspace',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      });

      const articlesWithSummary = articles.map((article) => ({
        id: article.id,
        title: article.title,
        createdAt: article.createdAt,
        summary: article.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...',
        workspace: formatWorkspace(article.workspace),
      }));

      res.json({
        success: true,
        count: articlesWithSummary.length,
        articles: articlesWithSummary,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;

      const article = await Article.findByPk(id, {
        include: [
          {
            model: Attachment,
            as: 'attachments',
            attributes: [
              'id',
              'filename',
              ['mime_type', 'mimeType'],
              'size',
              ['created_at', 'createdAt'],
            ],
          },
          {
            model: Workspace,
            as: 'workspace',
            attributes: ['id', 'name', 'slug', 'description'],
          },
          {
            model: Comment,
            as: 'comments',
            attributes: ['id', 'author', 'content', 'createdAt', 'updatedAt'],
            separate: true,
            order: [['createdAt', 'DESC']],
          },
          {
            model: ArticleVersion,
            as: 'versions',
            attributes: ['id', 'versionNumber', 'title', 'author', 'createdAt'],
            separate: true,
            order: [['versionNumber', 'DESC']],
          },
        ],
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
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
          attachments: article.attachments || [],
          workspace: formatWorkspace(article.workspace),
          comments: (article.comments || []).map(formatComment),
          currentVersionNumber: article.currentVersionNumber,
          versions: mapVersionHistory(article.versions),
        },
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { title, content, author, workspaceId } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Title is required and must be a non-empty string'],
          status: 400,
        });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Title must be less than 200 characters'],
          status: 400,
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

      if (content.length > 1_000_000) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Content is too large (max 1MB)'],
          status: 400,
        });
      }

      if (!workspaceId || typeof workspaceId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['WorkspaceId is required'],
          status: 400,
        });
      }

      const workspace = await Workspace.findByPk(workspaceId);

      if (!workspace) {
        return res.status(404).json({
          success: false,
          error: 'Workspace not found',
          status: 404,
        });
      }

      const { createdArticle: article, version } = await sequelize.transaction(async (transaction) => {
        const createdArticle = await Article.create({
          title: title.trim(),
          content: content.trim(),
          author: author?.trim() || 'Anonymous',
          workspaceId: workspace.id,
        }, { transaction });

        const versionRecord = await ArticleVersion.create({
          articleId: createdArticle.id,
          versionNumber: 1,
          title: createdArticle.title,
          content: createdArticle.content,
          author: createdArticle.author,
        }, { transaction });

        return { createdArticle, version: versionRecord };
      });

      notifyArticleCreated({
        id: article.id,
        title: article.title,
        author: article.author,
        createdAt: article.createdAt,
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
          attachments: [],
          workspace: formatWorkspace(workspace),
          comments: [],
          currentVersionNumber: article.currentVersionNumber,
          versions: mapVersionHistory([version]),
        },
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

  router.put('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, content, author, workspaceId } = req.body;

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Title is required and must be a non-empty string'],
          status: 400,
        });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Title must be less than 200 characters'],
          status: 400,
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

      if (content.length > 1_000_000) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: ['Content is too large (max 1MB)'],
          status: 400,
        });
      }

      let updatedWorkspace = null;
      if (workspaceId) {
        updatedWorkspace = await Workspace.findByPk(workspaceId);
        if (!updatedWorkspace) {
          return res.status(404).json({
            success: false,
            error: 'Workspace not found',
            status: 404,
          });
        }
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        author: author?.trim() || article.author,
      };

      if (updatedWorkspace) {
        payload.workspaceId = updatedWorkspace.id;
      }

      const updatedArticleId = await sequelize.transaction(async (transaction) => {
        await article.reload({ transaction, lock: transaction.LOCK.UPDATE });

        const nextVersionNumber = (article.currentVersionNumber || 1) + 1;

        const targetAuthor = payload.author || article.author;
        const targetWorkspaceId = payload.workspaceId || article.workspaceId;

        await ArticleVersion.create({
          articleId: article.id,
          versionNumber: nextVersionNumber,
          title: payload.title,
          content: payload.content,
          author: targetAuthor,
        }, { transaction });

        await article.update({
          title: payload.title,
          content: payload.content,
          author: targetAuthor,
          workspaceId: targetWorkspaceId,
          currentVersionNumber: nextVersionNumber,
        }, { transaction });

        return article.id;
      });

      const updatedArticle = await Article.findByPk(updatedArticleId, {
        include: [
          {
            model: Workspace,
            as: 'workspace',
            attributes: ['id', 'name', 'slug', 'description'],
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: [
              'id',
              'filename',
              ['mime_type', 'mimeType'],
              'size',
              ['created_at', 'createdAt'],
            ],
          },
          {
            model: Comment,
            as: 'comments',
            attributes: ['id', 'author', 'content', 'createdAt', 'updatedAt'],
            separate: true,
            order: [['createdAt', 'DESC']],
          },
          {
            model: ArticleVersion,
            as: 'versions',
            attributes: ['id', 'versionNumber', 'title', 'author', 'createdAt'],
            separate: true,
            order: [['versionNumber', 'DESC']],
          },
        ],
      });

      notifyArticleUpdated({
        id: updatedArticle.id,
        title: updatedArticle.title,
        updatedAt: updatedArticle.updatedAt,
      });

      res.json({
        success: true,
        message: 'Article updated successfully',
        article: {
          id: updatedArticle.id,
          title: updatedArticle.title,
          content: updatedArticle.content,
          author: updatedArticle.author,
          createdAt: updatedArticle.createdAt,
          updatedAt: updatedArticle.updatedAt,
          attachments: updatedArticle.attachments || [],
          workspace: formatWorkspace(updatedArticle.workspace),
          comments: (updatedArticle.comments || []).map(formatComment),
          currentVersionNumber: updatedArticle.currentVersionNumber,
          versions: mapVersionHistory(updatedArticle.versions),
        },
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

  router.delete('/:id', async (req, res, next) => {
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

      const articleTitle = article.title;
      await article.destroy();

      notifyArticleDeleted(id, articleTitle);

      res.json({
        success: true,
        message: 'Article deleted successfully',
        deletedId: id,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/versions/:versionNumber', async (req, res, next) => {
    try {
      const { id, versionNumber } = req.params;
      const parsedVersion = Number(versionNumber);

      if (Number.isNaN(parsedVersion) || parsedVersion < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid version number',
          status: 400,
        });
      }

      const article = await Article.findByPk(id, {
        attributes: ['id', 'currentVersionNumber'],
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

      const version = await ArticleVersion.findOne({
        where: {
          articleId: id,
          versionNumber: parsedVersion,
        },
      });

      if (!version) {
        return res.status(404).json({
          success: false,
          error: 'Version not found',
          status: 404,
        });
      }

      res.json({
        success: true,
        version: {
          versionNumber: version.versionNumber,
          title: version.title,
          content: version.content,
          author: version.author,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
          isLatest: version.versionNumber === article.currentVersionNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

export default registerBaseRoutes;

