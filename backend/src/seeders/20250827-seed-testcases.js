// src/seeders/20250827-seed-testcases.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Look for user we seeded; if not found, skip.
    // Note: queryInterface.rawSelect works with Postgres; this is best-effort for a compact seeder.
    const user = await queryInterface.rawSelect('users', {
      where: { username: 'dev_test_user' },
    }, ['id']);

    const userId = user || null;

    await queryInterface.bulkInsert('test_cases', [
      {
        id: uuidv4(),
        userId,
        filePath: 'src/services/UserService.ts',
        title: 'UserService - create & get',
        description: 'Basic tests for creating and fetching users',
        code: `// sample generated test (mock)\ntest('create user', () => {});`,
        language: 'typescript',
        metadata: JSON.stringify({ estimatedTests: 2 }),
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('test_cases', { title: 'UserService - create & get' }, {});
  }
};
