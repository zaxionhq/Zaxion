/**
 * Appends a standard "Repository documentation map" footer to every *.md
 * under the repo root (excluding node_modules, .git, vendor dirs) unless the
 * file already contains <!-- zaxion-doc-map-footer -->
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MAP_FILE = path.join(REPO_ROOT, 'docs', 'ZAXION_REPOSITORY_DOC_MAP.md');
const MARKER = '<!-- zaxion-doc-map-footer -->';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
]);

function walkMarkdownFiles(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walkMarkdownFiles(full, out);
    } else if (ent.isFile() && ent.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function linkToDocMap(fromFile) {
  const rel = path.relative(path.dirname(fromFile), MAP_FILE).split(path.sep).join('/');
  if (!rel.startsWith('.')) return './' + rel;
  return rel;
}

const footerBody = (linkHref) => `
---

${MARKER}

## Repository documentation map

How this file fits in the Zaxion repo: see **[Zaxion repository documentation map](${linkHref})** (\`docs/ZAXION_REPOSITORY_DOC_MAP.md\`) for folder roles and links to system architecture.

**Text view** (works in any viewer):

\`\`\`text
Zaxion/
├── docs/                    ← phase specs, governance, doc map
├── Incremental Architecture/ ← incremental plans, OPS-001
├── frontend/                ← UI (and frontend/src/Docs)
├── backend/                 ← API, policy engine, evaluation
├── PITCH/                   ← pitch materials
├── README.md                ← entry point
└── docs/ZAXION_REPOSITORY_DOC_MAP.md  ← canonical doc index
\`\`\`

**Diagram** (Mermaid — quoted labels for compatibility):

\`\`\`mermaid
flowchart LR
  root["Zaxion monorepo"]
  map["docs/ZAXION_REPOSITORY_DOC_MAP"]
  here["This markdown file"]
  root --> map
  map --> here
\`\`\`
`;

function main() {
  if (!fs.existsSync(MAP_FILE)) {
    console.error('Missing', MAP_FILE);
    process.exit(1);
  }
  const files = walkMarkdownFiles(REPO_ROOT).filter((f) => path.normalize(f) !== path.normalize(MAP_FILE));
  let updated = 0;
  let skipped = 0;
  for (const file of files) {
    let raw = fs.readFileSync(file, 'utf8');
    if (raw.includes(MARKER)) {
      skipped++;
      continue;
    }
    const href = linkToDocMap(file).replace(/\\/g, '/');
    const append = footerBody(href);
    if (!raw.endsWith('\n')) raw += '\n';
    fs.writeFileSync(file, raw + append, 'utf8');
    updated++;
  }
  console.log(`Doc map footer: updated ${updated}, skipped ${skipped}, total md ${files.length}`);
}

main();
