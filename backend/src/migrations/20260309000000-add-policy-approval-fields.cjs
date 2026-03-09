'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Policies', 'status', {
      type: Sequelize.ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'),
      defaultValue: 'DRAFT',
      allowNull: false,
    });
    await queryInterface.addColumn('Policies', 'is_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('Policies', 'created_by', {
      type: Sequelize.UUID,
      allowNull: true, // Allow null for existing policies or system policies
      references: {
        model: 'users', // Note: User table name is 'users' (lowercase) in User model definition
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Policies', 'approved_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Policies', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Policies', 'status');
    await queryInterface.removeColumn('Policies', 'is_enabled');
    await queryInterface.removeColumn('Policies', 'created_by');
    await queryInterface.removeColumn('Policies', 'approved_by');
    await queryInterface.removeColumn('Policies', 'approved_at');
    // We might need to drop the ENUM type if Postgres, but typically sequelize handles it or leaves it.
  }
};
