'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Align Overrides table with the Override model.
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Overrides"
        ADD COLUMN IF NOT EXISTS decision_id UUID,
        ADD COLUMN IF NOT EXISTS evaluation_hash VARCHAR(64),
        ADD COLUMN IF NOT EXISTS target_sha VARCHAR(64),
        ADD COLUMN IF NOT EXISTS category TEXT,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Overrides"
        DROP COLUMN IF EXISTS expires_at,
        DROP COLUMN IF EXISTS category,
        DROP COLUMN IF EXISTS target_sha,
        DROP COLUMN IF EXISTS evaluation_hash,
        DROP COLUMN IF EXISTS decision_id;
    `);
  }
};

