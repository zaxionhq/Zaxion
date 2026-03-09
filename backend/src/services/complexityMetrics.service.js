import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import logger from '../logger.js';

export class ComplexityMetricsService {
  constructor(configPath) {
    // Resolve config path relative to CWD or use default
    const effectivePath = configPath || path.join(process.cwd(), 'src/config/policies/complexity_metrics.yml');
    
    // Security: Validate the config path is within expected directory
    const resolvedPath = path.resolve(effectivePath);
    if (!resolvedPath.startsWith(process.cwd())) {
      throw new Error(`Security violation: Config path ${effectivePath} is outside allowed directory`);
    }

    try {
      // Security: Validate that the path is within the current working directory to prevent path traversal
      // Exception handled in eslint.config.js for this service
      const fileContents = fs.readFileSync(resolvedPath, 'utf8');
      const loaded = yaml.load(fileContents);
      this.policies = new Map(Object.entries(loaded.complexity_policies || {}));
      logger.info(`ComplexityMetrics: Loaded ${this.policies.size} policy definitions from ${effectivePath}`);
    } catch (err) {
      logger.error({ error: err.message, stack: err.stack, path: effectivePath }, 'ComplexityMetrics: Failed to load config.');
      this.policies = new Map();
    }
  }

  analyzeCode(code, filePath) {
    const violations = [];
    if (!code) return violations;

    // 1. File Length Check
    const fileLengthPolicy = this.policies.get('max-file-length');
    if (fileLengthPolicy?.enabled) {
      const lineCount = code.split('\n').length;
      const threshold = fileLengthPolicy.threshold || 300;
      if (lineCount > threshold) {
        violations.push(this._createViolation('max-file-length', 1, 
          `File exceeds ${threshold} lines (${lineCount})`, filePath, code.substring(0, 100)));
      }
    }

    // 2. AST-Based Checks
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        errorRecovery: true
      });
      
      const traverseFn = traverse.default || traverse;
      const self = this;

      traverseFn(ast, {
        // Function Length & Complexity
        Function(path) {
          self._checkFunctionMetrics(path, violations, filePath);
        },
        // Class Complexity (God Object)
        Class(path) {
          self._checkClassMetrics(path, violations, filePath);
        }
      });

    } catch (err) {
      // logger.debug('ComplexityMetrics: AST parsing error (skipping AST checks for file)', { file: filePath, error: err.message });
    }

    return violations;
  }

  _checkFunctionMetrics(path, violations, filePath) {
    const node = path.node;
    const start = node.loc?.start?.line || 0;
    const end = node.loc?.end?.line || 0;
    const length = end - start;

    // Check Function Length
    const lenPolicy = this.policies.get('max-function-length');
    if (lenPolicy?.enabled && length > (lenPolicy.threshold || 50)) {
       const name = node.id?.name || 'anonymous';
       violations.push(this._createViolation('max-function-length', start,
         `Function '${name}' is too long (${length} lines > ${lenPolicy.threshold})`, filePath));
    }

    // Check Parameter Count
    const paramPolicy = this.policies.get('max-parameter-count');
    if (paramPolicy?.enabled && node.params.length > (paramPolicy.threshold || 5)) {
        const name = node.id?.name || 'anonymous';
        violations.push(this._createViolation('max-parameter-count', start,
            `Function '${name}' has too many parameters (${node.params.length} > ${paramPolicy.threshold})`, filePath));
    }

    // Check Cyclomatic Complexity (Simplified: count branches)
    const complexPolicy = this.policies.get('max-cyclomatic-complexity');
    if (complexPolicy?.enabled) {
      let complexity = 1;
      
      const visitor = {
        IfStatement() { complexity++; },
        ForStatement() { complexity++; },
        WhileStatement() { complexity++; },
        DoWhileStatement() { complexity++; },
        SwitchCase(p) { if (p.node.test) complexity++; },
        LogicalExpression(p) { if (p.node.operator === '||' || p.node.operator === '&&') complexity++; },
        ConditionalExpression() { complexity++; },
        CatchClause() { complexity++; }
      };

      path.traverse(visitor);

      if (complexity > (complexPolicy.threshold || 10)) {
         const name = node.id?.name || 'anonymous';
         violations.push(this._createViolation('max-cyclomatic-complexity', start,
            `Function '${name}' is too complex (Complexity: ${complexity} > ${complexPolicy.threshold})`, filePath));
      }
    }
  }

  _checkClassMetrics(path, violations, filePath) {
    const godPolicy = this.policies.get('no-god-objects');
    if (godPolicy?.enabled) {
        let methodCount = 0;
        path.traverse({
            ClassMethod() { methodCount++; },
            ClassPrivateMethod() { methodCount++; }
        });
        
        if (methodCount > (godPolicy.threshold || 20)) {
            const name = path.node.id?.name || 'anonymous';
            violations.push(this._createViolation('no-god-objects', path.node.loc?.start?.line || 1,
                `Class '${name}' is a potential God Object (${methodCount} methods > ${godPolicy.threshold})`, filePath));
        }
    }
  }

  _createViolation(policyName, line, message, file, codeSnippet = '') {
    const policy = this.policies.get(policyName);
    if (!policy) {
        return null;
    }
    return {
      policy: policyName,
      severity: policy.severity || 'MEDIUM',
      message: message,
      remediation: policy.remediation,
      line,
      file,
      code: codeSnippet
    };
  }
}
