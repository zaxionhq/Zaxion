'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First check if the users table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        console.log('Users table does not exist, skipping migration');
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
      
      console.log('Successfully fixed accessToken column in users table');
    } catch (error) {
      console.error('Migration error:', error);
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
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};