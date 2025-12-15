import Article from '../../models/Article.js';
import ArticleVersion from '../../models/ArticleVersion.js';
import Attachment from '../../models/Attachment.js';
import Workspace from '../../models/Workspace.js';
import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
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
        attributes: ['id', 'currentVersionNumber', 'createdAt', 'creatorId'],
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Workspace,
            as: 'workspace',
            attributes: ['id', 'name', 'slug'],
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email'],
            required: false,
          },
        ],
      });

      // Get current versions for all articles
      const articlesWithVersions = await Promise.all(
        articles.map(async (article) => {
          const currentVersion = await ArticleVersion.findOne({
            where: {
              articleId: article.id,
              versionNumber: article.currentVersionNumber,
            },
            attributes: ['title', 'content'],
          });

          return {
            article,
            version: currentVersion,
          };
        })
      );

      const articlesWithSummary = articlesWithVersions.map(({ article, version }) => ({
        id: article.id,
        title: version?.title || 'Untitled',
        createdAt: article.createdAt,
        summary: version?.content 
          ? version.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...'
          : 'No content',
        workspace: formatWorkspace(article.workspace),
        creatorId: article.creatorId,
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
        attributes: ['id', 'currentVersionNumber', 'createdAt', 'updatedAt', 'creatorId', 'workspaceId'],
        include: [
          {
            model: Workspace,
            as: 'workspace',
            attributes: ['id', 'name', 'slug', 'description'],
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email'],
            required: false,
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

      // Get current version with attachments
      const currentVersion = await ArticleVersion.findOne({
        where: {
          articleId: id,
          versionNumber: article.currentVersionNumber,
        },
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
        ],
      });

      if (!currentVersion) {
        return res.status(404).json({
          success: false,
          error: 'Current version not found',
          status: 404,
        });
      }

      // Get creator email - prefer loaded relationship, fallback to direct query
      let creatorEmail = article.creator?.email;
      if (!creatorEmail && article.creatorId) {
        const creator = await User.findByPk(article.creatorId, {
          attributes: ['email'],
        });
        creatorEmail = creator?.email;
      }

      res.json({
        success: true,
        article: {
          id: article.id,
          title: currentVersion.title,
          content: currentVersion.content,
          author: creatorEmail || 'Unknown',
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          attachments: currentVersion.attachments || [],
          workspace: formatWorkspace(article.workspace),
          comments: (article.comments || []).map(formatComment),
          currentVersionNumber: article.currentVersionNumber,
          versions: mapVersionHistory(article.versions),
          creatorId: article.creatorId,
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

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          status: 401,
        });
      }

      const { createdArticle: article, version } = await sequelize.transaction(async (transaction) => {
        // Create article with minimal data - content comes from version
        const articleData = {
          workspaceId: workspace.id,
          currentVersionNumber: 1,
          creatorId: req.userId,
        };
        
        if (!req.userId) {
          console.error('WARNING: req.userId is not set when creating article!');
        }
        
        const createdArticle = await Article.create(articleData, { transaction });
        
        if (!createdArticle.creatorId) {
          console.error(`WARNING: Article ${createdArticle.id} was created without creatorId!`);
        }

        // Create version 1 with actual content
        const versionRecord = await ArticleVersion.create({
          articleId: createdArticle.id,
          versionNumber: 1,
          title: title.trim(),
          content: content.trim(),
          author: author?.trim() || 'Anonymous',
        }, { transaction });

        return { createdArticle, version: versionRecord };
      });

      let creatorEmail = req.user?.email;
      if (!creatorEmail && article.creatorId) {
        const creator = await User.findByPk(article.creatorId, {
          attributes: ['email'],
        });
        creatorEmail = creator?.email;
      }

      notifyArticleCreated({
        id: article.id,
        title: version.title,
        author: creatorEmail || 'Unknown',
        createdAt: article.createdAt,
      });

      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        article: {
          id: article.id,
          title: version.title,
          content: version.content,
          author: creatorEmail || 'Unknown',
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          attachments: [],
          workspace: formatWorkspace(workspace),
          comments: [],
          currentVersionNumber: article.currentVersionNumber,
          versions: mapVersionHistory([version]),
          creatorId: article.creatorId,
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

      const article = await Article.findByPk(id, {
        attributes: ['id', 'currentVersionNumber', 'createdAt', 'updatedAt', 'creatorId', 'workspaceId'],
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

      const isCreator = article.creatorId === req.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to edit this article. Only the creator or an admin can edit articles.',
          status: 403,
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

        const targetWorkspaceId = payload.workspaceId || article.workspaceId;

        // Get current version to preserve author if not provided
        const currentVersion = await ArticleVersion.findOne({
          where: {
            articleId: article.id,
            versionNumber: article.currentVersionNumber,
          },
          transaction,
        });

        const targetAuthor = payload.author || currentVersion?.author || 'Anonymous';

        // Create new version with content - this is the source of truth
        await ArticleVersion.create({
          articleId: article.id,
          versionNumber: nextVersionNumber,
          title: payload.title,
          content: payload.content,
          author: targetAuthor,
        }, { transaction });

        // Update article metadata only - content comes from version
        await article.update({
          workspaceId: targetWorkspaceId,
          currentVersionNumber: nextVersionNumber,
        }, { transaction });

        return article.id;
      });

      const updatedArticle = await Article.findByPk(updatedArticleId, {
        attributes: ['id', 'currentVersionNumber', 'createdAt', 'updatedAt', 'creatorId', 'workspaceId'],
        include: [
          {
            model: Workspace,
            as: 'workspace',
            attributes: ['id', 'name', 'slug', 'description'],
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email'],
            required: false,
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

      // Get current version with attachments
      const currentVersion = await ArticleVersion.findOne({
        where: {
          articleId: updatedArticleId,
          versionNumber: updatedArticle.currentVersionNumber,
        },
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
        ],
      });

      let creatorEmail = updatedArticle.creator?.email;
      if (!creatorEmail && updatedArticle.creatorId) {
        const creator = await User.findByPk(updatedArticle.creatorId, {
          attributes: ['email'],
        });
        creatorEmail = creator?.email;
      }

      notifyArticleUpdated({
        id: updatedArticle.id,
        title: currentVersion.title,
        updatedAt: updatedArticle.updatedAt,
      });

      res.json({
        success: true,
        message: 'Article updated successfully',
        article: {
          id: updatedArticle.id,
          title: currentVersion.title,
          content: currentVersion.content,
          author: creatorEmail || 'Unknown',
          createdAt: updatedArticle.createdAt,
          updatedAt: updatedArticle.updatedAt,
          attachments: currentVersion.attachments || [],
          workspace: formatWorkspace(updatedArticle.workspace),
          comments: (updatedArticle.comments || []).map(formatComment),
          currentVersionNumber: updatedArticle.currentVersionNumber,
          versions: mapVersionHistory(updatedArticle.versions),
          creatorId: updatedArticle.creatorId,
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

      const article = await Article.findByPk(id, {
        attributes: ['id', 'currentVersionNumber', 'createdAt', 'updatedAt', 'creatorId', 'workspaceId'],
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }


      const isCreator = article.creatorId === req.userId;
      const isAdmin = req.user?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this article. Only the creator or an admin can delete articles.',
          status: 403,
        });
      }

      // Get current version for title
      const currentVersion = await ArticleVersion.findOne({
        where: {
          articleId: id,
          versionNumber: article.currentVersionNumber,
        },
      });
      
      const articleTitle = currentVersion?.title || 'Article';
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
        ],
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
          attachments: version.attachments || [],
          isLatest: version.versionNumber === article.currentVersionNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

export default registerBaseRoutes;

