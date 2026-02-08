'use strict';

const logger = require('../utils/logger-bridge.cjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the table exists
    try {
      const tableInfo = await queryInterface.describeTable('users');
      
      // Check if displayName column exists, if not add it
      if (!tableInfo.displayName) {
        await queryInterface.addColumn('users', 'displayName', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
      
      // Check if provider column exists, if not add it
      if (!tableInfo.provider) {
        await queryInterface.addColumn('users', 'provider', {
          type: Sequelize.STRING,
          defaultValue: 'github',
        });
      }
    } catch (error) {
      logger.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    try {
      const tableInfo = await queryInterface.describeTable('users');
      
      if (tableInfo.provider) {
        await queryInterface.removeColumn('users', 'provider');
      }
      
      if (tableInfo.displayName) {
        await queryInterface.removeColumn('users', 'displayName');
      }
    } catch (error) {
      logger.error('Migration rollback error:', error);
      throw error;
    }
  }
};