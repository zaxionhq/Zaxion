import { ComplexityMetricsService } from '../src/services/complexityMetrics.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testComplexityMetrics() {
  console.log('--- Testing ComplexityMetricsService ---');
  console.log('CWD:', process.cwd());
  
  const configPath = path.resolve(__dirname, '../src/config/policies/complexity_metrics.yml');
  console.log('Config Path:', configPath);

  const metrics = new ComplexityMetricsService(configPath);
  
  // Create a god object with > 20 methods
  let godObjectCode = 'class GodObject { ';
  for (let i = 1; i <= 25; i++) {
    godObjectCode += `method${i}() {} `;
  }
  godObjectCode += '}';

  const testCases = [
    {
      name: 'God Object (Class with many methods)',
      code: godObjectCode,
      expected: 1,
      policy: 'no-god-objects'
    },
    {
      name: 'Cyclomatic Complexity',
      code: `
        function complexFunction(x) {
          if (x) {
            if (x > 1) { console.log(1); }
            else if (x > 2) { console.log(2); }
            else { console.log(3); }
          }
          for (let i=0; i<10; i++) {
             while(true) { break; }
          }
          // Adding more branches to ensure > 10
          if(x==1){}
          if(x==2){}
          if(x==3){}
          if(x==4){}
        }
      `,
      expected: 1,
      policy: 'max-cyclomatic-complexity'
    },
    {
      name: 'Max Parameters',
      code: `
        function tooManyParams(a, b, c, d, e, f) {
          return a + b;
        }
      `,
      expected: 1,
      policy: 'max-parameter-count'
    },
    {
        name: 'Clean Code',
        code: `
          class SimpleService {
             constructor() {}
             doWork() {}
          }
          function simple(a, b) { return a + b; }
        `,
        expected: 0
    }
  ];

  for (const test of testCases) {
    console.log(`\nTesting: ${test.name}`);
    const violations = metrics.analyzeCode(test.code, 'test.js');
    
    // Filter violations by expected policy if multiple might trigger
    const relevantViolations = test.policy 
        ? violations.filter(v => v.policy === test.policy) 
        : violations;

    if (relevantViolations.length === test.expected) {
      console.log(`✅ PASS: Found ${relevantViolations.length} violations (Expected: ${test.expected})`);
    } else {
      console.log(`❌ FAIL: Found ${relevantViolations.length} violations (Expected: ${test.expected})`);
      relevantViolations.forEach(v => console.log(`   - [${v.policy}] ${v.message} at line ${v.line}`));
    }
  }
}

testComplexityMetrics();
