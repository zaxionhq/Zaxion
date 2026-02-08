// Simple endpoint test script
import fetch from 'node-fetch';
import logger from './src/utils/logger.js';

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  logger.info('🧪 Testing backend endpoints...');

  try {
    // Test health endpoint
    logger.info('1. Testing /health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    logger.info(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      logger.info('   Response', healthData);
    }

    // Test GitHub OAuth login endpoint
    logger.info('2. Testing /api/v1/auth/github endpoint...');
    const oauthResponse = await fetch(`${BASE_URL}/api/v1/auth/github`);
    logger.info(`   Status: ${oauthResponse.status}`);
    if (oauthResponse.status === 302) {
      logger.info(`   Redirect Location: ${oauthResponse.headers.get('location')}`);
    }

    // Test GitHub repos endpoint (should return 401 without auth)
    logger.info('3. Testing /api/v1/github/repos endpoint...');
    const reposResponse = await fetch(`${BASE_URL}/api/v1/github/repos`);
    logger.info(`   Status: ${reposResponse.status}`);
    if (reposResponse.status === 401) {
      logger.info('   ✅ Correctly returns 401 for unauthenticated request');
    }

    // Test testcase generation endpoint (should return 401 without auth)
    logger.info('4. Testing /api/v1/testcases/generate endpoint...');
    const testGenResponse = await fetch(`${BASE_URL}/api/v1/testcases/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: ['test.js'] })
    });
    logger.info(`   Status: ${testGenResponse.status}`);
    if (testGenResponse.status === 401) {
      logger.info('   ✅ Correctly returns 401 for unauthenticated request');
    }

    logger.info('✅ Endpoint testing completed!');

  } catch (error) {
    logger.error('❌ Error testing endpoints', { error: error.message });
  }
}

testEndpoints();

