
/**
 * Python AST Parser
 * Extracts structure from Python code including functions, classes, imports, and docstrings.
 * 
 * NOTE: This is a regex/line-based parser and may not cover all complex Python syntax cases.
 * It is designed to be robust enough for standard test generation tasks.
 */

/**
 * @typedef {Object} PyFunction
 * @property {string} name
 * @property {string[]} params
 * @property {string[]} returnStatements
 * @property {string} [docstring]
 * @property {number} line
 */

/**
 * @typedef {Object} PyClass
 * @property {string} name
 * @property {PyFunction[]} methods
 * @property {string} [docstring]
 * @property {number} line
 */

/**
 * @typedef {Object} PyImport
 * @property {string} source
 * @property {string[]} names
 * @property {number} line
 */

/**
 * Parses Python source code to extract AST structure
 * @param {string} code 
 * @returns {Object}
 */
export function parsePythonCode(code) {
  const lines = code.split(/\r?\n/);
  
  const functions = [];
  const classes = [];
  const imports = [];
  const methods = []; // Flat list of all methods
  const comments = [];

  let currentClass = null;
  
  // State for multi-line strings (docstrings)
  let inDocstring = false;
  let docstringQuote = '';
  let collectedDocstring = [];

  // Regex patterns - Hardened to avoid ReDoS by limiting repetitions
  const classRegex = /^[ \t]{0,100}class[ \t]{1,100}([a-zA-Z0-9_]+)(?:\([ \t]{0,100}([^)]*?)[ \t]{0,100}\))?[ \t]{0,100}:/;
  const defRegex = /^[ \t]{0,100}def[ \t]{1,100}([a-zA-Z0-9_]+)[ \t]{0,100}\(([^)]*?)\)(?:[ \t]{0,100}->[ \t]{0,100}[^:]{1,100})?[ \t]{0,100}:/;
  const importRegex = /^[ \t]{0,100}import[ \t]{1,100}([a-zA-Z0-9_., \t]{1,500})$/;
  const fromImportRegex = /^[ \t]{0,100}from[ \t]{1,100}([a-zA-Z0-9_.]+)[ \t]{1,100}import[ \t]{1,100}([a-zA-Z0-9_., \t]{1,500})$/;
  const returnRegex = /^[ \t]{0,100}return[ \t]{1,100}(.{0,1000})$/;
  const commentRegex = /^[ \t]{0,100}#[ \t]{0,100}(.{0,1000})$/;

  // Helper to get indentation level (number of spaces)
  const getIndent = (line) => {
    if (typeof line !== 'string') return 0;
    const match = line.match(/^([ \t]*)/);
    return match ? match[1].length : 0;
  };

  // Helper to attach docstring to the most recent entity
  const attachDocstring = (docText) => {
    // Find the most recently defined entity
    // We check classes, functions, and methods
    const lastClass = classes.at(-1);
    const lastFunc = functions.at(-1);
    const lastMethod = lastClass && lastClass.methods ? lastClass.methods.at(-1) : null;
    
    // Logic: 
    // If lastMethod is defined after lastFunc and lastClass, it's the target.
    // If lastFunc is defined after lastClass and lastMethod, it's the target.
    // If lastClass is defined after lastFunc (and methods), it's the target.
    
    const candidates = [
        { entity: lastClass, line: lastClass ? lastClass.line : -1 },
        { entity: lastFunc, line: lastFunc ? lastFunc.line : -1 },
        { entity: lastMethod, line: lastMethod ? lastMethod.line : -1 }
    ];
    
    candidates.sort((a, b) => b.line - a.line);
    const target = candidates.at(0).entity;
    
    if (target && !target.docstring) {
        target.docstring = docText;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines.at(i);
    if (typeof line !== 'string') continue;
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    // 1. Handle Docstrings/Multi-line strings
    if (inDocstring) {
      if (line.includes(docstringQuote)) {
        const parts = line.split(docstringQuote);
        collectedDocstring.push(parts[0]);
        inDocstring = false;
        
        const docText = collectedDocstring.join('\n').trim();
        attachDocstring(docText);
        
        // Reset
        collectedDocstring = [];
      } else {
        collectedDocstring.push(line);
      }
      continue;
    }
    
    // Check for start of docstring
    if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
      const quote = trimmedLine.startsWith('"""') ? '"""' : "'''";
      // Check if it's a one-line docstring
      const afterStart = trimmedLine.slice(3);
      if (afterStart.includes(quote)) {
        // One-line docstring
        const docText = afterStart.slice(0, afterStart.lastIndexOf(quote));
        attachDocstring(docText);
      } else {
        inDocstring = true;
        docstringQuote = quote;
        collectedDocstring.push(afterStart);
      }
      continue;
    }

    // 2. Comments
    const commentMatch = trimmedLine.match(commentRegex);
    if (commentMatch) {
      comments.push({
        text: commentMatch[1],
        line: i + 1
      });
      continue;
    }

    // 3. Imports
    const importMatch = trimmedLine.match(importRegex);
    if (importMatch) {
      imports.push({
        source: importMatch[1].trim(),
        names: importMatch[1].split(',').map(s => s.trim()),
        line: i + 1
      });
      continue;
    }
    
    const fromMatch = trimmedLine.match(fromImportRegex);
    if (fromMatch) {
      imports.push({
        source: fromMatch[1],
        names: fromMatch[2].split(',').map(s => s.trim()),
        line: i + 1
      });
      continue;
    }

    // 4. Classes
    const classMatch = line.match(classRegex);
    if (classMatch) {
      const className = classMatch[1];
      const bases = classMatch[2] ? classMatch[2].split(',').map(s => s.trim()) : [];
      
      const newClass = {
        name: className,
        bases,
        methods: [],
        line: i + 1
      };
      
      classes.push(newClass);
      currentClass = newClass;
      continue;
    }

    // 5. Functions / Methods
    const defMatch = line.match(defRegex);
    if (defMatch) {
      const funcName = defMatch[1];
      const paramsRaw = defMatch[2];
      const params = paramsRaw.split(',').map(p => p.trim()).filter(p => p);
      
      const newFunc = {
        name: funcName,
        params,
        returnStatements: [],
        line: i + 1
      };

      const indent = getIndent(line);
      
      // Heuristic: if indent > 0 and we have a currentClass, it's likely a method.
      if (indent > 0 && currentClass) {
        if (indent === 0) {
          currentClass = null;
          functions.push(newFunc);
        } else {
          currentClass.methods.push(newFunc);
          methods.push({ ...newFunc, className: currentClass.name });
        }
      } else {
        if (indent === 0) {
            currentClass = null;
        }
        functions.push(newFunc);
      }
      continue;
    }

    // 6. Return statements
    const returnMatch = trimmedLine.match(returnRegex);
    if (returnMatch) {
      const lastFunc = functions.length > 0 ? functions[functions.length - 1] : null;
      const lastClass = classes.length > 0 ? classes[classes.length - 1] : null;
      const lastMethod = lastClass && lastClass.methods.length > 0 ? lastClass.methods[lastClass.methods.length - 1] : null;
      
      let target = null;
      // We assume return statement belongs to the method if method is more recent than function
      // But strictly, we should check indentation or scope. 
      // Line comparison is a decent heuristic for sequential definitions.
      if (lastMethod && (!lastFunc || lastMethod.line > lastFunc.line)) {
        target = lastMethod;
      } else if (lastFunc) {
        target = lastFunc;
      }
      
      if (target) {
        target.returnStatements.push(returnMatch[1]);
      }
    }
  }

  return {
    language: "python",
    functions,
    classes,
    methods,
    imports,
    comments
  };
}
