'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Align the Decisions table with the Decision model by ensuring
    // all newer columns exist. Uses IF NOT EXISTS so it's safe/idempotent.
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Decisions"
        ADD COLUMN IF NOT EXISTS evaluation_hash VARCHAR(64),
        ADD COLUMN IF NOT EXISTS github_check_run_id BIGINT,
        ADD COLUMN IF NOT EXISTS author_handle TEXT,
        ADD COLUMN IF NOT EXISTS pr_title TEXT,
        ADD COLUMN IF NOT EXISTS base_branch TEXT,
        ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT FALSE NOT NULL,
        ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;
    `);
    }
,

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Decisions"
        DROP COLUMN IF EXISTS merged_at,
        DROP COLUMN IF EXISTS is_merged,
        DROP COLUMN IF EXISTS risk_score,
        DROP COLUMN IF EXISTS base_branch,
        DROP COLUMN IF EXISTS pr_title,
        DROP COLUMN IF EXISTS author_handle,
        DROP COLUMN IF EXISTS github_check_run_id,
        DROP COLUMN IF EXISTS evaluation_hash;
    `);
  }
};

