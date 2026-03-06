/**
 * AST-based code analysis for policy simulation.
 * Parses JS/TS files to extract: function count, test count, imports, code quality issues, JSDoc.
 */
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const PARSER_OPTIONS = {
  sourceType: 'module',
  plugins: ['typescript', 'jsx'],
  errorRecovery: true,
};

/**
 * Parse code and return AST or null on parse error.
 */
function safeParse(code, filePath = '') {
  try {
    return parse(code, { ...PARSER_OPTIONS, sourceFilename: filePath });
  } catch {
    return null;
  }
}

/**
 * Extract AST-derived metrics from a single file's content.
 * @param {string} content - File source
 * @param {string} filePath - Path for context
 * @returns {object} { functionCount, testCount, importCount, hasConsoleLog, hasDebugger, hasJSDocOnExport, imports, exports }
 */
export function analyzeFile(content, filePath = '') {
  const ast = safeParse(content, filePath);
  const result = {
    functionCount: 0,
    testCount: 0,
    importCount: 0,
    hasConsoleLog: false,
    hasDebugger: false,
    hasJSDocOnExport: false,
    imports: [],
    exports: [],
    error: null,
  };
  if (!ast) {
    result.error = 'Parse failed';
    return result;
  }

  traverse.default(ast, {
    FunctionDeclaration(path) {
      result.functionCount++;
    },
    FunctionExpression(path) {
      result.functionCount++;
    },
    ArrowFunctionExpression(path) {
      result.functionCount++;
    },
    CallExpression(path) {
      const callee = path.node.callee;
      const name = callee.name || (callee.object?.name && callee.property?.name ? `${callee.object.name}.${callee.property.name}` : null);
      if (name === 'describe' || name === 'it' || name === 'test' || name === 'fit' || name === 'xit') result.testCount++;
      if (name === 'console.log' || (callee.object?.name === 'console' && callee.property?.name === 'log')) result.hasConsoleLog = true;
    },
    DebuggerStatement() {
      result.hasDebugger = true;
    },
    ImportDeclaration(path) {
      result.importCount++;
      const src = path.node.source?.value;
      if (src) result.imports.push(src);
    },
    ExportNamedDeclaration(path) {
      if (path.node.declaration) result.exports.push(path.node.declaration.type);
      const leadingComments = path.node.leadingComments || path.getStatementParent()?.node?.leadingComments;
      if (leadingComments?.some(c => c.value?.includes('*') && c.value?.includes('@'))) result.hasJSDocOnExport = true;
    },
    ExportDefaultDeclaration(path) {
      result.exports.push(path.node.declaration?.type || 'default');
      const leadingComments = path.node.leadingComments || path.getStatementParent()?.node?.leadingComments;
      if (leadingComments?.some(c => c.value?.includes('*') && c.value?.includes('@'))) result.hasJSDocOnExport = true;
    },
  });

  return result;
}

/**
 * Check for JSDoc on exported functions (simplified: any JSDoc comment before export).
 */
export function hasJSDocOnExports(content, filePath = '') {
  const r = analyzeFile(content, filePath);
  return r.hasJSDocOnExport;
}

/**
 * Build import graph edges from a list of files { path, content }.
 * Returns { edges: [{ from, to }], nodePaths: string[] }.
 */
export function buildImportGraph(files) {
  const edges = [];
  const nodePaths = files.map(f => f.path || f.filePath).filter(Boolean);
  const pathToImports = new Map();

  for (const file of files) {
    const path = file.path || file.filePath;
    const content = file.content;
    if (!path || !content) continue;
    const ast = safeParse(content, path);
    if (!ast) continue;
    const imports = [];
    traverse.default(ast, {
      ImportDeclaration(path) {
        const src = path.node.source?.value;
        if (src) imports.push(src);
      },
    });
    pathToImports.set(path, imports);
  }

  for (const [fromPath, importSources] of pathToImports) {
    for (const src of importSources) {
      const resolved = resolveImportToPath(src, fromPath, nodePaths);
      if (resolved) edges.push({ from: fromPath, to: resolved });
    }
  }
  return { edges, nodePaths };
}

function resolveImportToPath(importSrc, fromPath, allPaths) {
  if (importSrc.startsWith('.')) {
    const base = fromPath.includes('/') ? fromPath.replace(/\/[^/]+$/, '') : '';
    let joined = base ? `${base}/${importSrc}` : importSrc;
    joined = joined.replace(/\/\.\//g, '/').replace(/[^/]+\/\.\.\//g, '');
    for (const p of allPaths) {
      if (p === joined || p === `${joined}.ts` || p === `${joined}.tsx` || p === `${joined}.js` || p === `${joined}.jsx`) return p;
    }
  }
  return null;
}

/**
 * Detect cycles in import graph (simple DFS).
 */
export function findCircularDependencies(edges) {
  const graph = new Map();
  for (const { from, to } of edges) {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from).push(to);
  }
  const cycles = [];
  const visited = new Set();
  const stack = new Set();
  const path = [];
  const pathSet = new Set();

  function visit(node) {
    if (stack.has(node)) {
      const start = path.indexOf(node);
      if (start !== -1) cycles.push(path.slice(start).concat(node));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    path.push(node);
    pathSet.add(node);
    for (const child of graph.get(node) || []) {
      visit(child);
    }
    path.pop();
    pathSet.delete(node);
    stack.delete(node);
  }
  for (const node of graph.keys()) {
    if (!visited.has(node)) visit(node);
  }
  return cycles;
}

/**
 * Enrich snapshot data with AST metrics for all files that have content.
 */
export function enrichSnapshotWithAst(factData) {
  const files = factData?.changes?.files || [];
  if (!files.length) return factData;
  let totalFunctions = 0;
  let totalTests = 0;
  const allImports = [];
  const astByPath = {};

  for (const f of files) {
    const content = f.content || factData.file_content;
    const path = f.path || factData.file_path;
    if (!content || typeof content !== 'string') continue;
    const ext = (f.extension || '').toLowerCase();
    if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) continue;
    const metrics = analyzeFile(content, path);
    f.ast = metrics;
    astByPath[path] = metrics;
    totalFunctions += metrics.functionCount;
    totalTests += metrics.testCount;
    metrics.imports.forEach(imp => allImports.push({ from: path, to: imp }));
  }

  const metadata = factData.metadata || {};
  factData.metadata = {
    ...metadata,
    ast_function_count: totalFunctions,
    ast_test_count: totalTests,
    ast_coverage_ratio: totalFunctions > 0 ? totalTests / totalFunctions : (totalTests > 0 ? 1 : 0),
    ast_by_path: astByPath,
  };
  factData.ast_import_edges = allImports;
  return factData;
}
