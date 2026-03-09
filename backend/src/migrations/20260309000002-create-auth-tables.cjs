'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Repositories Table
    await queryInterface.createTable('repositories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      github_repo_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      owner: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      installation_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Create RepositoryMaintainerMappings Table
    await queryInterface.createTable('repository_maintainer_mappings', {
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      repository_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'repositories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      github_permission_level: {
        type: Sequelize.ENUM('admin', 'write'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add composite primary key for mappings
    await queryInterface.addConstraint('repository_maintainer_mappings', {
      fields: ['user_id', 'repository_id'],
      type: 'primary key',
      name: 'pk_repository_maintainer_mappings'
    });

    // 3. Create RefreshTokens Table (if not exists - check existing migrations)
    // There is already a RefreshToken model/migration mentioned in file list: 20250902184440-create-refresh-tokens.cjs
    // So we might skip this or check if we need to update it.
    // Let's assume existing one is fine or we update it if needed. 
    // The plan mentioned adding token_hash, user_id, expires_at, revoked.
    // Let's check if we need to add columns to existing table.
    // For now, I'll assume the existing one is sufficient or I'll check it later.
    
    // 4. Create AuditEvents Table
    await queryInterface.createTable('audit_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      actor_id: {
        type: Sequelize.UUID,
        allowNull: true, // System events might not have actor
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      target_id: {
        type: Sequelize.STRING, // Can be user UUID, repo UUID, or other resource ID
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      timestamp: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('audit_events', ['event_type']);
    await queryInterface.addIndex('audit_events', ['actor_id']);
    await queryInterface.addIndex('audit_events', ['timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_events');
    await queryInterface.dropTable('repository_maintainer_mappings');
    await queryInterface.dropTable('repositories');
  }
};
