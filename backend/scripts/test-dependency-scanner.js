import { DependencyScannerService } from '../src/services/dependencyScanner.service.js';

async function testDependencyScanner() {
  console.log('--- Testing DependencyScannerService ---');
  // We don't mock logger, just let it output
  const scanner = new DependencyScannerService();

  const testCases = [
    {
      name: 'Vulnerable Dependencies',
      packageJson: JSON.stringify({
        "dependencies": {
            "lodash": "4.17.15",
            "axios": "0.21.0"
        }
      }),
      expected: 2
    },
    {
      name: 'Safe Dependencies',
      packageJson: JSON.stringify({
        "dependencies": {
            "lodash": "4.17.21",
            "axios": "0.21.2"
        }
      }),
      expected: 0
    },
    {
        name: 'Vulnerable Dev Dependency',
        packageJson: JSON.stringify({
            "devDependencies": {
                "express": "4.16.0"
            }
        }),
        expected: 1
    }
  ];

  for (const test of testCases) {
    console.log(`\nTesting: ${test.name}`);
    const violations = await scanner.scanPackageJson(test.packageJson, 'package.json');
    
    if (violations.length === test.expected) {
      console.log(`✅ PASS: Found ${violations.length} violations (Expected: ${test.expected})`);
    } else {
      console.log(`❌ FAIL: Found ${violations.length} violations (Expected: ${test.expected})`);
      violations.forEach(v => console.log(`   - ${v.message}`));
    }
  }
}

testDependencyScanner();
