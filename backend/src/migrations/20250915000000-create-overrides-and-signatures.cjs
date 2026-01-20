'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Overrides Table
    await queryInterface.createTable('Overrides', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      subject_ref: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'JSON containing type (PR_CHECK|POLICY_EVALUATION) and external_id',
      },
      policy_version_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'PolicyVersions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'PENDING',
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

    // 2. Create OverrideSignatures Table
    await queryInterface.createTable('OverrideSignatures', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      override_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Overrides',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role_at_signing: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      justification: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      commit_sha: {
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

    // Add indexes
    await queryInterface.addIndex('Overrides', ['status']);
    await queryInterface.addIndex('OverrideSignatures', ['override_id']);
    await queryInterface.addIndex('OverrideSignatures', ['actor_id']);
    await queryInterface.addIndex('OverrideSignatures', ['commit_sha']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('OverrideSignatures');
    await queryInterface.dropTable('Overrides');
  },
};
