import Article from '../../models/Article.js';
import ArticleVersion from '../../models/ArticleVersion.js';
import Workspace from '../../models/Workspace.js';
import User from '../../models/User.js';
import PDFDocument from 'pdfkit';

const stripHtml = (html) => {
  if (!html) return '';
  let text = html;
  
  text = text.replace(/<p[^>]*>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<h[1-6][^>]*>/gi, '\n\n');
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<blockquote[^>]*>/gi, '\n');
  
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n\n');
  text = text.replace(/<\/ol>/gi, '\n\n');
  text = text.replace(/<\/blockquote>/gi, '\n\n');
  
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');
  
  text = text.replace(/<[^>]*>/g, '');
  
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'")
             .replace(/&apos;/g, "'")
             .replace(/&#160;/g, ' ')
             .replace(/&mdash;/g, '—')
             .replace(/&ndash;/g, '–')
             .replace(/&hellip;/g, '…');
  
  text = text.replace(/[ \t]+/g, ' ')
             .replace(/[ \t]*\n[ \t]*/g, '\n')
             .replace(/\n{3,}/g, '\n\n')
             .trim();
  
  return text;
};

function registerPdfRoutes(router) {
  router.get('/:id/export/pdf', async (req, res, next) => {
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
        ],
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
          status: 404,
        });
      }

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

      let creatorEmail = article.creator?.email;
      if (!creatorEmail && article.creatorId) {
        const creator = await User.findByPk(article.creatorId, {
          attributes: ['email'],
        });
        creatorEmail = creator?.email;
      }

      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'LETTER',
      });

      const filename = `${currentVersion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(currentVersion.title, { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#666666');
      
      const metadataLines = [
        `Author: ${currentVersion.author || creatorEmail || 'Unknown'}`,
        `Created: ${new Date(article.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      ];
      
      if (article.updatedAt && article.updatedAt !== article.createdAt) {
        metadataLines.push(`Last Updated: ${new Date(article.updatedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`);
      }
      
      if (article.workspace) {
        metadataLines.push(`Workspace: ${article.workspace.name}`);
      }
      
      metadataLines.push(`Version: ${article.currentVersionNumber}`);
      
      metadataLines.forEach((line, index) => {
        doc.text(line, { align: 'left' });
      });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .strokeColor('#cccccc')
         .lineWidth(1)
         .stroke()
         .moveDown(0.75);

      const content = stripHtml(currentVersion.content);
      
      if (!content || content.trim().length === 0) {
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#666666')
           .text('(No content)', { align: 'left' });
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#000000');

        const lines = content.split('\n');
        let currentParagraph = [];

        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();

          if (trimmedLine.length === 0) {
            if (currentParagraph.length > 0) {
              const paragraphText = currentParagraph.join('\n');
              
              const remainingHeight = doc.page.height - doc.y - 50;
              const estimatedHeight = doc.heightOfString(paragraphText, {
                width: doc.page.width - 100,
                lineGap: 5,
              });

              if (estimatedHeight > remainingHeight && doc.y > 150) {
                doc.addPage();
              }

              doc.text(paragraphText, {
                align: 'left',
                lineGap: 5,
                width: doc.page.width - 100,
              });
              
              doc.moveDown(0.5);
              currentParagraph = [];
            }
          } else {
            currentParagraph.push(trimmedLine);
          }
        });

        if (currentParagraph.length > 0) {
          const paragraphText = currentParagraph.join('\n');
          
          const remainingHeight = doc.page.height - doc.y - 50;
          const estimatedHeight = doc.heightOfString(paragraphText, {
            width: doc.page.width - 100,
            lineGap: 5,
          });

          if (estimatedHeight > remainingHeight && doc.y > 150) {
            doc.addPage();
          }

          doc.text(paragraphText, {
            align: 'left',
            lineGap: 5,
            width: doc.page.width - 100,
          });
        }
      }

      doc.end();
    } catch (error) {
      next(error);
    }
  });
}

export default registerPdfRoutes;
