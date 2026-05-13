import path from 'path';

const WORKFLOW_PATH_RE = /^\.github\/workflows\/[^/]+\.(ya?ml)$/i;

const PRIVILEGED_PATH_RE = /\b(deploy|release|publish|production|prod)\b/i;
const PRIVILEGED_CONTENT_RE = /\b(deploy|release|publish|production|prod)\b/i;

const MANIFEST_RULES = [
  {
    manifest: /(^|\/)package\.json$/i,
    locks: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  },
  {
    manifest: /(^|\/)pyproject\.toml$/i,
    locks: ['poetry.lock', 'uv.lock', 'Pipfile.lock'],
  },
  {
    manifest: /(^|\/)requirements\.txt$/i,
    locks: ['requirements.lock', 'poetry.lock', 'Pipfile.lock'],
  },
  {
    manifest: /(^|\/)Pipfile$/i,
    locks: ['Pipfile.lock'],
  },
];

/**
 * @param {string} filePath
 * @param {string} [content]
 * @returns {boolean}
 */
export function isPrivilegedWorkflow(filePath, content) {
  const fp = (filePath || '').replace(/\\/g, '/');
  if (PRIVILEGED_PATH_RE.test(fp)) return true;
  if (!content) return false;
  const c = content.length > 64_000 ? content.slice(0, 64_000) : content;
  if (PRIVILEGED_CONTENT_RE.test(c)) return true;
  if (/uses:\s*[^/\s]+\/(actions\/upload-artifact|actions\/download-artifact|softprops\/action-gh-release)/i.test(c)) {
    return true;
  }
  return false;
}

function firstLineContaining(content, sub) {
  if (!content || !sub) return undefined;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(sub)) return i + 1;
  }
  return undefined;
}

/**
 * @param {string} content
 * @returns {{ risk: 'none'|'medium'|'high', line?: number }}
 */
export function analyzeWorkflowPermissions(content) {
  if (!content) return { risk: 'none', line: undefined };
  if (/\bwrite-all\b/i.test(content)) {
    return { risk: 'high', line: firstLineContaining(content, 'write-all') };
  }
  if (/contents:\s*write\b/i.test(content)) {
    return { risk: 'medium', line: firstLineContaining(content, 'contents:') };
  }
  if (/packages:\s*write\b/i.test(content)) {
    return { risk: 'medium', line: firstLineContaining(content, 'packages:') };
  }
  if (/actions:\s*write\b/i.test(content)) {
    return { risk: 'medium', line: firstLineContaining(content, 'actions:') };
  }
  return { risk: 'none', line: undefined };
}

/**
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<{ line: number, message: string, kind: string, ref?: string }>}
 */
export function findUnpinnedUses(content, filePath) {
  const lines = content.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const stepUses = trimmed.match(/^-\s*uses:\s*(.+)$/);
    const plainUses = trimmed.match(/^uses:\s*(.+)$/);
    const m = stepUses || plainUses;
    if (!m) continue;
    let spec = m[1].trim();
    const hashIdx = spec.indexOf('#');
    if (hashIdx !== -1) spec = spec.slice(0, hashIdx).trim();
    if (spec.includes('${{')) continue;
    if (spec.startsWith('./') || spec.startsWith('.\\')) continue;

    if (spec.startsWith('docker://')) {
      const img = spec.slice('docker://'.length);
      if (/@sha256:[0-9a-f]{64}/i.test(img)) continue;
      out.push({
        line: i + 1,
        message: `docker:// reference should pin an immutable digest (@sha256:...): ${spec}`,
        kind: 'docker',
      });
      continue;
    }

    const at = spec.lastIndexOf('@');
    if (at === -1) {
      out.push({
        line: i + 1,
        message: `GitHub Action uses: missing pinned ref (@SHA or tag): ${spec}`,
        kind: 'none',
      });
      continue;
    }
    const ref = spec.slice(at + 1);
    const name = spec.slice(0, at);
    if (/^[0-9a-f]{40}$/i.test(ref)) continue;
    if (/^[0-9a-f]{7,39}$/i.test(ref)) continue;
    if (ref === 'main' || ref === 'master') {
      out.push({
        line: i + 1,
        message: `Action ${name} uses mutable branch ref @${ref}. Pin to a commit SHA.`,
        kind: 'branch',
        ref,
      });
      continue;
    }
    if (/^v\d+(\.\d+)*$/i.test(ref)) {
      out.push({
        line: i + 1,
        message: `Action ${name} uses floating version tag @${ref}. Prefer a full commit SHA.`,
        kind: 'tag',
        ref,
      });
      continue;
    }
    out.push({
      line: i + 1,
      message: `Action ${name} is not pinned to an immutable 40-character SHA (@${ref}).`,
      kind: 'tag',
      ref,
    });
  }
  return out;
}

function isDockerfilePath(p) {
  if (!p) return false;
  const b = path.basename(p.replace(/\\/g, '/'));
  return /^Dockerfile(\.|$)/i.test(b);
}

