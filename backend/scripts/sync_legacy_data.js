
import sequelize from '../src/config/sequelize.js';
import { initDb } from '../src/models/index.js';
import * as logger from '../src/utils/logger.js';

async function syncLegacyData() {
  const db = await initDb();
  console.log("--- Starting Legacy Data Sync ---");

  try {
    // 1. Fetch all FINAL pr_decisions that are not already in Decisions
    const [prDecisions] = await sequelize.query(`
      SELECT pd.* 
      FROM pr_decisions pd
      LEFT JOIN "Decisions" d ON pd.github_check_run_id = d.github_check_run_id
      WHERE pd.evaluation_status = 'FINAL' AND d.id IS NULL
    `);

    console.log(`Found ${prDecisions.length} decisions to sync.`);

    for (const pd of prDecisions) {
      try {
        const rawData = typeof pd.raw_data === 'string' ? JSON.parse(pd.raw_data) : pd.raw_data;
        
        // Resolve Policy Version
        const versionStr = pd.policy_version || 'v1.0.0';
        // Map "v2.0.0" -> 2, "v1.0.0" -> 1
        const versionInt = versionStr.includes('v2') ? 2 : 1;
        
        const policyVersion = await db.PolicyVersion.findOne({
          where: { version_number: versionInt }
        });

        if (!policyVersion) {
          console.warn(`Skipping decision ${pd.id}: Policy version ${pd.policy_version} not found.`);
          continue;
        }

        // Create or Find Fact Snapshot
        const [factSnapshot] = await db.FactSnapshot.findOrCreate({
          where: {
            repo_full_name: `${pd.repo_owner}/${pd.repo_name}`,
            commit_sha: pd.commit_sha
          },
          defaults: {
            pr_number: pd.pr_number,
            data: {
              facts: rawData.facts || {},
              risk_level: rawData.advisor?.riskAssessment?.riskLevel || 'MEDIUM'
            },
            createdAt: pd.created_at,
            updatedAt: pd.updated_at
          }
        });

        // Create Governance Decision
        const resultValue = pd.decision === 'OVERRIDDEN_PASS' ? 'PASS' : pd.decision;
        if (!['PASS', 'BLOCK', 'WARN'].includes(resultValue)) {
          console.warn(`Skipping decision ${pd.id}: Invalid result value ${resultValue}`);
          continue;
        }

        const govDecision = await db.Decision.create({
          policy_version_id: policyVersion.id,
          fact_id: factSnapshot.id,
          result: pd.decision === 'OVERRIDDEN_PASS' ? 'PASS' : pd.decision,
          rationale: pd.reason || 'Legacy decision migrated from pr_decisions',
          evaluation_hash: rawData.evaluation_hash || null,
          github_check_run_id: pd.github_check_run_id,
          author_handle: rawData.userLogin || 'unknown',
          pr_title: rawData.prTitle || `PR #${pd.pr_number}`,
          base_branch: rawData.baseBranch || 'main',
          risk_score: (rawData.advisor?.riskAssessment?.confidence || 0.8) * 100,
          createdAt: pd.created_at,
          updatedAt: pd.updated_at
        });

        console.log(`Synced decision: ${pd.repo_owner}/${pd.repo_name} #${pd.pr_number} -> Decision ${govDecision.id}`);

        // 2. Check for Overrides
        const [overrides] = await sequelize.query(`
          SELECT * FROM pr_overrides WHERE pr_decision_id = :prDecisionId
        `, { replacements: { prDecisionId: pd.id } });

        for (const po of overrides) {
          // Resolve User ID
          const user = await db.User.findOne({ where: { username: po.user_login } });
          const userId = user?.id || (await db.User.findOne())?.id; // Fallback to first user if not found

          if (!userId) {
            console.warn(`Skipping override for ${pd.id}: No user found for ${po.user_login}`);
            continue;
          }

          // Create Governance Override
          const govOverride = await db.Override.create({
            decision_id: govDecision.id,
            policy_version_id: policyVersion.id,
            evaluation_hash: govDecision.evaluation_hash || `legacy_hash_${po.id.substring(0, 8)}`,
            target_sha: pd.commit_sha,
            category: po.category || 'BUSINESS_EXCEPTION',
            status: 'APPROVED',
            expires_at: new Date(new Date(po.created_at).getTime() + (po.ttl_hours || 24) * 60 * 60 * 1000),
            createdAt: po.created_at,
            updatedAt: po.created_at
          });

          // Create Signature
          await db.OverrideSignature.create({
            override_id: govOverride.id,
            actor_id: userId,
            role_at_signing: 'AUTHORIZED_OVERRIDER',
            justification: (po.override_reason || '').length >= 10 ? po.override_reason : (po.override_reason + ' (Legacy migrated reason)'),
            commit_sha: pd.commit_sha,
            createdAt: po.created_at,
            updatedAt: po.created_at
          });

          // Link decision to override
          await govDecision.update({ override_id: govOverride.id });
          console.log(`  Synced override for decision ${govDecision.id} -> Override ${govOverride.id}`);
        }
      } catch (err) {
        console.error(`Error syncing decision ${pd.id}: Name: ${err.name}, Message: ${err.message}`);
        if (err.errors) {
          console.error('Validation Errors:', err.errors.map(e => `${e.path}: ${e.message}`));
        }
      }
    }

    console.log("--- Sync Part 1 (New Decisions) Complete ---");

    // 3. Sync missing overrides for already synced decisions
    console.log("\n--- Starting Part 2 (Missing Overrides) ---");
    const [missingOverrides] = await sequelize.query(`
      SELECT po.*, pd.github_check_run_id, pd.commit_sha, pd.policy_version, pd.repo_owner, pd.repo_name, pd.pr_number
      FROM pr_overrides po
      JOIN pr_decisions pd ON po.pr_decision_id = pd.id
      JOIN "Decisions" d ON pd.github_check_run_id = d.github_check_run_id
      LEFT JOIN "Overrides" o ON d.id = o.decision_id
      WHERE o.id IS NULL
    `);

    console.log(`Found ${missingOverrides.length} missing overrides to sync.`);

    for (const mo of missingOverrides) {
      try {
        const govDecision = await db.Decision.findOne({
          where: { github_check_run_id: mo.github_check_run_id }
        });

        if (!govDecision) continue;

        // Resolve Policy Version
        const versionStr = mo.policy_version || 'v1.0.0';
        const versionInt = versionStr.includes('v2') ? 2 : 1;
        const policyVersion = await db.PolicyVersion.findOne({ where: { version_number: versionInt } });

        // Resolve User ID
        const user = await db.User.findOne({ where: { username: mo.user_login } });
        const userId = user?.id || (await db.User.findOne())?.id;

        if (!userId || !policyVersion) continue;

        // Create Governance Override
        const govOverride = await db.Override.create({
          decision_id: govDecision.id,
          policy_version_id: policyVersion.id,
          evaluation_hash: govDecision.evaluation_hash || `legacy_hash_${mo.id.substring(0, 8)}`,
          target_sha: mo.commit_sha,
          category: mo.category || 'BUSINESS_EXCEPTION',
          status: 'APPROVED',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdAt: mo.created_at,
          updatedAt: mo.created_at
        });

        // Create Signature
        await db.OverrideSignature.create({
          override_id: govOverride.id,
          actor_id: userId,
          role_at_signing: 'AUTHORIZED_OVERRIDER',
          justification: (mo.override_reason || '').length >= 10 ? mo.override_reason : (mo.override_reason + ' (Legacy migrated reason)'),
          commit_sha: mo.commit_sha,
          createdAt: mo.created_at,
          updatedAt: mo.created_at
        });

        // Link decision to override
        await govDecision.update({ override_id: govOverride.id });
        console.log(`  Synced missing override for decision ${govDecision.id} -> Override ${govOverride.id}`);

      } catch (err) {
        console.error(`Error syncing missing override ${mo.id}: ${err.message}`);
      }
    }

    console.log("--- Sync Complete ---");
  } catch (err) {
    console.error("Sync failed:", err);
  } finally {
    process.exit();
  }
}

syncLegacyData();
