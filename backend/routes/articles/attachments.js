import express from 'express';
import multer from 'multer';
import Article from '../../models/Article.js';
import ArticleVersion from '../../models/ArticleVersion.js';
import Attachment from '../../models/Attachment.js';
import {
  notifyFileAttached,
  notifyFileDeleted,
} from '../../utils/notifications.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
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
      'application/pdf',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed.',
        ),
      );
    }
  },
});

function registerAttachmentRoutes(router) {
  const attachmentRouter = express.Router({ mergeParams: true });

  attachmentRouter.post('/', upload.single('file'), async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
          status: 400,
        });
      }

      const article = await Article.findByPk(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

      // Get current version to associate attachment with it
      const currentVersion = await ArticleVersion.findOne({
        where: {
          articleId: id,
          versionNumber: article.currentVersionNumber,
        },
      });

      if (!currentVersion) {
        return res.status(404).json({
          success: false,
          error: 'Current version not found',
          status: 404,
        });
      }

      const attachment = await Attachment.create({
        articleId: id,
        versionId: currentVersion.id,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      });

      notifyFileAttached(
        { id: article.id, title: currentVersion.title },
        { id: attachment.id, filename: attachment.filename },
      );

      res.status(201).json({
        success: true,
        message: 'File attached successfully',
        attachment: {
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          createdAt: attachment.createdAt,
        },
      });
    } catch (error) {
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          error: error.message,
          status: 400,
        });
      }
      next(error);
    }
  });

  attachmentRouter.delete('/:attachmentId', async (req, res, next) => {
    try {
      const { id, attachmentId } = req.params;

      const attachment = await Attachment.findOne({
        where: { id: attachmentId, articleId: id },
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: 'Attachment not found',
          status: 404,
        });
      }

      const article = await Article.findByPk(id);
      const filename = attachment.filename;

      // Get version title for notification
      let articleTitle = 'Article';
      if (attachment.versionId) {
        const version = await ArticleVersion.findByPk(attachment.versionId);
        if (version) {
          articleTitle = version.title;
        }
      } else if (article) {
        const currentVersion = await ArticleVersion.findOne({
          where: {
            articleId: id,
            versionNumber: article.currentVersionNumber,
          },
        });
        articleTitle = currentVersion?.title || 'Article';
      }

      await attachment.destroy();

      notifyFileDeleted(id, articleTitle, filename);

      res.json({
        success: true,
        message: 'Attachment deleted successfully',
        deletedId: attachmentId,
      });
    } catch (error) {
      next(error);
    }
  });

  attachmentRouter.get('/:attachmentId', async (req, res, next) => {
    try {
      const { id, attachmentId } = req.params;

      const attachment = await Attachment.findOne({
        where: { id: attachmentId, articleId: id },
      });

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: 'Attachment not found',
          status: 404,
        });
      }

      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${attachment.filename}"`,
      );
      res.setHeader('Content-Length', attachment.size);

      res.send(attachment.data);
    } catch (error) {
      next(error);
    }
  });

  router.use('/:id/attachments', attachmentRouter);
}

export default registerAttachmentRoutes;

