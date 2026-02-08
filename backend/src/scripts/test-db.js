// src/scripts/test-db.js
import 'dotenv/config.js';
import sequelize from '../config/sequelize.js';
import * as logger from '../utils/logger.js';

(async () => {
  logger.log('Testing database connection...');
  
  try {
    await sequelize.authenticate();
    logger.log(`Database connected successfully: ${process.env.DB_NAME}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1); // Exit with error
  } finally {
    await sequelize.close(); // Clean up connection
    process.exit(0);
  }
})();
