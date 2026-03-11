'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PolicySimulations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      simulation_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'Pillar 3.3: hash(draft_policy + snapshot_ids + engine_version)',
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
      draft_rules: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'The rules_logic of the draft policy version being simulated',
      },
      engine_version: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      sample_strategy: {
        type: Sequelize.ENUM('TIME_BASED', 'REPO_BASED', 'RISK_BASED'),
        allowNull: false,
        defaultValue: 'TIME_BASED',
      },
      sample_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      results: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Aggregated simulation results (pass rate change, newly blocked PRs, etc.)',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PolicySimulations');
  }
};
