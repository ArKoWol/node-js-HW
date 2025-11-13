import { WebSocketServer } from 'ws';

let wss = null;

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false,
    maxPayload: 100 * 1024
  });
  
  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`WebSocket client connected from ${clientIp}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message from client:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log(`WebSocket client disconnected from ${clientIp}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to article notification system',
      timestamp: new Date().toISOString()
    }));
  });
  
  console.log('WebSocket server initialized on path /ws');
  return wss;
}

export function broadcastNotification(notification) {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }
  
  const message = JSON.stringify({
    ...notification,
    timestamp: new Date().toISOString()
  });
  
  let clientCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { 
      client.send(message);
      clientCount++;
    }
  });
  
  console.log(`Broadcast notification to ${clientCount} client(s):`, notification.type);
}

export function notifyArticleCreated(article) {
  broadcastNotification({
    type: 'article_created',
    message: `New article created: "${article.title}"`,
    articleId: article.id,
    articleTitle: article.title
  });
}

export function notifyArticleUpdated(article) {
  broadcastNotification({
    type: 'article_updated',
    message: `Article updated: "${article.title}"`,
    articleId: article.id,
    articleTitle: article.title
  });
}

export function notifyArticleDeleted(articleId, title) {
  broadcastNotification({
    type: 'article_deleted',
    message: `Article deleted: "${title}"`,
    articleId,
    articleTitle: title
  });
}

export function notifyFileAttached(article, attachment) {
  broadcastNotification({
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
  broadcastNotification({
    type: 'file_deleted',
    message: `File "${filename}" removed from article: "${articleTitle}"`,
    articleId,
    articleTitle,
    filename
  });
}

