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

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
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

  return wss;
}

export function broadcastMessage(messageData) {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }
  
  const message = JSON.stringify({
    ...messageData,
    timestamp: new Date().toISOString()
  });
  
  let clientCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { 
      client.send(message);
      clientCount++;
    }
  });
}

