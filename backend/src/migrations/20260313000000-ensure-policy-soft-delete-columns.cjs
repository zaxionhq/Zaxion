'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Use Postgres-native "IF NOT EXISTS" so this is safe/idempotent.
    // This migration exists to recover from cases where SequelizeMeta says "up to date"
    // but the actual DB is missing columns (e.g. migration ran against a different DB).
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Policies"
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "deleted_by_user_id" UUID,
        ADD COLUMN IF NOT EXISTS "deletion_reason" TEXT;
    `);

    // Add FK only if it doesn't already exist.
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'Policies_deleted_by_user_id_fkey'
        ) THEN
          ALTER TABLE "Policies"
            ADD CONSTRAINT "Policies_deleted_by_user_id_fkey"
            FOREIGN KEY ("deleted_by_user_id")
            REFERENCES "users" ("id")
            ON UPDATE CASCADE
            ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS "Policies"
        DROP COLUMN IF EXISTS "deletion_reason",
        DROP COLUMN IF EXISTS "deleted_by_user_id",
        DROP COLUMN IF EXISTS "deleted_at",
        DROP COLUMN IF EXISTS "description";
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'Policies_deleted_by_user_id_fkey'
        ) THEN
          ALTER TABLE "Policies" DROP CONSTRAINT "Policies_deleted_by_user_id_fkey";
        END IF;
      END $$;
    `);
  }
};