/**
 * @param {string} content
 * @param {string} filePath
 * @returns {Array<{ line: number, message: string }>}
 */
export function findDockerFromWithoutDigest(content, filePath) {
  const res = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^\s*FROM\s+(--platform=[^\s]+\s+)?([^\s]+)/i.exec(line);
    if (!m) continue;
    let img = m[2];
    const asIdx = /\s+AS\s+/i.exec(img);
    if (asIdx) img = img.slice(0, asIdx.index).trim();
    if (img.toLowerCase() === 'scratch') continue;
    if (/@sha256:[0-9a-f]{64}/i.test(img)) continue;
    if (/^sha256:[0-9a-f]{64}$/i.test(img)) continue;
    res.push({
      line: i + 1,
      message: `Base image not pinned to digest (@sha256:...): ${img}`,
    });
  }
  return res;
}

function normalizePathSet(files) {
  return new Set(
    (files || [])
      .map((f) => (typeof f === 'string' ? f : f.path))
      .filter(Boolean)
      .map((p) => p.replace(/\\/g, '/'))
  );
}

function pnpmWorkspaceLockPresent(pathSet) {
  for (const p of pathSet) {
    if (p === 'pnpm-lock.yaml' || p.endsWith('/pnpm-lock.yaml')) return true;
  }
  return false;
}

/** Top-level package.json keys that are not dependency resolution inputs for lockfile sync. */
const PACKAGE_JSON_NON_DEP_TOP_KEYS = new Set([
  'name',
  'version',
  'private',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'license',
  'author',
  'contributors',
  'maintainers',
  'funding',
  'repository',
  'type',
  'main',
  'module',
  'browser',
  'bin',
  'man',
  'directories',
  'files',
  'exports',
  'imports',
  'types',
  'typings',
  'scripts',
  'config',
  'engines',
  'os',
  'cpu',
  'preferGlobal',
  'publishConfig',
  'eslintConfig',
  'jest',
  'prettier',
  'stylelint',
  'lint-staged',
  'browserslist',
]);

/**
 * True when unified diff lines suggest dependencies / lock-relevant manifest fields changed.
 * Used to avoid OPS-001 false positives when only `scripts` or other non-dep keys change.
 * @param {string} patch
 * @returns {boolean}
 */
