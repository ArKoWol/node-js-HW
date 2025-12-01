#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Article from './models/Article.js';
import Workspace from './models/Workspace.js';
import { sequelize } from './models/index.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

async function migrateData() {
  try {
    await sequelize.authenticate();
    const defaultWorkspace = await Workspace.findOne({ where: { slug: 'general' } }) ||
      await Workspace.findOne();

    if (!defaultWorkspace) {
      throw new Error('No workspaces found; run migrations first');
    }
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    if (jsonFiles.length === 0) return;

    let migrated = 0;

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
      const article = JSON.parse(content);

      const exists = await Article.findOne({ where: { title: article.title } });
      if (exists) continue;

      await Article.create({
        title: article.title,
        content: article.content,
        author: article.author || 'Anonymous',
        workspaceId: defaultWorkspace.id
      });
      
      console.log(`✓ ${article.title}`);
      migrated++;
    }

    console.log(`\n✓ Migrated ${migrated}/${jsonFiles.length} articles`);
    process.exit(0);
  } catch (error) {
    console.error('✗', error.message);
    process.exit(1);
  }
}

migrateData();

