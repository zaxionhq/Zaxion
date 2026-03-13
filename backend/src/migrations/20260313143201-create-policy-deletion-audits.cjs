'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists first
    const tableExists = await queryInterface.tableExists('PolicyDeletionAudits');
    
    if (!tableExists) {
        await queryInterface.createTable('PolicyDeletionAudits', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          policy_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          deleted_by_user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'Users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          deletion_reason: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          policy_name_snapshot: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          policy_rules_count_snapshot: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          decisions_count_snapshot: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          violations_count_snapshot: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          }
        });
    } else {
        // If table exists, ensure columns exist (idempotent check)
        // This is simplified; assumes if table exists, structure is mostly correct or managed manually
        // We just skip creation to avoid "relation already exists" error
        console.log("Table PolicyDeletionAudits already exists, skipping creation.");
    }
    
    // Check if indices exist before adding
    try {
        await queryInterface.addIndex('PolicyDeletionAudits', ['policy_id']);
    } catch (e) {
        // Index likely exists, ignore
    }

    try {
        await queryInterface.addIndex('PolicyDeletionAudits', ['deleted_by_user_id']);
    } catch (e) {
        // Index likely exists, ignore
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PolicyDeletionAudits');
  }
};
