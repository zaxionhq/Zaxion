// src/seeders/20250827-seed-users.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    // NOTE: accessToken intentionally left null; you'll log in via GitHub to populate it in real flow.
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        githubId: '12345678',
        username: 'dev_test_user',
        displayName: 'Dev Test',
        email: 'dev@test.local',
        provider: 'github',
        accessToken: null,
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { username: 'dev_test_user' }, {});
  }
};
