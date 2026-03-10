'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Ensure columns expected by the PolicyVersion model exist in the DB.
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "PolicyVersions"
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "PolicyVersions"
        DROP COLUMN IF EXISTS "deleted_at",
        DROP COLUMN IF EXISTS "description";
    `);
  }
};

