'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PolicyConfigurations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      policy_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      scope: {
        type: Sequelize.ENUM('GLOBAL', 'ORG', 'REPO', 'BRANCH'),
        allowNull: false
      },
      target_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for faster lookup
    await queryInterface.addIndex('PolicyConfigurations', ['policy_id', 'scope', 'target_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PolicyConfigurations');
  }
};
