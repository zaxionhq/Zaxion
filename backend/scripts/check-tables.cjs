const { Sequelize } = require('sequelize');
const config = require('../src/config/database.js'); // Adjust path if needed

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: false
});

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables:', tables);
    
    // Check repository_maintainer_mappings schema
    if (tables.includes('repository_maintainer_mappings')) {
        const constraints = await sequelize.getQueryInterface().showConstraint('repository_maintainer_mappings');
        console.log('Constraints on repository_maintainer_mappings:', constraints);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables();
