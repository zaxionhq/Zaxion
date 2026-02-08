import { Client } from 'pg';
import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';

dotenv.config({ path: './.env' });

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.LOCAL_DB_HOST || process.env.DB_HOST;
const dbPort = process.env.DB_PORT;

async function createDatabase() {
  // Connect to the default postgres database to create our new one
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    logger.info(`Connected to PostgreSQL server at ${dbHost}:${dbPort}`);

    // Check if database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (res.rowCount === 0) {
      // Database does not exist, create it
      await client.query(`CREATE DATABASE "${dbName}"`);
      logger.info(`Database "${dbName}" created successfully.`);
    } else {
      logger.info(`Database "${dbName}" already exists. Skipping creation.`);
    }
  } catch (error) {
    logger.error(`Error creating database "${dbName}"`, { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
