import { PatternMatcherService } from '../src/services/patternMatcher.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPatternMatcher() {
  console.log('--- Testing PatternMatcherService ---');
  console.log('CWD:', process.cwd());
  
  const configPath = path.resolve(__dirname, '../src/config/policies/security_patterns.yml');
  console.log('Config Path:', configPath);

  // We don't mock logger, just let it output
  const matcher = new PatternMatcherService(configPath);

  const testCases = [
    {
      name: 'Hardcoded Secrets',
      code: `
        const awsKey = "AKIA1234567890ABCDEF";
        const password = "mySuperSecretPassword";
      `,
      expected: 2
    },
    {
      name: 'SQL Injection',
      code: `
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.query(\`SELECT * FROM users WHERE email = \${email}\`);
      `,
      expected: 2
    },
    {
      name: 'Console Logs',
      code: `
        console.log("Debug info");
        console.error("Error occurred");
      `,
      expected: 2
    },
    {
      name: 'Magic Numbers',
      code: `
        if (retries > 3) {
           setTimeout(1000);
        }
        const MAX_RETRIES = 5; // Should be ignored
      `,
      expected: 2 // 3 and 1000
    },
    {
        name: 'Clean Code',
        code: `
            const MAX_RETRIES = 3;
            if (retries > MAX_RETRIES) {
                logger.info("Too many retries");
            }
        `,
        expected: 0
    }
  ];

  for (const test of testCases) {
    console.log(`\nTesting: ${test.name}`);
    const violations = matcher.analyzeCode(test.code, 'test.js');
    
    if (violations.length === test.expected) {
      console.log(`✅ PASS: Found ${violations.length} violations (Expected: ${test.expected})`);
    } else {
      console.log(`❌ FAIL: Found ${violations.length} violations (Expected: ${test.expected})`);
      violations.forEach(v => console.log(`   - [${v.policy}] ${v.pattern} at line ${v.line}: ${v.code}`));
    }
  }
}

testPatternMatcher();
