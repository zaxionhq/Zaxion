
import { analyzeCodeFile } from './codeAnalyzer.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chunking Service
 * Splits source code into manageable chunks based on AST analysis and file size.
 */

/**
 * @typedef {Object} Chunk
 * @property {string} chunkId
 * @property {number} startLine
 * @property {number} endLine
 * @property {string} type - 'function' | 'class' | 'method' | 'module' | 'module_gap'
 * @property {string} summary
 * @property {string} content
 */

/**
 * Chunks a file based on its size and content.
 * @param {Object} file - { path, content, extractedElements? }
 * @returns {Promise<Chunk[]>}
 */
export async function chunkFile(file) {
  // Ensure we have analysis
  if (!file.extractedElements) {
    const analysis = await analyzeCodeFile(file);
    file.extractedElements = analysis.extractedElements;
  }

  const lines = file.content.split(/\r?\n/);
  const totalLines = lines.length;

  // Rule 1: Small files (< 200 lines) -> Single chunk
  if (totalLines < 200) {
    return [{
      chunkId: `${file.path}:1-${totalLines}`,
      startLine: 1,
      endLine: totalLines,
      type: 'module',
      summary: `Full module content of ${file.path}`,
      content: file.content
    }];
  }

  // Collect entities for splitting
  let entities = [
    ...(file.extractedElements.functions || []).map(f => ({ ...f, type: 'function' })),
    ...(file.extractedElements.classes || []).map(c => ({ ...c, type: 'class' }))
  ];

  // Rule 3: Large files (> 1000 lines) -> Deep AST split (include methods)
  // Only applicable if the parser supports methods (e.g. Python parser)
  if (totalLines > 1000 && file.extractedElements.methods) {
    entities.push(...file.extractedElements.methods.map(m => ({ ...m, type: 'method' })));
  }

  // Sort entities by line number
  entities.sort((a, b) => a.line - b.line);

  // Filter out entities that are contained within others if we are NOT doing deep split?
  // Actually, if we are in Rule 2 (200-1000 lines), we want to split by top-level Functions/Classes.
  // The Python parser's 'functions' list includes top-level functions. 
  // Its 'classes' list includes top-level classes.
  // Its 'methods' list includes methods inside classes.
  // So for Rule 2, we just use functions + classes.
  // For Rule 3, we add methods. 
  // However, if we add methods, we need to handle the fact that they are inside classes.
  // If we have Class (line 10) and Method (line 12), sorting gives Class, Method.
  // Our loop below sets Class end = Method start - 1. 
  // This effectively "shatters" the class into: [Class Header], [Method 1], [Method 2]...
  // This IS a deep split. So the logic holds.

  const chunks = [];
  let currentLine = 1;

  for (let i = 0; i < entities.length; i++) {
    const entity = entities.at(i);
    if (!entity) continue;

    // Skip entities that start before currentLine (overlaps)
    if (entity.line < currentLine) continue;

    // 1. Capture gap before entity
    if (entity.line > currentLine) {
      const endGap = entity.line - 1;
      const gapContent = lines.slice(currentLine - 1, endGap).join('\n');
      
      // Only add gap if it's substantial (e.g. imports, top-level vars)
      if (gapContent.trim()) {
        chunks.push({
          chunkId: `${file.path}:${currentLine}-${endGap}`,
          startLine: currentLine,
          endLine: endGap,
          type: 'module_gap',
          summary: `Code between lines ${currentLine} and ${endGap}`,
          content: gapContent
        });
      }
    }

    // 2. Capture the entity itself
    // Determine end line
    let endLine = totalLines;
    
    // Look ahead for the next entity
    // We need to find the next entity that starts *after* this entity's start
    // (In case of deep nesting, simple sort works for "shattering")
    if (i < entities.length - 1) {
      const nextEntity = entities[i + 1];
      if (nextEntity.line > entity.line) {
        endLine = nextEntity.line - 1;
      }
    }
    
    // Safety check
    if (endLine < entity.line) endLine = entity.line;

    const entityContent = lines.slice(entity.line - 1, endLine).join('\n');
    
    chunks.push({
      chunkId: `${file.path}:${entity.line}-${endLine}`,
      startLine: entity.line,
      endLine: endLine,
      type: entity.type,
      summary: generateSummary(entity),
      content: entityContent
    });

    currentLine = endLine + 1;
  }

  // 3. Capture tail
  if (currentLine <= totalLines) {
    const tailContent = lines.slice(currentLine - 1).join('\n');
    if (tailContent.trim()) {
      chunks.push({
        chunkId: `${file.path}:${currentLine}-${totalLines}`,
        startLine: currentLine,
        endLine: totalLines,
        type: 'module_tail',
        summary: `Remaining code from line ${currentLine}`,
        content: tailContent
      });
    }
  }

  return chunks;
}

/**
 * Generates a summary for a code entity.
 * Can be enhanced to use LLM.
 */
function generateSummary(entity) {
  // If entity has a docstring (from Python parser), use it
  if (entity.docstring) {
    return entity.docstring.split('\n')[0].substring(0, 100);
  }
  
  return `${capitalize(entity.type)}: ${entity.name}`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
