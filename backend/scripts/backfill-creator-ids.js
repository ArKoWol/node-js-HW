import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import Article from '../models/Article.js';
import ArticleVersion from '../models/ArticleVersion.js';
import User from '../models/User.js';
import { testConnection } from '../models/index.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
dotenv.config({ path: path.join(currentDir, '..', '..', '.env') });

async function backfillCreatorIds() {
  try {
    await testConnection();
    console.log('✓ Database connection successful\n');

    const articles = await Article.findAll({
      where: {
        creatorId: null
      },
      attributes: ['id', 'creatorId', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    console.log(`Found ${articles.length} articles without creatorId\n`);

    if (articles.length === 0) {
      console.log('✓ All articles already have creatorId assigned!');
      process.exit(0);
    }

    const users = await User.findAll({
      attributes: ['id', 'email', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    console.log(`Found ${users.length} users in the system\n`);

    if (users.length === 0) {
      console.log('No users found. Cannot assign creators.');
      process.exit(1);
    }

    console.log('Users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    
    let assignedCount = 0;
    const firstUserId = users[0].id;

    for (const article of articles) {
      let assignedUserId = firstUserId;
      
      for (const user of users) {
        if (new Date(user.createdAt) <= new Date(article.createdAt)) {
          assignedUserId = user.id;
        } else {
          break;
        }
      }

      await article.update({ creatorId: assignedUserId });
      assignedCount++;

      const assignedUser = users.find(u => u.id === assignedUserId);
      console.log(`✓ Assigned article ${article.id} to ${assignedUser?.email || assignedUserId}`);
    }

    console.log(`\n✓ Successfully assigned creatorId to ${assignedCount} articles`);
    console.log('\nNote: This is a heuristic assignment based on creation dates.');
    console.log('You may want to verify and manually adjust assignments if needed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

backfillCreatorIds();

