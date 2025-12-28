'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create decision_state ENUM
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decision_state') THEN
          CREATE TYPE decision_state AS ENUM ('PENDING', 'PASS', 'BLOCK', 'WARN', 'OVERRIDDEN_PASS');
        END IF;
      END
      $$;
    `);

    // 2. Create pr_decisions table
    await queryInterface.createTable('pr_decisions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      repo_owner: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      repo_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      pr_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      commit_sha: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      policy_version: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      decision: {
        type: 'decision_state',
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // 3. Add Unique Constraint (Idempotency Lock)
    await queryInterface.addConstraint('pr_decisions', {
      fields: ['repo_owner', 'repo_name', 'pr_number', 'commit_sha'],
      type: 'unique',
      name: 'unique_commit_decision'
    });

    // 4. Create pr_overrides table
    await queryInterface.createTable('pr_overrides', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },
      pr_decision_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pr_decisions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_login: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      override_reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('pr_overrides');
    await queryInterface.dropTable('pr_decisions');
    
    // Drop ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS decision_state;');
  }
};
