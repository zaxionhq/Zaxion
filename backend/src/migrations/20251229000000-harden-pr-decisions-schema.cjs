'use strict';

const logger = require('../utils/logger-bridge.cjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('pr_decisions');

      // 1. Add started_at column
      if (!tableInfo.started_at) {
        await queryInterface.addColumn('pr_decisions', 'started_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('NOW()')
        });
      }

      // 2. Ensure unique_pr_sha constraint exists
      // The previous migration had 'unique_commit_decision', we'll rename or ensure the correct one exists.
      try {
        await queryInterface.removeConstraint('pr_decisions', 'unique_commit_decision');
      } catch (e) {
        // Ignore if it doesn't exist
      }

      await queryInterface.addConstraint('pr_decisions', {
        fields: ['repo_owner', 'repo_name', 'pr_number', 'commit_sha'],
        type: 'unique',
        name: 'unique_pr_sha'
      });

      // 3. Add decision check constraint (Postgres specific)
      await queryInterface.sequelize.query(`
        ALTER TABLE pr_decisions 
        DROP CONSTRAINT IF EXISTS check_decision_valid;
        
        ALTER TABLE pr_decisions 
        ADD CONSTRAINT check_decision_valid 
        CHECK (decision::text IN ('PENDING', 'PASS', 'BLOCK', 'WARN', 'OVERRIDDEN_PASS'));
      `);

      logger.log('Migration 20251229000000-harden-pr-decisions-schema successful');
    } catch (error) {
      logger.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('pr_decisions', 'started_at');
      await queryInterface.removeConstraint('pr_decisions', 'unique_pr_sha');
      await queryInterface.sequelize.query('ALTER TABLE pr_decisions DROP CONSTRAINT IF EXISTS check_decision_valid;');
    } catch (error) {
      logger.error('Migration rollback error:', error);
      throw error;
    }
  }
};
