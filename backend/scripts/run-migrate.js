import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend .env file first, then root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Construct the DATABASE_URL explicitly for sequelize-cli --url
const dbUser = process.env.APP_DB_USER || process.env.DB_USER;
const dbPassword = process.env.APP_DB_PASSWORD || process.env.DB_PASSWORD;
const dbHost = process.env.LOCAL_DB_HOST || process.env.DB_HOST;
const dbPort = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME;

const databaseUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

// Construct the sequelize-cli command with all necessary arguments, using --url
const sequelizeCliPath = path.resolve(__dirname, '../node_modules/sequelize-cli/lib/sequelize');
const sequelizeCliCommand = `node ${sequelizeCliPath} db:migrate --url "${databaseUrl}" --config src/config/config.cjs --migrations-path src/migrations --models-path src/models`;

try {
  logger.info('Running Sequelize migrations...');
  // Execute the command synchronously with environment variables
  execSync(sequelizeCliCommand, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'), // Set CWD to the backend directory
    env: {
      ...process.env,
      // DATABASE_URL is now passed via --url, so no need to explicitly pass individual vars here
    },
  });
  logger.info('Sequelize migrations completed successfully.');
} catch (error) {
  logger.error('Error running Sequelize migrations', { error: error.message });
  process.exit(1);
}
