import { broadcastMessage } from './websocket.js';

export function notifyArticleCreated(article) {
  broadcastMessage({
    type: 'article_created',
    message: `New article created: "${article.title}"`,
    articleId: article.id,
    articleTitle: article.title
  });
}

export function notifyArticleUpdated(article) {
  broadcastMessage({
    type: 'article_updated',
    message: `Article updated: "${article.title}"`,
    articleId: article.id,
    articleTitle: article.title
  });
}

export function notifyArticleDeleted(articleId, title) {
  broadcastMessage({
    type: 'article_deleted',
    message: `Article deleted: "${title}"`,
    articleId,
    articleTitle: title
  });
}

export function notifyFileAttached(article, attachment) {
  broadcastMessage({
    type: 'file_attached',
    message: `File "${attachment.filename}" attached to article: "${article.title}"`,
    articleId: article.id,
    articleTitle: article.title,
    attachment: {
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size
    }
  });
}

export function notifyFileDeleted(articleId, articleTitle, filename) {
  broadcastMessage({
    type: 'file_deleted',
    message: `File "${filename}" removed from article: "${articleTitle}"`,
    articleId,
    articleTitle,
    filename
  });
}

