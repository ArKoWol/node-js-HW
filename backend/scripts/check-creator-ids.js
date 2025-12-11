import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Article from '../models/Article.js';
import ArticleVersion from '../models/ArticleVersion.js';
import { testConnection } from '../models/index.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
dotenv.config({ path: path.join(currentDir, '..', '..', '.env') });

async function checkCreatorIds() {
  try {
    await testConnection();
    console.log('✓ Database connection successful\n');

    const articles = await Article.findAll({
      attributes: ['id', 'creatorId', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    console.log(`Total articles: ${articles.length}\n`);

    const articlesWithoutCreator = articles.filter(a => !a.creatorId);
    const articlesWithCreator = articles.filter(a => a.creatorId);

    console.log(`Articles with creatorId: ${articlesWithCreator.length}`);
    console.log(`Articles without creatorId: ${articlesWithoutCreator.length}\n`);

    if (articlesWithoutCreator.length > 0) {
      console.log('Articles missing creatorId:');
      for (const article of articlesWithoutCreator) {
        const firstVersion = await ArticleVersion.findOne({
          where: {
            articleId: article.id,
            versionNumber: 1,
          },
          attributes: ['author', 'createdAt'],
        });

        console.log(`  - Article ID: ${article.id}`);
        console.log(`    Created: ${article.createdAt}`);
        if (firstVersion) {
          console.log(`    Author (from version): ${firstVersion.author}`);
        }
        console.log('');
      }
      console.log('\nNote: Articles created before the creatorId migration will have null creatorId.');
      console.log('These articles can only be edited/deleted by admins.');
    } else {
      console.log('✓ All articles have creatorId assigned!');
    }

    if (articlesWithCreator.length > 0) {
      console.log('\nSample articles with creatorId:');
      for (const article of articlesWithCreator.slice(0, 5)) {
        console.log(`  - Article ID: ${article.id}, Creator ID: ${article.creatorId}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkCreatorIds();

