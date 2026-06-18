import {
  normalizePath,
  pathMatchesGlob,
  pathInScope,
  getReasonForSkip,
  filterFilesByScope,
  evaluatePolicyApplicability,
  isToolingPath,
  isTestOrMockPath,
  STANDARD_SECURITY_EXCLUDE_PATHS,
} from '../../src/utils/pathScope.utils.js';

describe('pathScope.utils', () => {
  describe('normalizePath', () => {
    it('strips ./ and lowercases', () => {
      expect(normalizePath('./Src/App.ts')).toBe('src/app.ts');
    });
  });

  describe('pathMatchesGlob', () => {
    it('matches wildcard', () => {
      expect(pathMatchesGlob('src/auth.js', '*')).toBe(true);
    });

    it('matches ** globs', () => {
      expect(pathMatchesGlob('src/app.ts', 'src/**')).toBe(true);
      expect(pathMatchesGlob('lib/foo.ts', 'src/**')).toBe(false);
    });

    it('matches scripts/**', () => {
      expect(pathMatchesGlob('scripts/deploy.mjs', 'scripts/**')).toBe(true);
    });
  });

  describe('getReasonForSkip', () => {
    it('returns exclude_paths match for scripts', () => {
      const r = getReasonForSkip('scripts/foo.mjs', { exclude_paths: ['scripts/**'] });
      expect(r.inScope).toBe(false);
      expect(r.matchedPattern).toBe('scripts/**');
      expect(r.matchType).toBe('exclude');
      expect(r.reason).toContain('exclude_paths');
    });

    it('returns human-readable reason from path_exclusions', () => {
      const r = getReasonForSkip('scripts/foo.mjs', {
        exclude_paths: ['scripts/**'],
        path_exclusions: [
          {
            pattern: 'scripts/**',
            reason: 'CLI and build tooling legitimately uses console output',
          },
        ],
      });
      expect(r.inScope).toBe(false);
      expect(r.reason).toBe('CLI and build tooling legitimately uses console output');
      expect(r.reason).not.toBe('Excluded by exclude_paths');
    });

    it('returns include_paths miss', () => {
      const r = getReasonForSkip('docs/readme.md', { include_paths: ['src/**'] });
      expect(r.inScope).toBe(false);
      expect(r.matchType).toBe('include');
    });

    it('exclude wins over include', () => {
      const r = getReasonForSkip('scripts/foo.mjs', {
        include_paths: ['*'],
        exclude_paths: ['scripts/**'],
      });
      expect(r.inScope).toBe(false);
      expect(r.matchedPattern).toBe('scripts/**');
    });

    it('returns in scope when no restrictions', () => {
      const r = getReasonForSkip('src/app.ts', {});
      expect(r.inScope).toBe(true);
    });
  });

  describe('pathInScope', () => {
    it('delegates to getReasonForSkip', () => {
      expect(pathInScope('scripts/x.mjs', { exclude_paths: ['scripts/**'] })).toBe(false);
      expect(pathInScope('src/x.ts', { include_paths: ['src/**'] })).toBe(true);
    });
  });

  describe('filterFilesByScope', () => {
    it('filters files and records skip reasons', () => {
      const { files, skipReasons } = filterFilesByScope(
        [
          { path: 'scripts/a.mjs', content: 'x' },
          { path: 'src/b.ts', content: 'y' },
        ],
        { exclude_paths: ['scripts/**'] }
      );
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('src/b.ts');
      expect(skipReasons).toHaveLength(1);
      expect(skipReasons[0].matchedPattern).toBe('scripts/**');
    });
  });

  describe('evaluatePolicyApplicability', () => {
    it('applicable when any path in scope', () => {
      const r = evaluatePolicyApplicability({
        rules: { include_paths: ['src/**'], exclude_paths: ['scripts/**'] },
        changedPaths: ['scripts/x.mjs', 'src/app.ts'],
      });
      expect(r.applicable).toBe(true);
      expect(r.triggerPath).toBe('src/app.ts');
    });

    it('not applicable when all paths excluded', () => {
      const r = evaluatePolicyApplicability({
        rules: { exclude_paths: ['scripts/**'] },
        changedPaths: ['scripts/x.mjs'],
      });
      expect(r.applicable).toBe(false);
      expect(r.skipReasons.length).toBeGreaterThan(0);
    });
  });

  describe('path heuristics', () => {
    it('isToolingPath detects scripts/', () => {
      expect(isToolingPath('scripts/auto.mjs')).toBe(true);
      expect(isToolingPath('src/app.ts')).toBe(false);
    });

    it('isTestOrMockPath detects test files', () => {
      expect(isTestOrMockPath('src/foo.test.ts')).toBe(true);
      expect(isTestOrMockPath('src/app.ts')).toBe(false);
    });
  });

  describe('STANDARD_SECURITY_EXCLUDE_PATHS', () => {
    it('excludes tooling paths via getReasonForSkip when used as exclude_paths', () => {
      const r = getReasonForSkip('README.md', { exclude_paths: STANDARD_SECURITY_EXCLUDE_PATHS });
      expect(r.inScope).toBe(false);
    });
  });
});
