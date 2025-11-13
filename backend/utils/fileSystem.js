import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

export const DATA_DIR = path.join(currentDir, '..', 'data');

export async function initializeDataDirectory() {
  try {
    await fs.access(DATA_DIR);
    console.log('Data directory exists:', DATA_DIR);
  } catch (error) {
    console.log('Creating data directory:', DATA_DIR);
    await fs.mkdir(DATA_DIR, { recursive: true });
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

export function generateFilename(title) {
  const timestamp = Date.now();
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  return `${timestamp}-${safeName}.json`;
}

export async function findFileByArticleId(articleId) {
  try {
    const files = await getAllArticleFiles();
    
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

