// scripts/upgrade-user-to-admin.js
import { initDb } from '../src/models/index.js';
import env from '../src/config/env.js';

async function upgradeUser() {
  try {
    const db = await initDb();
    const username = env.FOUNDER_GITHUB_USERNAME || "Kaandizz";
    
    const user = await db.User.findOne({ where: { username } });
    
    if (!user) {
      console.log(`User ${username} not found.`);
      return;
    }
    
    await user.update({ role: 'admin' });
    console.log(`User ${username} upgraded to ADMIN successfully.`);
    
  } catch (error) {
    console.error('Error upgrading user:', error);
  } finally {
    process.exit();
  }
}

upgradeUser();