export function packageJsonDependencyTouchedInPatch(patch) {
  if (!patch || typeof patch !== 'string') return false;
  const topDepField = /^\s*[+-]\s*"(dependencies|devDependencies|peerDependencies|optionalDependencies|overrides|resolutions|packageManager|bundledDependencies)"\s*:/;
  const stringFieldLine = /^\s*[+-]\s*"(@?[^"]+)"\s*:\s*"((?:\\.|[^"\\])*)"\s*,?\s*$/;

  for (const rawLine of patch.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!/^\s*[+-]/.test(line) || /^\s*[+-]{3}/.test(line)) continue;
    if (topDepField.test(line)) return true;

    const m = line.match(stringFieldLine);
    if (!m) continue;
    const key = m[1];
    const value = m[2];
    if (PACKAGE_JSON_NON_DEP_TOP_KEYS.has(key)) continue;
    if (valueLooksLikeShellScript(value)) continue;
    if (valueLooksLikeDependencySpec(value)) return true;
  }
  return false;
}

function valueLooksLikeShellScript(val) {
  return (
    /\$\(|`/.test(val) ||
    /\b(find|grep|xargs|awk|sed)\b/.test(val) ||
    /&&|\|\||;\s*(npm|yarn|pnpm|node)\b/.test(val) ||
    /^\s*(npm|yarn|pnpm|node|bash|sh)\s/i.test(val)
  );
}

function valueLooksLikeDependencySpec(val) {
  if (/^(file:|workspace:|link:|git\+|github:|https?:)/i.test(val)) return true;
  if (/^(latest|\*)$/i.test(val)) return true;
  if (/^(\^|~|>=|>|<=|<)?\d+\.\d+/i.test(val)) return true;
  if (/^[\^~]?\d+\.x(\.\d+)?$/i.test(val)) return true;
  return false;
}

/**
 * For package.json: should we require a lockfile in this PR when none is listed?
 * - With GitHub patch: only when dependency-related lines changed.
 * - With content but no patch (legacy snapshots): skip — cannot distinguish scripts-only edits.
 * - With neither patch nor content: keep strict behavior.
 */
function packageJsonRequiresLockfileInChangeSet(f) {
  const patch = typeof f.patch === 'string' ? f.patch : '';
  if (patch.length > 0) {
    return packageJsonDependencyTouchedInPatch(patch);
  }
  if (typeof f.content === 'string' && f.content.length > 0) {
    return false;
  }
  return true;
}

/**
 * @param {Array<{ path: string, status?: string, patch?: string, content?: string }>} files
 * @param {Set<string>} pathSet
 * @returns {Array<{ file: string, message: string, severity: string }>}
 */
export function checkLockfileHygiene(files, pathSet) {
  const viol = [];
  const active = (files || []).filter((f) => f && f.path && f.status !== 'removed');

  for (const f of active) {
    const fp = f.path.replace(/\\/g, '/');

    if (/(^|\/)pnpm-workspace\.yaml$/i.test(fp)) {
      if (!pnpmWorkspaceLockPresent(pathSet)) {
        viol.push({
          file: fp,
          message:
            'pnpm-workspace.yaml changed but no pnpm-lock.yaml appears in this change set (commit the lockfile when workspace deps change).',
          severity: 'WARN',
        });
      }
      continue;
    }

    for (const rule of MANIFEST_RULES) {
      if (!rule.manifest.test(fp)) continue;
      if (/(^|\/)package\.json$/i.test(fp) && !packageJsonRequiresLockfileInChangeSet(f)) {
        break;
      }
      const dir = path.posix.dirname(fp);
      const candidates = rule.locks.map((lockName) =>
        dir === '.' ? lockName : `${dir}/${lockName}`
      );
      const hasLock = candidates.some((c) => pathSet.has(c));
      if (!hasLock) {
        viol.push({
          file: fp,
          message: `Dependency manifest changed without a matching lockfile in this change set (${rule.locks.join(' or ')}).`,
          severity: 'WARN',
        });
      }
      break;
    }
  }
  return viol;
}

function normalizeFiles(rawFiles) {
  return (rawFiles || [])
    .map((f) => (typeof f === 'string' ? { path: f } : { ...f }))
    .filter((f) => f && f.path);
}

/**
 * OPS-001 supply chain checks over PR changed files.
 * @param {Array<object>} rawFiles factData.changes.files
 * @param {object} rules rules_logic from policy mapper
 */
export function evaluateSupplyChainIntegrity(rawFiles, rules = {}) {
  const checks = rules.checks || [
    'action_pinning',
    'workflow_permissions',
    'docker_digest_pinning',
    'lockfile_presence',
  ];
  const blockPrivileged = rules.block_on_privileged_deploy_risk !== false;

  const files = normalizeFiles(rawFiles);
  const pathSet = normalizePathSet(files);
  const violations = [];

  for (const f of files) {
    const fp = (f.path || '').replace(/\\/g, '/');
    if (!WORKFLOW_PATH_RE.test(fp) || !f.content) continue;

    const privileged = isPrivilegedWorkflow(fp, f.content);

    if (checks.includes('workflow_permissions')) {
      const perm = analyzeWorkflowPermissions(f.content);
      if (perm.risk !== 'none') {
        const block =
          privileged &&
          blockPrivileged &&
          (perm.risk === 'high' || perm.risk === 'medium');
        violations.push({
          file: fp,
          line: perm.line,
          message:
            perm.risk === 'high'
              ? 'Workflow uses dangerously broad GitHub Actions permissions (e.g. write-all). Minimize scopes.'
              : 'Workflow grants write-capable token scopes (e.g. contents: write). Narrow permissions for least privilege.',
          severity: block ? 'BLOCK' : 'WARN',
          policy: 'supply_chain_integrity',
        });
      }
    }

    if (checks.includes('action_pinning')) {
      for (const u of findUnpinnedUses(f.content, fp)) {
        const branchFloat = u.kind === 'branch' || u.kind === 'docker' || u.kind === 'none';
        const tagFloat = u.kind === 'tag';
        const escalate =
          privileged &&
          blockPrivileged &&
          (branchFloat || (tagFloat && u.ref && /^v\d+$/i.test(u.ref)));
        violations.push({
          file: fp,
          line: u.line,
          message: u.message,
          severity: escalate ? 'BLOCK' : 'WARN',
          policy: 'supply_chain_integrity',
        });
      }
    }
  }

  if (checks.includes('docker_digest_pinning')) {
    for (const f of files) {
      if (!isDockerfilePath(f.path) || !f.content) continue;
      const fp = f.path.replace(/\\/g, '/');
      for (const fr of findDockerFromWithoutDigest(f.content, fp)) {
        violations.push({
          file: fp,
          line: fr.line,
          message: fr.message,
          severity: 'WARN',
          policy: 'supply_chain_integrity',
        });
      }
    }
  }

  if (checks.includes('lockfile_presence')) {
    for (const v of checkLockfileHygiene(files, pathSet)) {
      violations.push({ ...v, policy: 'supply_chain_integrity' });
    }
  }

  const hasBlock = violations.some((v) => v.severity === 'BLOCK');
  const hasWarn = violations.some((v) => v.severity === 'WARN');
  const verdict = hasBlock ? 'BLOCK' : hasWarn ? 'WARN' : 'PASS';
  const message =
    verdict === 'PASS'
      ? 'No CI/CD supply chain integrity issues detected in changed files.'
      : `CI/CD supply chain integrity: ${violations.length} finding(s).`;

  return {
    verdict,
    message,
    details: {
      fact_path: 'changes.files',
      expected: 'Pinned actions, minimal permissions, digest-pinned images, lockfiles in sync',
      actual: violations
        .slice(0, 10)
        .map((v) => v.message)
        .join(' | ') || 'none',
      violations,
    },
  };
}
