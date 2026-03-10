'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Policies');

    if (!tableInfo.description) {
      await queryInterface.addColumn('Policies', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Detailed description of the policy goals',
      });
    }

    if (!tableInfo.deleted_at) {
      await queryInterface.addColumn('Policies', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableInfo.deleted_by_user_id) {
      await queryInterface.addColumn('Policies', 'deleted_by_user_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!tableInfo.deletion_reason) {
      await queryInterface.addColumn('Policies', 'deletion_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Policies');

    if (tableInfo.deletion_reason) {
      await queryInterface.removeColumn('Policies', 'deletion_reason');
    }
    if (tableInfo.deleted_by_user_id) {
      await queryInterface.removeColumn('Policies', 'deleted_by_user_id');
    }
    if (tableInfo.deleted_at) {
      await queryInterface.removeColumn('Policies', 'deleted_at');
    }
    if (tableInfo.description) {
      await queryInterface.removeColumn('Policies', 'description');
    }
  }
};
