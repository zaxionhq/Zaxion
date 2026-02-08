'use strict';

const logger = require('../utils/logger-bridge.cjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First check if the users table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        logger.log('Users table does not exist, skipping migration');
        return;
      }

      // Get the current table structure
      const tableInfo = await queryInterface.describeTable('users');
      
      // If accessToken column exists, drop it first to recreate it with correct type
      if (tableInfo.accessToken) {
        await queryInterface.removeColumn('users', 'accessToken');
      }
      
      // Add the accessToken column with TEXT type
      await queryInterface.addColumn('users', 'accessToken', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      
      logger.log('Successfully fixed accessToken column in users table');
    } catch (error) {
      logger.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('users');
      
      // Remove the accessToken column if it exists
      if (tableInfo.accessToken) {
        await queryInterface.removeColumn('users', 'accessToken');
      }
    } catch (error) {
      logger.error('Migration rollback error:', error);
      throw error;
    }
  }
};