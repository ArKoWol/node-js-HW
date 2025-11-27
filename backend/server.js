import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import cors from 'cors';
import http from 'http';
import articlesRouter from './routes/articles.js';
import { testConnection } from './models/index.js';
import { initializeWebSocket } from './utils/websocket.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
dotenv.config({ path: path.join(currentDir, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

try {
  await testConnection();
} catch (error) {
  console.error('Failed to connect to database. Please ensure:');
  console.error('1. PostgreSQL is running');
  console.error('2. Database credentials are correct in .env file');
  console.error('3. Database has been created and migrations have been run');
  console.error('\nRun: npm run db:migrate');
  process.exit(1);
}

app.use('/api/articles', articlesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', status: 404 });
});

const server = http.createServer(app);
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Articles API available at http://localhost:${PORT}/api/articles`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});

