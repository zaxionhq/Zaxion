// src/scripts/test-db.js
import 'dotenv/config.js';
import sequelize from '../config/sequelize.js';

(async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected successfully: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // Exit with error
  } finally {
    await sequelize.close(); // Clean up connection
    process.exit(0);
  }
})();
