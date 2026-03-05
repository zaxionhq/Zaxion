import traverse from '@babel/traverse';

/**
 * Service to detect dangerous patterns in AST
 */
export class PatternMatchingEngine {
  
  constructor() {
    this.patterns = [
      {
        id: 'DANGEROUS_EVAL',
        severity: 'CRITICAL',
        check: (path) => {
          return path.isCallExpression() && 
                 path.get('callee').isIdentifier({ name: 'eval' });
        }
      },
      {
        id: 'HARDCODED_SECRET',
        severity: 'HIGH',
        check: (path) => {
          if (path.isStringLiteral()) {
            const value = path.node.value;
            // Simple heuristic for AWS keys
            return value.startsWith('AKIA') && value.length === 20;
          }
          return false;
        }
      }
    ];
  }

  /**
   * Scan AST for defined patterns
   * @param {object} ast - The AST to scan
   * @returns {Array} List of violations
   */
  scan(ast) {
    const violations = [];
    if (ast.type === 'ParseError') return violations;

    const traverseFn = traverse.default || traverse;
    const self = this;

    traverseFn(ast, {
      enter(path) {
        for (const pattern of self.patterns) {
          if (pattern.check(path)) {
            violations.push({
              id: pattern.id,
              severity: pattern.severity,
              line: path.node.loc ? path.node.loc.start.line : 0
            });
          }
        }
      }
    });

    return violations;
  }
}
