'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SharedReports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      share_token: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM('founder_audit', 'policy_simulation'),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      report_html: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('SharedReports', ['share_token'], { unique: true });
    await queryInterface.addIndex('SharedReports', ['expires_at']);

    await queryInterface.addIndex('Decisions', ['created_at'], {
      name: 'decisions_created_at_idx',
    });
    await queryInterface.addIndex('Decisions', ['result'], {
      name: 'decisions_result_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Decisions', 'decisions_result_idx').catch(() => {});
    await queryInterface.removeIndex('Decisions', 'decisions_created_at_idx').catch(() => {});
    await queryInterface.dropTable('SharedReports');
  },
};
