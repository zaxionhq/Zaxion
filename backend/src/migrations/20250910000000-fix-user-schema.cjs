'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the table exists
    try {
      const tableInfo = await queryInterface.describeTable('users');
      
      // Check if avatarUrl column exists, if not add it
      if (!tableInfo.avatarUrl) {
        await queryInterface.addColumn('users', 'avatarUrl', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }
      
      // Check if authProvider column exists, if not add it
      if (!tableInfo.authProvider) {
        await queryInterface.addColumn('users', 'authProvider', {
          type: Sequelize.ENUM('github'),
          defaultValue: 'github',
        });
      }
      
      // Check if role column exists, if not add it
      if (!tableInfo.role) {
        await queryInterface.addColumn('users', 'role', {
          type: Sequelize.ENUM('user', 'admin'),
          defaultValue: 'user',
          allowNull: false,
        });
      }

      // Check if accessToken column exists, if not add it
      if (!tableInfo.accessToken) {
        await queryInterface.addColumn('users', 'accessToken', {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    try {
      const tableInfo = await queryInterface.describeTable('users');
      
      if (tableInfo.role) {
        await queryInterface.removeColumn('users', 'role');
      }
      
      if (tableInfo.authProvider) {
        await queryInterface.removeColumn('users', 'authProvider');
      }
      
      if (tableInfo.avatarUrl) {
        await queryInterface.removeColumn('users', 'avatarUrl');
      }

      if (tableInfo.accessToken) {
        await queryInterface.removeColumn('users', 'accessToken');
      }
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};