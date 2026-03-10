'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Some production databases may have pr_decisions without the newer columns
    // (evaluation_status, github_check_run_id). Use IF NOT EXISTS so it is safe.
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS pr_decisions
        ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'PENDING' NOT NULL,
        ADD COLUMN IF NOT EXISTS github_check_run_id BIGINT;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS pr_decisions
        DROP COLUMN IF EXISTS github_check_run_id,
        DROP COLUMN IF EXISTS evaluation_status;
    `);
  }
};

