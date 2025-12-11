import express from 'express';
import registerBaseRoutes from './articles/base.js';
import registerAttachmentRoutes from './articles/attachments.js';
import registerCommentRoutes from './articles/comments.js';
import registerPdfRoutes from './articles/pdf.js';

const router = express.Router();

registerPdfRoutes(router);
registerBaseRoutes(router);
registerAttachmentRoutes(router);
registerCommentRoutes(router);

export default router;

