'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('pr_overrides');
      
      if (!tableInfo.category) {
        await queryInterface.addColumn('pr_overrides', 'category', {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'BUSINESS_EXCEPTION'
        });
      }
      
      if (!tableInfo.ttl_hours) {
        await queryInterface.addColumn('pr_overrides', 'ttl_hours', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 24
        });
      }
      
      console.log('Migration 20260203000000-add-category-ttl-to-pr-overrides successful');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('pr_overrides', 'category');
      await queryInterface.removeColumn('pr_overrides', 'ttl_hours');
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
