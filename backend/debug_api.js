import { default as request } from 'supertest';
import app from './src/app.js';
import { db } from './src/models/index.js';

async function run() {
  await db.sequelize.sync();
  
  // 1. Paste "no hardcode secret"
  const pasteSecRes = await request(app)
    .post('/api/v1/policies/SEC-001/analyze-code')
    .send({
      mode: 'paste',
      paste: { code: "const apiKey = 'AKIAIOSFODNN7EXAMPLE';" }
    });
  console.log("Paste Security:", pasteSecRes.body.result, pasteSecRes.body.violations?.map(v=>v.message));

  // 2. PR URL "min test 2"
  // Assuming PR URL requires real github token, skip.

  process.exit(0);
}

run().catch(console.error);