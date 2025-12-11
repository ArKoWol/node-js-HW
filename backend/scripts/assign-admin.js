import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import User from '../models/User.js';
import { testConnection } from '../models/index.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
dotenv.config({ path: path.join(currentDir, '..', '..', '.env') });

async function assignAdmin() {
  try {
    await testConnection();
    console.log('✓ Database connection successful');

    const email = process.argv[2];

    if (!email) {
      console.error('Error: Email is required');
      console.log('\nUsage: node scripts/assign-admin.js <email>');
      console.log('Example: node scripts/assign-admin.js admin@example.com');
      process.exit(1);
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      console.error(`Error: User with email "${email}" not found`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`✓ User "${email}" is already an admin`);
      process.exit(0);
    }

    await user.update({ role: 'admin' });

    console.log(`✓ Successfully assigned admin role to "${email}"`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

assignAdmin();

