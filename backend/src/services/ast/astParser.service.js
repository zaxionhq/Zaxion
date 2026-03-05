import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as logger from '../../utils/logger.js';

/**
 * Service to parse JavaScript/TypeScript code into AST
 */
export class ASTParserService {
  constructor() {
    this.parserOptions = {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'asyncGenerators',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'objectRestSpread'
      ]
    };
  }

  /**
   * Parse code string into AST
   * @param {string} code - The source code
   * @param {string} filePath - Path to the file (for error reporting)
   * @returns {object} The AST root node
   */
  parseCode(code, filePath) {
    try {
      // Determine if TS plugin is needed based on extension
      const isTs = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
      
      const ast = parse(code, {
        ...this.parserOptions,
        plugins: isTs ? [...this.parserOptions.plugins] : this.parserOptions.plugins.filter(p => p !== 'typescript')
      });
      
      return ast;
    } catch (error) {
      logger.error(`[ASTParser] Failed to parse ${filePath}: ${error.message}`);
      // Return a partial error node instead of crashing
      return {
        type: 'ParseError',
        message: error.message,
        loc: error.loc
      };
    }
  }

  /**
   * Extract function names from AST
   * @param {object} ast - The AST root node
   * @returns {string[]} List of function names
   */
  extractFunctionNames(ast) {
    const functions = [];
    
    // Safety check for parse errors
    if (ast.type === 'ParseError') return [];

    // Use default traverse if available, handle ESM/CJS import difference
    const traverseFn = traverse.default || traverse;

    traverseFn(ast, {
      FunctionDeclaration(path) {
        if (path.node.id) {
          functions.push(path.node.id.name);
        }
      },
      ClassMethod(path) {
        if (path.node.key && path.node.key.name) {
          functions.push(path.node.key.name);
        }
      },
      ArrowFunctionExpression(path) {
        // Handle const myFunc = () => {}
        if (path.parent.type === 'VariableDeclarator' && path.parent.id.name) {
          functions.push(path.parent.id.name);
        }
      }
    });

    return functions;
  }
}
