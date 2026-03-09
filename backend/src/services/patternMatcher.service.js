import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import logger from '../logger.js';

export class PatternMatcherService {
  constructor(configPath) {
    // Resolve config path relative to CWD or use default
    const effectivePath = configPath || path.join(process.cwd(), 'src/config/policies/security_patterns.yml');
    
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
      this.policies = new Map(Object.entries(loaded.policies || {}));
      logger.info(`PatternMatcher: Loaded ${this.policies.size} policy definitions from ${effectivePath}`);
    } catch (err) {
      logger.error({ error: err.message, stack: err.stack, path: effectivePath }, 'PatternMatcher: Failed to load security patterns config.');
      this.policies = new Map();
    }
    this.violations = [];
  }

  /**
   * Analyze code against all patterns
   * @param {string} code - The file content
   * @param {string} filePath - The file path
   * @returns {Array} violations
   */
  analyzeCode(code, filePath) {
    this.violations = [];

    // Skip empty code
    if (!code) return [];

    for (const [policyName, policy] of this.policies.entries()) {
      if (policy.enabled === false) continue;

      if (policy.patterns) {
        for (const pattern of policy.patterns) {
          this.matchPattern(code, filePath, policyName, policy, pattern);
        }
      }
    }

    // Advanced AST checks if needed (e.g. magic numbers)
    // We can trigger them based on policy enablement
    const magicNumbersPolicy = this.policies.get('no-magic-numbers');
    if (magicNumbersPolicy?.enabled) {
        const magicNumbers = this.detectMagicNumbers(code);
        if (magicNumbers.length > 0) {
            magicNumbers.forEach(m => {
                this.violations.push({
                    policy: 'no-magic-numbers',
                    pattern: 'Numeric Literal Outside Constant',
                    severity: magicNumbersPolicy.severity || 'LOW',
                    line: m.line,
                    column: 0,
                    code: `${m.value}`,
                    context: `Line ${m.line}: Magic number ${m.value} detected`,
                    remediation: magicNumbersPolicy.remediation,
                    file: filePath
                });
            });
        }
    }

    return this.violations;
  }

  /**
   * Match a single pattern against code
   */
  matchPattern(code, filePath, policyName, policy, pattern) {
    try {
      // Security: regex comes from trusted policy configuration
      // Exception handled in eslint.config.js for this service
      const regex = new RegExp(pattern.regex, 'gm');
      let match;

      // Reset regex state
      regex.lastIndex = 0;

      while ((match = regex.exec(code)) !== null) {
        // Check whitelist
        if (this.isWhitelisted(match[0], policy)) {
          continue;
        }
        
        // Check exclude patterns (like for console logs in tests)
        if (this.isExcludedFile(filePath, policy.patterns)) {
             // Logic to check exclude_patterns on the pattern object itself
             // The config structure has exclude_patterns at the pattern level
             if (pattern.exclude_patterns && this.isWhitelisted(filePath, { false_positive_whitelist: pattern.exclude_patterns })) {
                 continue;
             }
        }

        // Calculate line number
        const lineNumber = code.substring(0, match.index).split('\n').length;

        // Extract context (simple 1 line context)
        const lines = code.split('\n');
        const contextLine = lines[lineNumber - 1] || '';

        this.violations.push({
          policy: policyName,
          pattern: pattern.name,
          severity: policy.severity,
          line: lineNumber,
          column: match.index - code.lastIndexOf('\n', match.index),
          code: match[0],
          context: contextLine.trim(),
          remediation: policy.remediation,
          file: filePath
        });
      }
    } catch (error) {
      logger.error(`Error matching pattern ${pattern.name}:`, error);
    }
  }

  /**
   * Check if violation is whitelisted
   */
  isWhitelisted(code, policyOrPattern) {
    // Check policy level whitelist
    if (policyOrPattern.false_positive_whitelist) {
        if (policyOrPattern.false_positive_whitelist.some(whitelist => code.includes(whitelist))) {
            return true;
        }
    }
    return false;
  }
  
  isExcludedFile(filePath, patterns) {
      // Check if file path matches any exclusion patterns
      // This logic depends on how specific the exclusion needs to be
      return false; 
  }

  /**
   * Parse AST for advanced pattern matching
   */
  parseAST(code) {
    try {
      return parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });
    } catch (error) {
      // logger.debug('AST parsing error (non-fatal for regex checks):', error.message);
      return null;
    }
  }

  /**
   * Detect magic numbers using AST
   */
  detectMagicNumbers(code) {
    const ast = this.parseAST(code);
    if (!ast) return [];

    const magicNumbers = [];
    
    // Simple traversal without full babel-traverse if possible, 
    // but better to use what we have available or simple recursion
    // Since we don't have traverse imported in this file yet (it wasn't in package.json devDependencies but dependencies),
    // let's dynamically import or traverse manually.
    // Actually @babel/traverse IS in dependencies.
    
    // We need to dynamic import or use standard import.
    // Since this is ES module, we can import at top.
    
    // See top imports.
    return this._traverseForMagicNumbers(ast);
  }
  
  _traverseForMagicNumbers(ast) {
    const magicNumbers = [];
    
    try {
        const traverseFn = traverse.default || traverse;
        
        traverseFn(ast, {
            NumericLiteral(path) {
                 const value = path.node.value;
                 // Ignore 0, 1, -1
                 if (Math.abs(value) > 1) {
                     // Check if parent is variable declaration (const X = 5) - usually okay if uppercase
                     const parent = path.parent;
                     if (parent.type === 'VariableDeclarator' && parent.id.name && /^[A-Z_]+$/.test(parent.id.name)) {
                         // It is a constant, ignore
                     } else if (parent.type === 'ObjectProperty' && parent.key.name && /^[A-Z_]+$/.test(parent.key.name)) {
                          // It is an object property constant, ignore
                     } else {
                         magicNumbers.push({ value: value, line: path.node.loc?.start?.line || 0 });
                     }
                 }
             }
         });
    } catch (err) {
        logger.error('Error traversing AST for magic numbers:', err);
    }
    
    return magicNumbers;
  }
}
