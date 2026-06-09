'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const base = {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      cache_key: {
        type: Sequelize.STRING(512),
        allowNull: false,
        unique: true,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      engine_version: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'incr-v1',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    };

    await queryInterface.createTable('incremental_node_cache', base);
    await queryInterface.createTable('incremental_policy_cache', base);
    await queryInterface.createTable('incremental_parse_artifacts', base);

    for (const table of ['incremental_node_cache', 'incremental_policy_cache', 'incremental_parse_artifacts']) {
      await queryInterface.addIndex(table, ['expires_at']);
      await queryInterface.addIndex(table, ['engine_version']);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('incremental_parse_artifacts');
    await queryInterface.dropTable('incremental_policy_cache');
    await queryInterface.dropTable('incremental_node_cache');
  },
};
