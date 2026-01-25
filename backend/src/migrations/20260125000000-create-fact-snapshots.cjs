'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fact_snapshots', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      repo_full_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      pr_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      commit_sha: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      snapshot_version: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: '1.0.0'
      },
      ingested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Add unique constraint for deduplication as per Pillar 5.1 requirements
    await queryInterface.addConstraint('fact_snapshots', {
      fields: ['repo_full_name', 'commit_sha'],
      type: 'unique',
      name: 'unique_repo_commit_snapshot'
    });

    // Add index for fast lookup by repo and PR
    await queryInterface.addIndex('fact_snapshots', ['repo_full_name', 'pr_number']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('fact_snapshots');
  }
};
