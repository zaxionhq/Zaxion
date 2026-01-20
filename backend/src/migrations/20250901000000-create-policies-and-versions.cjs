'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Policies Table
    await queryInterface.createTable('Policies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      scope: {
        type: Sequelize.ENUM('ORG', 'REPO'),
        allowNull: false,
      },
      target_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'UUID of the Organization or Repository',
      },
      owning_role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // 2. Create PolicyVersions Table
    await queryInterface.createTable('PolicyVersions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      policy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Policies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      enforcement_level: {
        type: Sequelize.ENUM('MANDATORY', 'OVERRIDABLE', 'ADVISORY'),
        allowNull: false,
      },
      rules_logic: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        // Assuming Users table exists from previous context
        references: {
          model: 'users', // Note: usually lowercase table name in Postgres/Sequelize default
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', 
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Add composite unique index for PolicyVersions to ensure version numbers are unique per policy
    await queryInterface.addIndex('PolicyVersions', ['policy_id', 'version_number'], {
      unique: true,
      name: 'unique_policy_version',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PolicyVersions');
    await queryInterface.dropTable('Policies');
  },
};
