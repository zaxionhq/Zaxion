
import { initDb } from './src/models/index.js';

async function checkPolicies() {
  const db = await initDb();
  try {
    const policies = await db.Policy.findAll({
      include: [
        { 
          model: db.PolicyVersion, 
          as: 'versions',
          order: [['version_number', 'DESC']]
        }
      ]
    });

    console.log(`--- Zaxion Policies ---`);
    console.log(`Total policies found: ${policies.length}`);
    
    policies.forEach(p => {
      console.log(`\nPolicy: ${p.name} (ID: ${p.id})`);
      console.log(`Scope: ${p.scope} | Target: ${p.target_id}`);
      console.log(`Description: ${p.description}`);
      console.log(`Versions:`);
      if (p.versions && p.versions.length > 0) {
        p.versions.forEach(v => {
          console.log(`  - v${v.version_number}: Status: ${v.status} | Created: ${v.createdAt}`);
          console.log(`    Rules Logic: ${JSON.stringify(v.rules_logic, null, 2)}`);
        });
      } else {
        console.log(`  - No versions found`);
      }
    });

  } catch (err) {
    console.error('Error fetching policies:', err);
  } finally {
    process.exit();
  }
}

checkPolicies();
