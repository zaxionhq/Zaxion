'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Additional Decisions fields used by dashboards/simulation responses.
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Decisions"
        ADD COLUMN IF NOT EXISTS repo_full_name TEXT,
        ADD COLUMN IF NOT EXISTS violations_details JSONB;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Decisions"
        DROP COLUMN IF EXISTS violations_details,
        DROP COLUMN IF EXISTS repo_full_name;
    `);
  }
};
