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
    
    // Regex to match hunk headers: @@ -oldStart,oldLines +newStart,newLines @@
    const hunkHeaderRegex = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;

    for (const line of lines) {
      const match = line.match(hunkHeaderRegex);
      
      if (match) {
        // Start of a new hunk
        currentLine = parseInt(match[1], 10);
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Added line
        changes.push({
          line: currentLine,
          type: 'ADDED',
          content: line.substring(1) // Remove the '+'
        });
        currentLine++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Deleted line (we don't increment currentLine for the new file view)
        // But we track it for "What was removed" logic
      } else {
        // Context line
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
