'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check if the column exists
    const tableInfo = await queryInterface.describeTable('users');
    
    // Add githubId column if it doesn't exist
    if (!tableInfo.githubId) {
      // First add the column as nullable
      await queryInterface.addColumn('users', 'githubId', {
        type: Sequelize.STRING,
        allowNull: true, // Initially allow null
      });
      
      // Set a default value for existing records
      // Using a temporary value with a prefix to avoid conflicts
      await queryInterface.sequelize.query(
        `UPDATE "users" SET "githubId" = 'temp_' || id WHERE "githubId" IS NULL`
      );
      
      // Now make the column non-nullable and unique
      await queryInterface.changeColumn('users', 'githubId', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      });
    }
    
    // Add other missing columns if needed
    if (!tableInfo.avatarUrl) {
      await queryInterface.addColumn('users', 'avatarUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    
    if (!tableInfo.authProvider) {
      await queryInterface.addColumn('users', 'authProvider', {
        type: Sequelize.ENUM('github'),
        defaultValue: 'github',
      });
    }
    
    if (!tableInfo.role) {
      await queryInterface.addColumn('users', 'role', {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
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
    
    // Don't remove githubId as it's a critical column
  }
};