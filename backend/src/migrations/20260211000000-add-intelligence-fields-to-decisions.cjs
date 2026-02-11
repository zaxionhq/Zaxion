'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Decisions');

    if (!tableInfo.author_handle) {
      await queryInterface.addColumn('Decisions', 'author_handle', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'GitHub username of the PR author'
      });
    }

    if (!tableInfo.pr_title) {
      await queryInterface.addColumn('Decisions', 'pr_title', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Title of the PR at the time of evaluation'
      });
    }

    if (!tableInfo.base_branch) {
      await queryInterface.addColumn('Decisions', 'base_branch', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'The target branch for the PR (e.g., main, develop)'
      });
    }

    if (!tableInfo.risk_score) {
      await queryInterface.addColumn('Decisions', 'risk_score', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Aggregated risk score (0-100) from Phase 7 engine'
      });
    }

    if (!tableInfo.is_merged) {
      await queryInterface.addColumn('Decisions', 'is_merged', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this PR has been successfully merged'
      });
    }

    if (!tableInfo.merged_at) {
      await queryInterface.addColumn('Decisions', 'merged_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when the PR was merged'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Decisions', 'author_handle');
    await queryInterface.removeColumn('Decisions', 'pr_title');
    await queryInterface.removeColumn('Decisions', 'base_branch');
    await queryInterface.removeColumn('Decisions', 'risk_score');
    await queryInterface.removeColumn('Decisions', 'is_merged');
    await queryInterface.removeColumn('Decisions', 'merged_at');
  }
};
