// Simple endpoint test script
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🧪 Testing backend endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing /health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Response: ${JSON.stringify(healthData)}`);
    }
    console.log('');

    // Test GitHub OAuth login endpoint
    console.log('2. Testing /api/v1/auth/github endpoint...');
    const oauthResponse = await fetch(`${BASE_URL}/api/v1/auth/github`);
    console.log(`   Status: ${oauthResponse.status}`);
    if (oauthResponse.status === 302) {
      console.log(`   Redirect Location: ${oauthResponse.headers.get('location')}`);
    }
    console.log('');

    // Test GitHub repos endpoint (should return 401 without auth)
    console.log('3. Testing /api/v1/github/repos endpoint...');
    const reposResponse = await fetch(`${BASE_URL}/api/v1/github/repos`);
    console.log(`   Status: ${reposResponse.status}`);
    if (reposResponse.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request');
    }
    console.log('');

    // Test testcase generation endpoint (should return 401 without auth)
    console.log('4. Testing /api/v1/testcases/generate endpoint...');
    const testGenResponse = await fetch(`${BASE_URL}/api/v1/testcases/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: ['test.js'] })
    });
    console.log(`   Status: ${testGenResponse.status}`);
    if (testGenResponse.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request');
    }
    console.log('');

    console.log('✅ Endpoint testing completed!');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testEndpoints();

