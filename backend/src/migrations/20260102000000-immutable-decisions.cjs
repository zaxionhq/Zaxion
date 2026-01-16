'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Add evaluation_status column if it doesn't exist
      const tableInfo = await queryInterface.describeTable('pr_decisions');
      if (!tableInfo.evaluation_status) {
        await queryInterface.addColumn('pr_decisions', 'evaluation_status', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'PENDING'
        });
      }

      // 2. Add DB-level Trigger for Immutability (Postgres specific)
      // This trigger prevents ANY update to a record once it is marked as FINAL.
      // The only way to "change" a decision is to push a new commit (new SHA).
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION protect_final_decisions() 
        RETURNS TRIGGER AS $$
        BEGIN
          IF OLD.evaluation_status = 'FINAL' THEN
            RAISE EXCEPTION 'PR Decision is FINAL and immutable. Updates are rejected for audit integrity.';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_protect_final_decisions ON pr_decisions;
        CREATE TRIGGER trigger_protect_final_decisions
        BEFORE UPDATE ON pr_decisions
        FOR EACH ROW EXECUTE FUNCTION protect_final_decisions();
      `);

      console.log('Migration 20260102000000-immutable-decisions successful');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS trigger_protect_final_decisions ON pr_decisions;');
      await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS protect_final_decisions();');
      await queryInterface.removeColumn('pr_decisions', 'evaluation_status');
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
