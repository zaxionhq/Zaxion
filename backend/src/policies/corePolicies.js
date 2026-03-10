export const CORE_POLICIES = [
  // SECURITY (8 Policies)
  {
    id: 'SEC-001',
    name: 'No Hardcoded Secrets',
    description: 'Detects hardcoded secrets (API keys, tokens, credentials) in code.',
    severity: 'CRITICAL',
    category: 'Security',
    remediation: {
      steps: ['Remove the hardcoded secret immediately.', 'Rotate the compromised credential.', 'Use environment variables (process.env) instead.'],
      docs: 'https://zaxion.dev/docs/security/secrets'
    }
  },
  {
    id: 'SEC-002',
    name: 'No SQL Injection Vulnerabilities',
    description: 'Prevents raw SQL queries with user input, creating SQL injection vulnerabilities.',
    severity: 'CRITICAL',
    category: 'Security',
    remediation: {
      steps: ['Use parameterized queries.', 'Use ORM methods.', 'Sanitize input before use.'],
      docs: 'https://zaxion.dev/docs/security/sql-injection'
    }
  },
  {
    id: 'SEC-003',
    name: 'No Unvalidated User Input',
    description: 'Ensures user input is validated before use to prevent XSS and injection attacks.',
    severity: 'HIGH',
    category: 'Security',
    remediation: {
      steps: ['Validate input against a schema.', 'Sanitize input before rendering.', 'Use type checking.'],
      docs: 'https://zaxion.dev/docs/security/input-validation'
    }
  },
  {
    id: 'SEC-004',
    name: 'Dependency Risk Policy',
    description: 'Prevents installation of vulnerable or malicious packages.',
    severity: 'HIGH',
    category: 'Security',
    remediation: {
      steps: ['Upgrade the package to a safe version.', 'Remove the dependency if unused.', 'Check the CVE database.'],
      docs: 'https://zaxion.dev/docs/security/dependencies'
    }
  },
  {
    id: 'SEC-005',
    name: 'Container Security Policy',
    description: 'Ensures container images are scanned for vulnerabilities and use non-root users.',
    severity: 'HIGH',
    category: 'Security',
    remediation: {
      steps: ['Use a distroless base image.', 'Run as a non-root user.', 'Scan image during build.'],
      docs: 'https://zaxion.dev/docs/security/containers'
    }
  },
  {
    id: 'SEC-006',
    name: 'IAM Least Privilege',
    description: 'Enforces least privilege principles for IAM roles and permissions.',
    severity: 'HIGH',
    category: 'Security',
    remediation: {
      steps: ['Remove wildcard permissions.', 'Scope permissions to specific resources.', 'Review access regularly.'],
      docs: 'https://zaxion.dev/docs/security/iam'
    }
  },
  {
    id: 'SEC-007',
    name: 'Encryption at Rest',
    description: 'Verifies that sensitive data is encrypted when stored.',
    severity: 'HIGH',
    category: 'Security',
    remediation: {
      steps: ['Enable encryption on database/storage.', 'Use managed keys (KMS).', 'Rotate keys periodically.'],
      docs: 'https://zaxion.dev/docs/security/encryption'
    }
  },
  {
    id: 'SEC-008',
    name: 'Encryption in Transit',
    description: 'Ensures data is encrypted during transmission (TLS/SSL).',
    severity: 'HIGH',
    category: 'Security',
    remediation: {
      steps: ['Enforce HTTPS.', 'Use TLS 1.2+.', 'Disable insecure ciphers.'],
      docs: 'https://zaxion.dev/docs/security/encryption'
    }
  },
  // RELIABILITY (5 Policies)
  {
    id: 'REL-001',
    name: 'Error Handling Policy',
    description: 'Ensures all errors are caught and handled gracefully.',
    severity: 'HIGH',
    category: 'Reliability',
    remediation: {
      steps: ['Add try/catch blocks.', 'Log errors with context.', 'Return user-friendly error messages.'],
      docs: 'https://zaxion.dev/docs/reliability/error-handling'
    }
  },
  {
    id: 'REL-002',
    name: 'Timeout Configuration',
    description: 'Enforces timeout settings on all external calls.',
    severity: 'MEDIUM',
    category: 'Reliability',
    remediation: {
      steps: ['Set connection timeouts.', 'Set read timeouts.', 'Implement retry logic with backoff.'],
      docs: 'https://zaxion.dev/docs/reliability/timeouts'
    }
  },
  {
    id: 'REL-003',
    name: 'Circuit Breaker Pattern',
    description: 'Requires circuit breakers for potentially failing external services.',
    severity: 'MEDIUM',
    category: 'Reliability',
    remediation: {
      steps: ['Wrap external calls in a circuit breaker.', 'Define fallback logic.', 'Monitor breaker state.'],
      docs: 'https://zaxion.dev/docs/reliability/circuit-breakers'
    }
  },
  {
    id: 'REL-004',
    name: 'Rate Limiting Policy',
    description: 'Ensures APIs are protected by rate limiting.',
    severity: 'MEDIUM',
    category: 'Reliability',
    remediation: {
      steps: ['Implement rate limiting middleware.', 'Configure limits per user/IP.', 'Return 429 status code.'],
      docs: 'https://zaxion.dev/docs/reliability/rate-limiting'
    }
  },
  {
    id: 'REL-005',
    name: 'Health Check Endpoint',
    description: 'Mandates health check endpoints for all services.',
    severity: 'HIGH',
    category: 'Reliability',
    remediation: {
      steps: ['Add /health endpoint.', 'Check database connectivity.', 'Check critical dependencies.'],
      docs: 'https://zaxion.dev/docs/reliability/health-checks'
    }
  },
  // ARCHITECTURE (4 Policies)
  {
    id: 'ARC-001',
    name: 'Layered Architecture',
    description: 'Enforces separation of concerns (Controller -> Service -> Data).',
    severity: 'MEDIUM',
    category: 'Architecture',
    remediation: {
      steps: ['Move business logic to services.', 'Keep controllers thin.', 'Use DTOs for data transfer.'],
      docs: 'https://zaxion.dev/docs/architecture/layered'
    }
  },
  {
    id: 'ARC-002',
    name: 'No Circular Dependencies',
    description: 'Detects and prevents circular dependencies between modules.',
    severity: 'HIGH',
    category: 'Architecture',
    remediation: {
      steps: ['Refactor modules to remove cycles.', 'Use dependency injection.', 'Extract shared code.'],
      docs: 'https://zaxion.dev/docs/architecture/dependencies'
    }
  },
  {
    id: 'ARC-003',
    name: 'API Versioning',
    description: 'Requires all public APIs to be versioned.',
    severity: 'MEDIUM',
    category: 'Architecture',
    remediation: {
      steps: ['Add version prefix to URL (e.g., /v1/).', 'Maintain backward compatibility.', 'Deprecate old versions properly.'],
      docs: 'https://zaxion.dev/docs/architecture/versioning'
    }
  },
  {
    id: 'ARC-004',
    name: 'Stateless Services',
    description: 'Ensures services do not maintain internal state between requests.',
    severity: 'MEDIUM',
    category: 'Architecture',
    remediation: {
      steps: ['Use external stores (Redis/DB) for state.', 'Avoid global variables.', 'Ensure horizontal scalability.'],
      docs: 'https://zaxion.dev/docs/architecture/stateless'
    }
  },
  // CODE QUALITY (5 Policies)
  {
    id: 'COD-001',
    name: 'Function Complexity',
    description: 'Limits cyclomatic complexity of functions.',
    severity: 'LOW',
    category: 'Code Quality',
    remediation: {
      steps: ['Break down complex functions.', 'Extract helper methods.', 'Simplify conditional logic.'],
      docs: 'https://zaxion.dev/docs/quality/complexity'
    }
  },
  {
    id: 'COD-002',
    name: 'Code Duplication',
    description: 'Detects duplicated code blocks.',
    severity: 'LOW',
    category: 'Code Quality',
    remediation: {
      steps: ['Extract common logic.', 'Create utility functions.', 'Use inheritance or composition.'],
      docs: 'https://zaxion.dev/docs/quality/duplication'
    }
  },
  {
    id: 'COD-003',
    name: 'Consistent Naming',
    description: 'Enforces naming conventions (camelCase, PascalCase, etc.).',
    severity: 'LOW',
    category: 'Code Quality',
    remediation: {
      steps: ['Rename variables/functions.', 'Follow language style guide.', 'Configure linter rules.'],
      docs: 'https://zaxion.dev/docs/quality/naming'
    }
  },
  {
    id: 'COD-004',
    name: 'Comment Ratio',
    description: 'Ensures code has adequate documentation comments.',
    severity: 'LOW',
    category: 'Code Quality',
    remediation: {
      steps: ['Add JSDoc/docstrings.', 'Explain complex logic.', 'Document public APIs.'],
      docs: 'https://zaxion.dev/docs/quality/comments'
    }
  },
  {
    id: 'COD-005',
    name: 'No Dead Code',
    description: 'Identifies unused variables, functions, and imports.',
    severity: 'LOW',
    category: 'Code Quality',
    remediation: {
      steps: ['Remove unused code.', 'Check for side effects.', 'Clean up imports.'],
      docs: 'https://zaxion.dev/docs/quality/dead-code'
    }
  },
  // TESTING (4 Policies)
  {
    id: 'TST-001',
    name: 'Test Coverage Policy',
    description: 'Ensures all critical code changes have corresponding tests.',
    severity: 'HIGH',
    category: 'Testing',
    remediation: {
      steps: ['Add unit tests.', 'Check branch coverage.', 'Run tests before commit.'],
      docs: 'https://zaxion.dev/docs/testing/coverage'
    }
  },
  {
    id: 'TST-002',
    name: 'No Flaky Tests',
    description: 'Detects tests that fail intermittently.',
    severity: 'MEDIUM',
    category: 'Testing',
    remediation: {
      steps: ['Avoid reliance on timing/sleep.', 'Mock external dependencies.', 'Ensure test isolation.'],
      docs: 'https://zaxion.dev/docs/testing/flaky-tests'
    }
  },
  {
    id: 'TST-003',
    name: 'Integration Test Requirement',
    description: 'Requires integration tests for API endpoints.',
    severity: 'MEDIUM',
    category: 'Testing',
    remediation: {
      steps: ['Write API tests.', 'Test database interactions.', 'Verify contract compliance.'],
      docs: 'https://zaxion.dev/docs/testing/integration'
    }
  },
  {
    id: 'TST-004',
    name: 'Test Execution Time',
    description: 'Ensures tests run within acceptable time limits.',
    severity: 'LOW',
    category: 'Testing',
    remediation: {
      steps: ['Optimize slow tests.', 'Run tests in parallel.', 'Mock slow dependencies.'],
      docs: 'https://zaxion.dev/docs/testing/performance'
    }
  },
  // PERFORMANCE (4 Policies)
  {
    id: 'PRF-001',
    name: 'Database Query Optimization',
    description: 'Detects slow or unoptimized database queries (N+1 problem).',
    severity: 'HIGH',
    category: 'Performance',
    remediation: {
      steps: ['Use eager loading.', 'Add indexes.', 'Analyze query execution plans.'],
      docs: 'https://zaxion.dev/docs/performance/database'
    }
  },
  {
    id: 'PRF-002',
    name: 'Memory Leak Detection',
    description: 'Identifies potential memory leaks in code patterns.',
    severity: 'HIGH',
    category: 'Performance',
    remediation: {
      steps: ['Clear intervals/timeouts.', 'Unsubscribe from events.', 'Avoid global state accumulation.'],
      docs: 'https://zaxion.dev/docs/performance/memory'
    }
  },
  {
    id: 'PRF-003',
    name: 'Asset Size Limit',
    description: 'Enforces limits on bundle and asset sizes.',
    severity: 'MEDIUM',
    category: 'Performance',
    remediation: {
      steps: ['Compress images.', 'Minify code.', 'Use code splitting.'],
      docs: 'https://zaxion.dev/docs/performance/assets'
    }
  },
  {
    id: 'PRF-004',
    name: 'No Blocking Operations',
    description: 'Prevents blocking I/O operations in the main thread.',
    severity: 'HIGH',
    category: 'Performance',
    remediation: {
      steps: ['Use async/await.', 'Offload CPU-intensive tasks.', 'Use worker threads.'],
      docs: 'https://zaxion.dev/docs/performance/blocking'
    }
  }
];
