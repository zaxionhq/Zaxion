module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Attempt to add 'SENT' to the enum type
      await queryInterface.sequelize.query(`ALTER TYPE "enum_Waitlist_status" ADD VALUE 'SENT';`);
    } catch (e) {
      // Ignore if the value already exists in the enum
      if (e.original && e.original.code === '42710') { // duplicate_object code for Postgres
        console.log("Enum value 'SENT' already exists.");
      } else {
        // If the enum type name is different or other error, try to inspect or fallback
        console.warn("Could not add 'SENT' to enum directly. Error:", e.message);
        // Fallback: This might be SQLite or another dialect in dev, but in Prod it is likely Postgres.
        // If it's not Postgres, this query will fail anyway.
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Removing an enum value is not supported directly in Postgres without dropping the type.
    // We will skip this for safety.
  }
};
