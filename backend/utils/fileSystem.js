import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

export const DATA_DIR = path.join(currentDir, '..', 'data');
export const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

export async function initializeDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(ATTACHMENTS_DIR);
  } catch (error) {
    await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  }
}

export async function getAllArticleFiles() {
  try {
    const files = await fs.readdir(DATA_DIR);
    return files.filter(file => file.endsWith('.json'));
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

export async function readArticleFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeArticleFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function articleFileExists(filename) {
  try {
    await fs.access(path.join(DATA_DIR, filename));
    return true;
  } catch {
    return false;
  }
}

export function generateFilename(title, articleId) {
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  return `${articleId}__${safeName}.json`;
}

export function getFilenameFromArticleId(articleId) {
  return `${articleId}__`;
}

export async function findFileByArticleId(articleId) {
  try {
    const files = await getAllArticleFiles();
    const prefix = getFilenameFromArticleId(articleId);
    
    const matchingFile = files.find(file => file.startsWith(prefix));
    
    if (matchingFile) {
      return matchingFile;
    }
    
    for (const file of files) {
      try {
        const article = await readArticleFile(file);
        if (article.id === articleId) {
          return file;
        }
      } catch (error) {
        console.error(`Error reading article ${file}:`, error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding article file:', error);
    return null;
  }
}

export async function deleteArticleFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.unlink(filePath);
}

export async function saveAttachment(file, articleId) {
  const timestamp = Date.now();
  const sanitizedFilename = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);
  const filename = `${articleId}_${timestamp}_${sanitizedFilename}`;
  const filePath = path.join(ATTACHMENTS_DIR, filename);
  
  await fs.writeFile(filePath, file.buffer);
  
  return {
    id: `attachment-${timestamp}`,
    filename: sanitizedFilename,
    storedFilename: filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString()
  };
}

export async function deleteAttachment(storedFilename) {
  const filePath = path.join(ATTACHMENTS_DIR, storedFilename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting attachment:', error);
    }
  }
  return true;
}

export async function getAttachmentPath(storedFilename) {
  return path.join(ATTACHMENTS_DIR, storedFilename);
}

