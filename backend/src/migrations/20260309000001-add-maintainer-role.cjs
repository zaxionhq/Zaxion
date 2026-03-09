'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the dialect is Postgres, as ENUM modification is dialect-specific
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // For Postgres, we need to add the value to the ENUM type
      // The name of the enum type is typically "enum_users_role"
      try {
        await queryInterface.sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE 'maintainer';`);
      } catch (e) {
        // If the value already exists, Postgres might throw an error or notice.
        // We can ignore it if it says "already exists" but safer to wrap.
        console.warn('Potential warning when adding ENUM value:', e.message);
      }
    } else if (dialect === 'mysql') {
       // For MySQL, we modify the column definition
       await queryInterface.changeColumn('users', 'role', {
          type: Sequelize.ENUM('user', 'admin', 'maintainer'),
          defaultValue: 'user',
          allowNull: false
       });
    } else {
      // For SQLite or others that might not support native ENUMs strictly or handled differently by Sequelize
      // SQLite doesn't support ALTER COLUMN to change constraints easily, usually requires table recreation.
      // But Sequelize often emulates ENUMs as TEXT with CHECK constraints in SQLite.
      // If we are just using text, this might be fine, but let's assume we are targeting the production DB behavior.
      console.warn('Skipping ENUM update for dialect:', dialect);
    }
  },

  async down(queryInterface, Sequelize) {
    // Removing an ENUM value is not easily supported in Postgres without dropping the type.
    // Usually, we don't revert adding an enum value in production as it might be in use.
    // For MySQL, we can revert the column definition.
    const dialect = queryInterface.sequelize.getDialect();
    
    if (dialect === 'mysql') {
        await queryInterface.changeColumn('users', 'role', {
            type: Sequelize.ENUM('user', 'admin'),
            defaultValue: 'user',
            allowNull: false
        });
    }
    // Postgres down migration for ENUM value removal is complex and risky, skipping.
  }
};
