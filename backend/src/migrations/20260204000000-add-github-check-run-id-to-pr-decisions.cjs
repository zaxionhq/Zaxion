'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('pr_decisions');
      if (!tableInfo.github_check_run_id) {
        await queryInterface.addColumn('pr_decisions', 'github_check_run_id', {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'Link to the GitHub Check Run for precise PATCHing'
        });
      }
      console.log('Migration 20260204000000-add-github-check-run-id-to-pr-decisions successful');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('pr_decisions', 'github_check_run_id');
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
