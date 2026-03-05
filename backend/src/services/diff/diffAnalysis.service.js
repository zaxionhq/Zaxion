import * as logger from '../../utils/logger.js';

/**
 * Service to parse GitHub Diffs and map them to line numbers
 */
export class DiffAnalysisService {
  
  /**
   * Parse a raw git patch string
   * @param {string} patch - The raw patch string from GitHub API
   * @returns {Array<{start: number, end: number, type: string}>} List of changed line ranges
   */
  parsePatch(patch) {
    if (!patch) return [];
    
    const changes = [];
    const lines = patch.split('\n');
    let currentLine = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        const plusIndex = line.indexOf(' +');
        const afterPlus = plusIndex !== -1 ? line.slice(plusIndex + 2) : '';
        const spaceAfterPlus = afterPlus.indexOf(' ');
        const newPart = spaceAfterPlus !== -1 ? afterPlus.slice(0, spaceAfterPlus) : afterPlus;
        const commaIdx = newPart.indexOf(',');
        const newStart = commaIdx !== -1 ? newPart.slice(0, commaIdx) : newPart;
        const parsed = parseInt(newStart, 10);
        if (!Number.isNaN(parsed)) currentLine = parsed;
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        changes.push({
          line: currentLine,
          type: 'ADDED',
          content: line.substring(1)
        });
        currentLine++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        continue;
      } else {
        currentLine++;
      }
    }
    
    return changes;
  }

  /**
   * Map changed lines to AST functions
   * @param {object} ast - The AST of the new file content
   * @param {Array} changes - List of changed lines from parsePatch
   * @returns {Array} List of modified function names
   */
  mapChangesToFunctions(ast, changes) {
    // This requires traversing the AST to find node locations
    // and checking if any change.line falls within node.loc.start.line and node.loc.end.line
    
    // Placeholder for Phase 4.2 implementation
    return []; 
  }
}
