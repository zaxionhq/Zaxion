import { listUserReposWithPermissions } from './github.service.js';
import { logAuthEvent } from './audit.service.js';
import { error as logError } from '../utils/logger.js';

/**
 * Sync GitHub repository permissions for a user (maintainer role promotion).
 * Intended to run after OAuth redirect — must not block the callback response.
 */
export async function syncUserReposFromGitHub(db, userId, ghAccessToken) {
  const user = await db.User.findByPk(userId);
  if (!user || user.role === 'admin') {
    return;
  }

  const repos = await listUserReposWithPermissions(ghAccessToken);

  let hasMaintainerRights = false;
  const mappingsToCreate = [];
  const repoRecordsToCreate = [];

  for (const repo of repos) {
    if (repo.permissions.admin || repo.permissions.push) {
      hasMaintainerRights = true;
      repoRecordsToCreate.push({
        githubRepoId: repo.github_id,
        name: repo.name,
        owner: repo.owner,
      });
      mappingsToCreate.push({
        userId: user.id,
        githubRepoId: repo.github_id,
        githubPermissionLevel: repo.permissions.admin ? 'admin' : 'write',
      });
    }
  }

  if (!hasMaintainerRights) {
    return;
  }

  for (const repoData of repoRecordsToCreate) {
    const [repo] = await db.Repository.findOrCreate({
      where: { githubRepoId: repoData.githubRepoId },
      defaults: repoData,
    });

    const mappingData = mappingsToCreate.find((m) => m.githubRepoId === repoData.githubRepoId);
    if (mappingData) {
      await db.RepositoryMaintainerMapping.upsert({
        userId: user.id,
        repositoryId: repo.id,
        githubPermissionLevel: mappingData.githubPermissionLevel,
      });
    }
  }

  await user.reload();
  if (user.role === 'user') {
    await user.update({ role: 'maintainer' });
    logAuthEvent(user.id, 'ROLE_UPDATE', 'SUCCESS', {
      previousRole: 'user',
      newRole: 'maintainer',
      reason: 'GitHub permissions sync (background)',
    });
  }
}

/**
 * Fire-and-forget repo sync after login. Errors are logged only.
 */
export function scheduleUserRepoSync(db, userId, ghAccessToken) {
  setImmediate(async () => {
    try {
      await syncUserReposFromGitHub(db, userId, ghAccessToken);
    } catch (syncError) {
      logError('Permission sync failed (background):', syncError);
    }
  });
}
