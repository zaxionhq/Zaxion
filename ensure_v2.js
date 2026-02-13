
import { initDb } from './backend/src/models/index.js';

async function ensureV2() {
  const db = await initDb();
  try {
    const corePolicy = await db.Policy.findOne({ where: { name: 'Zaxion Core Policy' } });
    if (!corePolicy) {
      console.error("Core policy not found");
      return;
    }

    const [v2, created] = await db.PolicyVersion.findOrCreate({
      where: { 
        policy_id: corePolicy.id,
        version_number: 2
      },
      defaults: {
        enforcement_level: 'MANDATORY',
        rules_logic: { high_risk_gating: true, min_tests: 1 },
        created_by: (await db.User.findOne())?.id,
        description: 'Standard enterprise policy: High-risk changes require accompanying tests.'
      }
    });

    if (created) {
      console.log("Created Policy Version 2 (v2.0.0)");
    } else {
      console.log("Policy Version 2 already exists");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

ensureV2();
