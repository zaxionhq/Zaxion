'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Decisions Table
    await queryInterface.createTable('Decisions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      fact_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'The data being evaluated (e.g., PR UUID)',
      },
      result: {
        type: Sequelize.ENUM('PASS', 'BLOCK', 'WARN'),
        allowNull: false,
      },
      rationale: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      override_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Overrides',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      previous_decision_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Decisions',
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

    // 2. Create GovernanceSignals Table
    await queryInterface.createTable('GovernanceSignals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('BYPASS_VELOCITY', 'POLICY_DRIFT', 'COMPLIANCE_GAP'),
        allowNull: false,
      },
      target_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Org, Repo, or Team UUID',
      },
      signal_level: {
        type: Sequelize.ENUM('INFO', 'ATTENTION', 'ANOMALY'),
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
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

    // 3. Create DerivedPolicyMetrics Table
    await queryInterface.createTable('DerivedPolicyMetrics', {
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
      version_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'PolicyVersions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      total_evaluations: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_blocks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_overrides: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      policy_challenge_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex('Decisions', ['fact_id']);
    await queryInterface.addIndex('Decisions', ['policy_version_id']);
    await queryInterface.addIndex('GovernanceSignals', ['target_id']);
    await queryInterface.addIndex('GovernanceSignals', ['type']);
    await queryInterface.addIndex('DerivedPolicyMetrics', ['policy_id', 'version_id'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DerivedPolicyMetrics');
    await queryInterface.dropTable('GovernanceSignals');
    await queryInterface.dropTable('Decisions');
  },
};
