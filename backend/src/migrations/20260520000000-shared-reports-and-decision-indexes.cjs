'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((t) => (typeof t === 'string' ? t : t.tableName || t));

    if (!tableNames.includes('SharedReports')) {
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
          references: { model: 'users', key: 'id' },
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
    }

    const sharedIndexes = await queryInterface.showIndex('SharedReports').catch(() => []);
    const sharedIndexNames = sharedIndexes.map((i) => i.name);
    if (!sharedIndexNames.includes('shared_reports_share_token')) {
      await queryInterface.addIndex('SharedReports', ['share_token'], {
        unique: true,
        name: 'shared_reports_share_token',
      });
    }
    if (!sharedIndexNames.includes('shared_reports_expires_at')) {
      await queryInterface.addIndex('SharedReports', ['expires_at'], {
        name: 'shared_reports_expires_at',
      });
    }

    if (tableNames.includes('Decisions')) {
      const decisionIndexes = await queryInterface.showIndex('Decisions').catch(() => []);
      const decisionIndexNames = decisionIndexes.map((i) => i.name);
      // Decisions table uses camelCase timestamp columns (see 20250920000000 migration).
      if (!decisionIndexNames.includes('decisions_created_at_idx')) {
        await queryInterface.addIndex('Decisions', ['createdAt'], {
          name: 'decisions_created_at_idx',
        });
      }
      if (!decisionIndexNames.includes('decisions_result_idx')) {
        await queryInterface.addIndex('Decisions', ['result'], {
          name: 'decisions_result_idx',
        });
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Decisions', 'decisions_result_idx').catch(() => {});
    await queryInterface.removeIndex('Decisions', 'decisions_created_at_idx').catch(() => {});
    await queryInterface.dropTable('SharedReports');
  },
};
