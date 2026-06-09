import { describe, it, expect } from '@jest/globals';
import { classifyFileKind } from '../../../src/services/incremental/fileKindClassifier.service.js';

describe('fileKindClassifier', () => {
  it('classifies package.json as manifest', () => {
    expect(classifyFileKind('package.json')).toBe('manifest');
  });

  it('classifies workflow yaml', () => {
    expect(classifyFileKind('.github/workflows/deploy.yml')).toBe('workflow');
  });

  it('classifies Dockerfile', () => {
    expect(classifyFileKind('Dockerfile')).toBe('infrastructure');
  });

  it('classifies test files', () => {
    expect(classifyFileKind('src/foo.test.ts')).toBe('test');
  });

  it('classifies rust source', () => {
    expect(classifyFileKind('src/main.rs')).toBe('source');
  });
});
