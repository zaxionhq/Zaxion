# Zaxion: Top 30 Core Policies for Enterprise Teams (50-200 Engineers)

**A comprehensive policy library addressing the most common violations, high-impact issues, and team pain points**

---

## Introduction

These 30 core policies are designed for engineering teams of 50-200 engineers. They address the most common violations that developers make, the issues that cause production bugs, and the patterns that accumulate technical debt. Each policy is based on real-world scenarios where teams have spent hours debugging issues that should have been caught before merge.

The policies are organized into six categories: **Security**, **Reliability**, **Architecture**, **Code Quality**, **Testing**, and **Performance**. Each policy includes the problem it solves, the business impact, implementation details, and enforcement recommendations.

---

## CATEGORY 1: SECURITY POLICIES (8 Policies)

### Policy 1: No Hardcoded Secrets

**Problem:** Developers hardcode API keys, database passwords, and authentication tokens directly in code. This is the #1 cause of security breaches.

**Business Impact:** A single hardcoded secret in a public repository can expose your entire infrastructure. Even in private repos, it's a compliance violation. Teams have spent weeks rotating credentials after a secret leaked.

**What it catches:**
- API keys (AWS, Stripe, OpenAI, etc.)
- Database passwords
- Authentication tokens
- Private encryption keys
- OAuth secrets
- Webhook signing keys

**How it works:** Uses AST analysis and pattern matching to detect common secret patterns. Checks for hardcoded strings that match secret formats (AWS key patterns, JWT tokens, etc.). Scans environment variable assignments in code.

**Enforcement:** MANDATORY for all repositories. HIGH SEVERITY.

**Example violation:**
```javascript
const apiKey = "sk-proj-abc123def456..."; // BLOCKED
const dbPassword = "postgres://user:password@localhost"; // BLOCKED
const token = "ghp_abc123def456..."; // BLOCKED
```

**How to fix:** Use environment variables, secrets management systems (AWS Secrets Manager, HashiCorp Vault, GitHub Secrets), or configuration files that are gitignored.

**False positive prevention:** Whitelist known safe patterns (test keys, documentation examples).

---

### Policy 2: No SQL Injection Vulnerabilities

**Problem:** Developers write raw SQL queries with user input, creating SQL injection vulnerabilities that can expose or delete entire databases.

**Business Impact:** A single SQL injection vulnerability can compromise customer data, cause data loss, and result in regulatory fines. Teams have spent days recovering from SQL injection attacks.

**What it catches:**
- String concatenation in SQL queries
- Unparameterized queries with user input
- Dynamic SQL construction
- Missing parameterized query usage

**How it works:** Detects raw SQL strings with variable interpolation. Flags queries that don't use parameterized statements. Checks for common SQL injection patterns.

**Enforcement:** MANDATORY for all code touching databases. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);

// BLOCKED - Unparameterized
const query = "SELECT * FROM users WHERE email = '" + email + "'";
db.query(query);
```

**How to fix:** Use parameterized queries or prepared statements.

```javascript
// ALLOWED - Parameterized
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

// ALLOWED - ORM
const user = await User.findById(userId);
```

---

### Policy 3: No Unvalidated User Input

**Problem:** Developers use user input directly without validation, leading to XSS, injection, and other input-based attacks.

**Business Impact:** Unvalidated input is the root cause of many security vulnerabilities. Teams have experienced XSS attacks, data corruption, and compliance violations due to unvalidated input.

**What it catches:**
- User input used directly in HTML
- User input used in database queries
- User input used in system commands
- User input used without sanitization
- Missing input validation

**How it works:** Tracks data flow from user input sources to sinks where validation should occur. Detects when user input is used without validation.

**Enforcement:** MANDATORY for all user-facing code. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Direct HTML insertion
const html = `<div>${userInput}</div>`;
document.innerHTML = html;

// BLOCKED - No validation
const query = db.query("SELECT * FROM users WHERE name = ?", [userInput]);
```

**How to fix:** Validate and sanitize all user input.

```javascript
// ALLOWED - Validated input
const sanitized = sanitizeInput(userInput);
const html = `<div>${sanitized}</div>`;

// ALLOWED - Parameterized + validated
const validated = validateEmail(userInput);
const query = db.query("SELECT * FROM users WHERE email = ?", [validated]);
```

---

### Policy 4: No Unencrypted Sensitive Data in Transit

**Problem:** Developers send sensitive data (passwords, tokens, PII) over unencrypted connections (HTTP, unencrypted WebSockets).

**Business Impact:** Man-in-the-middle attacks can intercept sensitive data. Teams have experienced data breaches due to unencrypted transmission.

**What it catches:**
- HTTP requests for sensitive endpoints
- Unencrypted WebSocket connections for sensitive data
- Unencrypted database connections
- Missing TLS/SSL configuration

**How it works:** Detects HTTP (non-HTTPS) requests to sensitive endpoints. Flags unencrypted connection strings. Checks for missing TLS configuration.

**Enforcement:** MANDATORY for all production code. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - HTTP for sensitive data
fetch("http://api.example.com/auth/login", { method: "POST", body: credentials });

// BLOCKED - Unencrypted database
const conn = mysql.createConnection("mysql://user:pass@localhost");
```

**How to fix:** Always use HTTPS and encrypted connections.

```javascript
// ALLOWED - HTTPS
fetch("https://api.example.com/auth/login", { method: "POST", body: credentials });

// ALLOWED - Encrypted connection
const conn = mysql.createConnection("mysql+ssl://user:pass@localhost");
```

---

### Policy 5: No Insecure Cryptography

**Problem:** Developers use weak or deprecated cryptographic algorithms (MD5, SHA1, DES) instead of modern, secure ones (SHA-256, bcrypt, PBKDF2).

**Business Impact:** Weak cryptography can be broken by attackers, exposing encrypted data. Teams have had to re-encrypt data after discovering weak algorithms.

**What it catches:**
- MD5 hashing
- SHA1 hashing
- DES encryption
- RC4 encryption
- Weak random number generation
- Deprecated crypto libraries

**How it works:** Detects usage of known weak cryptographic algorithms. Flags deprecated crypto libraries. Checks for weak random number generation.

**Enforcement:** MANDATORY for all cryptographic operations. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Weak hashing
const hash = md5(password);
const hash = sha1(password);

// BLOCKED - Weak encryption
const encrypted = des.encrypt(data);
```

**How to fix:** Use modern, secure cryptographic algorithms.

```javascript
// ALLOWED - Strong hashing
const hash = bcrypt.hash(password, 10);
const hash = crypto.createHash('sha256').update(password).digest();

// ALLOWED - Strong encryption
const encrypted = crypto.createCipheriv('aes-256-gcm', key, iv);
```

---

### Policy 6: No Exposed Admin Endpoints

**Problem:** Developers create admin endpoints without proper authentication or authorization, allowing unauthorized access to sensitive operations.

**Business Impact:** Exposed admin endpoints allow attackers to perform unauthorized operations (delete data, modify settings, create accounts). Teams have experienced data loss and unauthorized access due to exposed admin endpoints.

**What it catches:**
- Admin endpoints without authentication
- Admin endpoints with weak authentication
- Admin endpoints without authorization checks
- Endpoints that bypass authentication

**How it works:** Detects endpoints with "admin" or "internal" in the path. Checks for missing authentication middleware. Flags endpoints that don't check user permissions.

**Enforcement:** MANDATORY for all endpoints. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - No authentication
app.get("/admin/users", (req, res) => {
  res.json(User.findAll());
});

// BLOCKED - Weak authentication
app.delete("/admin/data", (req, res) => {
  if (req.query.password === "admin123") {
    deleteAllData();
  }
});
```

**How to fix:** Require strong authentication and authorization.

```javascript
// ALLOWED - Proper authentication
app.get("/admin/users", requireAuth, requireAdmin, (req, res) => {
  res.json(User.findAll());
});
```

---

### Policy 7: No Dependency Vulnerabilities

**Problem:** Developers use packages with known security vulnerabilities, exposing the application to attacks.

**Business Impact:** A single vulnerable dependency can compromise the entire application. Teams have experienced security incidents due to vulnerable dependencies.

**What it catches:**
- Known vulnerable package versions
- Packages with unpatched security issues
- Outdated packages with known vulnerabilities

**How it works:** Scans package.json/requirements.txt against vulnerability databases (NVD, GitHub Advisory Database). Checks for known CVEs in dependencies.

**Enforcement:** MANDATORY for all dependencies. HIGH SEVERITY.

**Example violation:**
```json
{
  "dependencies": {
    "lodash": "4.17.15" // BLOCKED - Known vulnerabilities
  }
}
```

**How to fix:** Update to patched versions.

```json
{
  "dependencies": {
    "lodash": "4.17.21" // ALLOWED - Patched version
  }
}
```

---

### Policy 8: No Debug Mode in Production

**Problem:** Developers leave debug mode enabled in production code, exposing sensitive information and creating security vulnerabilities.

**Business Impact:** Debug mode can expose stack traces, configuration, and sensitive data. Teams have experienced information disclosure due to debug mode in production.

**What it catches:**
- Debug flags enabled in production
- Verbose logging in production
- Stack traces exposed to users
- Development configuration in production

**How it works:** Detects debug flags, verbose logging, and development-only code in production branches. Checks for environment-specific configuration.

**Enforcement:** MANDATORY for production code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// BLOCKED in production
if (process.env.NODE_ENV === "production") {
  app.set("debug", true); // BLOCKED
  console.log(sensitiveData); // BLOCKED
}
```

**How to fix:** Disable debug mode in production.

```javascript
// ALLOWED
if (process.env.NODE_ENV === "production") {
  app.set("debug", false);
  logger.info("Application started");
}
```

---

## CATEGORY 2: RELIABILITY POLICIES (6 Policies)

### Policy 9: Required Test Coverage for Critical Code

**Problem:** Developers modify critical code (auth, payments, core logic) without adding tests, leading to production bugs that take hours to debug.

**Business Impact:** A single untested change to payment code can cause payment failures, data loss, or security issues. Teams have spent days debugging production issues that would have been caught by tests.

**What it catches:**
- Changes to authentication code without tests
- Changes to payment code without tests
- Changes to core business logic without tests
- Changes to database schema without tests
- Changes to security-critical code without tests

**How it works:** Identifies high-risk files (auth, payment, security). Checks if corresponding test files were added/modified. Calculates coverage impact.

**Enforcement:** MANDATORY for critical code. HIGH SEVERITY.

**Example violation:**
```javascript
// Modified auth/login.js without adding tests
// BLOCKED - No corresponding test file modified
```

**How to fix:** Add tests for critical code changes.

```javascript
// auth/login.test.js
describe("login", () => {
  it("should authenticate valid credentials", () => {
    // test
  });
});
```

---

### Policy 10: Minimum Test Coverage Threshold

**Problem:** Developers reduce test coverage over time, leading to untested code paths and production bugs.

**Business Impact:** Low test coverage means bugs slip through to production. Teams have experienced regressions due to untested code paths.

**What it catches:**
- PRs that reduce overall test coverage
- PRs that add code without tests
- Test coverage below threshold (e.g., 80%)

**How it works:** Calculates test coverage before and after the PR. Flags PRs that reduce coverage. Checks if new code has adequate test coverage.

**Enforcement:** MANDATORY for all code. MEDIUM SEVERITY.

**Example violation:**
```
Coverage before: 85%
Coverage after: 82%
BLOCKED - Coverage decreased by 3%
```

**How to fix:** Add tests to maintain or increase coverage.

---

### Policy 11: No Unhandled Promise Rejections

**Problem:** Developers create promises without .catch() or try/catch, leading to unhandled rejections that crash the application.

**Business Impact:** Unhandled promise rejections cause application crashes and downtime. Teams have experienced production outages due to unhandled rejections.

**What it catches:**
- Promises without .catch()
- Async/await without try/catch
- Missing error handlers
- Swallowed errors

**How it works:** Detects promise chains without error handlers. Flags async functions without try/catch. Checks for error handling completeness.

**Enforcement:** MANDATORY for all async code. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - No error handler
fetch("/api/data").then(res => res.json()).then(data => process(data));

// BLOCKED - No try/catch
async function getData() {
  const data = await fetch("/api/data").json();
  return data;
}
```

**How to fix:** Add proper error handling.

```javascript
// ALLOWED - With error handler
fetch("/api/data")
  .then(res => res.json())
  .then(data => process(data))
  .catch(err => handleError(err));

// ALLOWED - With try/catch
async function getData() {
  try {
    const data = await fetch("/api/data").json();
    return data;
  } catch (err) {
    handleError(err);
  }
}
```

---

### Policy 12: No Null/Undefined Reference Errors

**Problem:** Developers access properties on potentially null/undefined values, causing runtime errors that crash the application.

**Business Impact:** Null/undefined reference errors cause application crashes. Teams have spent hours debugging "Cannot read property of undefined" errors in production.

**What it catches:**
- Accessing properties without null checks
- Array access without bounds checking
- Missing optional chaining
- Unsafe type casting

**How it works:** Detects property access on potentially null/undefined values. Flags missing null checks. Checks for unsafe array access.

**Enforcement:** MANDATORY for all code. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - No null check
const name = user.profile.name;

// BLOCKED - No bounds check
const first = items[0].value;

// BLOCKED - Unsafe casting
const count = (data as any).count;
```

**How to fix:** Add proper null checks and optional chaining.

```javascript
// ALLOWED - With null check
const name = user?.profile?.name;

// ALLOWED - With bounds check
const first = items.length > 0 ? items[0].value : null;

// ALLOWED - Safe casting
const count = typeof data === 'object' && 'count' in data ? data.count : 0;
```

---

### Policy 13: No Infinite Loops or Recursion

**Problem:** Developers create infinite loops or unbounded recursion that consume CPU and memory, causing application hangs and crashes.

**Business Impact:** Infinite loops cause application hangs, memory leaks, and crashes. Teams have experienced production outages due to infinite loops.

**What it catches:**
- Infinite loops (while(true), for(;;))
- Unbounded recursion
- Missing loop exit conditions
- Missing recursion base cases

**How it works:** Detects infinite loops and unbounded recursion patterns. Flags loops without clear exit conditions. Checks for recursion base cases.

**Enforcement:** MANDATORY for all loops and recursion. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Infinite loop
while (true) {
  process();
}

// BLOCKED - Unbounded recursion
function traverse(node) {
  traverse(node.next); // No base case
}
```

**How to fix:** Add proper exit conditions and base cases.

```javascript
// ALLOWED - With exit condition
while (shouldContinue()) {
  process();
}

// ALLOWED - With base case
function traverse(node) {
  if (!node) return;
  traverse(node.next);
}
```

---

### Policy 14: No Resource Leaks

**Problem:** Developers open files, connections, or streams without closing them, leading to resource exhaustion and application crashes.

**Business Impact:** Resource leaks cause memory exhaustion, connection pool exhaustion, and application crashes. Teams have experienced production outages due to resource leaks.

**What it catches:**
- Files opened without closing
- Database connections not closed
- Streams not closed
- Event listeners not removed
- Timers not cleared

**How it works:** Detects resource allocation without corresponding cleanup. Flags missing .close() calls. Checks for missing cleanup in error paths.

**Enforcement:** MANDATORY for all resource management. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - File not closed
const file = fs.openSync("data.txt");
const data = fs.readFileSync(file);

// BLOCKED - Connection not closed
const conn = db.connect();
const data = await conn.query("SELECT * FROM users");

// BLOCKED - Event listener not removed
window.addEventListener("resize", handleResize);
```

**How to fix:** Properly close resources.

```javascript
// ALLOWED - File closed
const file = fs.openSync("data.txt");
try {
  const data = fs.readFileSync(file);
} finally {
  fs.closeSync(file);
}

// ALLOWED - Connection closed
const conn = db.connect();
try {
  const data = await conn.query("SELECT * FROM users");
} finally {
  conn.close();
}

// ALLOWED - Listener removed
window.addEventListener("resize", handleResize);
window.removeEventListener("resize", handleResize);
```

---

## CATEGORY 3: ARCHITECTURE POLICIES (6 Policies)

### Policy 15: No Circular Dependencies

**Problem:** Developers create circular dependencies between modules, making code hard to test, refactor, and understand.

**Business Impact:** Circular dependencies make code fragile and hard to maintain. Teams have spent days refactoring code to break circular dependencies.

**What it catches:**
- Module A imports from Module B which imports from Module A
- Circular imports between layers
- Bidirectional dependencies

**How it works:** Builds a dependency graph and detects cycles. Flags imports that create cycles.

**Enforcement:** MANDATORY for all code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// auth.js
import { validateUser } from "./user.js";

// user.js
import { checkPermission } from "./auth.js"; // BLOCKED - Circular

// BLOCKED - Circular dependency detected
```

**How to fix:** Refactor to break the cycle.

```javascript
// common.js
export function validateUser() { }

// auth.js
import { validateUser } from "./common.js";

// user.js
import { validateUser } from "./common.js";
```

---

### Policy 16: No Cross-Layer Imports

**Problem:** Developers import from lower layers into higher layers (e.g., Domain importing from Infrastructure), violating clean architecture principles.

**Business Impact:** Cross-layer imports create tight coupling and make code hard to test and refactor. Teams have spent days refactoring code to fix architecture violations.

**What it catches:**
- Domain layer importing from Infrastructure layer
- Presentation layer importing from Infrastructure layer
- Higher layers depending on lower layers
- Violating defined architecture patterns

**How it works:** Defines allowed import paths based on architecture layers. Flags imports that violate the architecture.

**Enforcement:** MANDATORY for all code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// domain/user.js
import { DatabaseConnection } from "../infrastructure/db.js"; // BLOCKED

// presentation/dashboard.js
import { DatabaseConnection } from "../infrastructure/db.js"; // BLOCKED
```

**How to fix:** Use dependency injection or interfaces.

```javascript
// domain/user.js
export class User {
  constructor(repository) {
    this.repository = repository;
  }
}

// infrastructure/userRepository.js
import { User } from "../domain/user.js";
export class UserRepository {
  // implementation
}
```

---

### Policy 17: No God Objects

**Problem:** Developers create classes with too many responsibilities, making code hard to understand, test, and maintain.

**Business Impact:** God objects make code unmaintainable. Teams have spent weeks refactoring god objects.

**What it catches:**
- Classes with more than 10 public methods
- Classes with more than 500 lines
- Classes with multiple responsibilities
- Classes with too many dependencies

**How it works:** Analyzes class structure. Flags classes that exceed thresholds for methods, lines of code, or dependencies.

**Enforcement:** RECOMMENDED for all code. LOW SEVERITY.

**Example violation:**
```javascript
// BLOCKED - God object
class UserManager {
  createUser() { }
  deleteUser() { }
  updateUser() { }
  authenticateUser() { }
  authorizeUser() { }
  logUserActivity() { }
  sendUserEmail() { }
  generateUserReport() { }
  // ... 20+ more methods
}
```

**How to fix:** Split into multiple classes.

```javascript
class UserService {
  createUser() { }
  deleteUser() { }
  updateUser() { }
}

class AuthenticationService {
  authenticate() { }
  authorize() { }
}

class UserNotificationService {
  sendEmail() { }
}
```

---

### Policy 18: No Hardcoded Configuration

**Problem:** Developers hardcode configuration values (URLs, timeouts, feature flags) in code, making it impossible to change without redeploying.

**Business Impact:** Hardcoded configuration makes it impossible to change settings without code changes. Teams have had to redeploy code just to change a timeout value.

**What it catches:**
- Hardcoded URLs
- Hardcoded timeouts
- Hardcoded feature flags
- Hardcoded environment-specific values
- Hardcoded thresholds

**How it works:** Detects hardcoded values that should be configuration. Flags magic numbers and strings that should be configurable.

**Enforcement:** MANDATORY for all code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Hardcoded URL
const apiUrl = "https://api.example.com";

// BLOCKED - Hardcoded timeout
const timeout = 5000;

// BLOCKED - Hardcoded feature flag
const enableNewFeature = true;

// BLOCKED - Hardcoded threshold
if (count > 100) { }
```

**How to fix:** Use configuration management.

```javascript
// config.js
export const config = {
  apiUrl: process.env.API_URL,
  timeout: process.env.TIMEOUT || 5000,
  features: {
    enableNewFeature: process.env.ENABLE_NEW_FEATURE === "true"
  }
};

// usage.js
import { config } from "./config.js";
const apiUrl = config.apiUrl;
const timeout = config.timeout;
```

---

### Policy 19: No Monolithic Functions

**Problem:** Developers create functions that are too long and do too many things, making code hard to understand, test, and maintain.

**Business Impact:** Monolithic functions make code unmaintainable. Teams have spent days understanding and debugging long functions.

**What it catches:**
- Functions longer than 50 lines
- Functions with more than 5 parameters
- Functions with multiple responsibilities
- Functions with high cyclomatic complexity

**How it works:** Analyzes function structure. Flags functions that exceed thresholds for length, parameters, or complexity.

**Enforcement:** RECOMMENDED for all code. LOW SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Too long, too many responsibilities
function processUserData(user, db, cache, email, logger) {
  // 100+ lines of code
  // Validates user
  // Saves to database
  // Updates cache
  // Sends email
  // Logs activity
}
```

**How to fix:** Split into smaller functions.

```javascript
function processUserData(user, dependencies) {
  validateUser(user);
  saveUser(user, dependencies.db);
  updateCache(user, dependencies.cache);
  notifyUser(user, dependencies.email);
  logActivity(user, dependencies.logger);
}
```

---

### Policy 20: No Deprecated APIs

**Problem:** Developers use deprecated APIs that will be removed in future versions, creating technical debt and future breaking changes.

**Business Impact:** Using deprecated APIs creates technical debt. Teams have had to refactor code when deprecated APIs are removed.

**What it catches:**
- Deprecated library functions
- Deprecated language features
- Deprecated framework methods
- Outdated patterns

**How it works:** Detects usage of deprecated APIs. Flags deprecated library functions. Checks for outdated patterns.

**Enforcement:** MANDATORY for all code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Deprecated API
const data = JSON.parse(jsonString, undefined, 2); // Third parameter deprecated

// BLOCKED - Deprecated method
element.innerHTML = html; // Use textContent instead

// BLOCKED - Deprecated pattern
var x = 5; // Use const/let instead
```

**How to fix:** Use current APIs and patterns.

```javascript
// ALLOWED - Current API
const data = JSON.parse(jsonString);

// ALLOWED - Current method
element.textContent = text;

// ALLOWED - Current pattern
const x = 5;
```

---

## CATEGORY 4: CODE QUALITY POLICIES (5 Policies)

### Policy 21: No Console Logs in Production

**Problem:** Developers leave console.log statements in production code, exposing sensitive information and cluttering logs.

**Business Impact:** Console logs expose sensitive information and make it harder to find real errors in logs. Teams have experienced information disclosure due to console logs.

**What it catches:**
- console.log in production code
- console.error in production code
- console.warn in production code
- Debug logging statements

**How it works:** Detects console.log/error/warn statements in production branches. Flags debug logging.

**Enforcement:** MANDATORY for production code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// BLOCKED in production
console.log(userData); // Exposes sensitive data
console.log("API Response:", response);
```

**How to fix:** Use proper logging framework.

```javascript
// ALLOWED - Proper logging
logger.debug("Processing user data");
logger.info("API request completed");
```

---

### Policy 22: No Magic Numbers

**Problem:** Developers use unexplained numbers in code, making it hard to understand what the numbers mean and why they were chosen.

**Business Impact:** Magic numbers make code hard to understand and maintain. Teams have spent hours trying to understand why a specific number was used.

**What it catches:**
- Unexplained numbers in code
- Numbers without context
- Repeated numbers that should be constants

**How it works:** Detects numeric literals that should be named constants. Flags repeated numbers.

**Enforcement:** RECOMMENDED for all code. LOW SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Magic numbers
if (user.age > 18) { } // What does 18 mean?
const timeout = 5000; // Why 5000?
const maxRetries = 3; // Why 3?
```

**How to fix:** Use named constants.

```javascript
// ALLOWED - Named constants
const LEGAL_AGE = 18;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_RETRY_ATTEMPTS = 3;

if (user.age > LEGAL_AGE) { }
```

---

### Policy 23: No Unused Variables

**Problem:** Developers leave unused variables in code, cluttering the codebase and making it harder to understand.

**Business Impact:** Unused variables make code harder to understand. Teams have spent time trying to understand why variables were declared.

**What it catches:**
- Unused variables
- Unused imports
- Unused function parameters
- Unused function declarations

**How it works:** Detects variables that are declared but never used. Flags unused imports.

**Enforcement:** RECOMMENDED for all code. LOW SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Unused variable
const result = fetchData();
const unused = 5;
process();

// BLOCKED - Unused import
import { unusedFunction } from "./utils.js";

// BLOCKED - Unused parameter
function process(data, unused) {
  return data.map(item => item.value);
}
```

**How to fix:** Remove unused code.

```javascript
// ALLOWED
const result = fetchData();
process();

// ALLOWED - Only used imports
import { usedFunction } from "./utils.js";

// ALLOWED - Only used parameters
function process(data) {
  return data.map(item => item.value);
}
```

---

### Policy 24: No Duplicate Code

**Problem:** Developers copy-paste code instead of extracting common logic, leading to code duplication and maintenance issues.

**Business Impact:** Code duplication makes maintenance harder. When a bug is fixed in one place, it needs to be fixed in all duplicates. Teams have experienced bugs due to inconsistent fixes across duplicates.

**What it catches:**
- Identical code blocks
- Similar code blocks that should be extracted
- Repeated patterns

**How it works:** Detects identical or similar code blocks. Flags code that should be extracted into a function.

**Enforcement:** RECOMMENDED for all code. LOW SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Duplicate code
function validateEmail(email) {
  if (!email.includes("@")) return false;
  if (email.length < 5) return false;
  return true;
}

function validateUsername(username) {
  if (!username.includes("@")) return false;
  if (username.length < 5) return false;
  return true;
}
```

**How to fix:** Extract common logic.

```javascript
// ALLOWED
function validateInput(input, minLength = 5) {
  if (!input.includes("@")) return false;
  if (input.length < minLength) return false;
  return true;
}

const validateEmail = (email) => validateInput(email);
const validateUsername = (username) => validateInput(username);
```

---

### Policy 25: No Type Errors

**Problem:** Developers use incorrect types, leading to runtime errors and unexpected behavior.

**Business Impact:** Type errors cause runtime crashes and unexpected behavior. Teams have spent hours debugging type-related issues.

**What it catches:**
- Type mismatches
- Incorrect type usage
- Missing type annotations
- Type casting errors

**How it works:** Uses static type analysis (if using TypeScript). Detects type mismatches and incorrect usage.

**Enforcement:** MANDATORY for TypeScript code. MEDIUM SEVERITY.

**Example violation:**
```typescript
// BLOCKED - Type mismatch
const count: number = "5"; // String assigned to number

// BLOCKED - Incorrect type usage
const items: string[] = [1, 2, 3]; // Numbers in string array

// BLOCKED - Missing type annotation
function process(data) { // No type annotation
  return data.value;
}
```

**How to fix:** Use correct types.

```typescript
// ALLOWED - Correct types
const count: number = 5;

// ALLOWED - Correct array type
const items: number[] = [1, 2, 3];

// ALLOWED - Type annotation
function process(data: { value: string }): string {
  return data.value;
}
```

---

## CATEGORY 5: TESTING POLICIES (3 Policies)

### Policy 26: No Skipped Tests

**Problem:** Developers skip tests (using .skip or .only) to temporarily disable them, but forget to re-enable them, leading to untested code in production.

**Business Impact:** Skipped tests mean untested code ships to production. Teams have experienced bugs due to skipped tests that were never re-enabled.

**What it catches:**
- describe.skip
- it.skip
- test.skip
- xit
- xdescribe
- .only in tests

**How it works:** Detects test skip markers. Flags tests that are skipped or focused.

**Enforcement:** MANDATORY for all test code. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Skipped test
describe.skip("User authentication", () => {
  it("should authenticate valid credentials", () => { });
});

// BLOCKED - Focused test
describe("User authentication", () => {
  it.only("should authenticate valid credentials", () => { });
});
```

**How to fix:** Remove skip markers.

```javascript
// ALLOWED
describe("User authentication", () => {
  it("should authenticate valid credentials", () => { });
});
```

---

### Policy 27: No Empty Test Suites

**Problem:** Developers create test files or test cases without implementation, leading to false sense of test coverage.

**Business Impact:** Empty tests create false sense of coverage. Teams have shipped untested code thinking it was tested.

**What it catches:**
- Empty test cases
- Test cases with no assertions
- Test cases with only comments

**How it works:** Detects test cases without assertions. Flags empty test implementations.

**Enforcement:** MANDATORY for all test code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Empty test
it("should authenticate valid credentials", () => {
  // TODO: implement test
});

// BLOCKED - No assertions
it("should authenticate valid credentials", () => {
  const result = authenticate("user", "pass");
});
```

**How to fix:** Implement tests with assertions.

```javascript
// ALLOWED
it("should authenticate valid credentials", () => {
  const result = authenticate("user", "pass");
  expect(result).toBe(true);
});
```

---

### Policy 28: No Flaky Tests

**Problem:** Developers write tests that pass sometimes and fail sometimes (flaky tests), making it impossible to trust test results.

**Business Impact:** Flaky tests make it impossible to trust test results. Teams have shipped bugs because they assumed flaky test failures were false positives.

**What it catches:**
- Tests with timing dependencies
- Tests with random data
- Tests with external dependencies
- Tests with race conditions

**How it works:** Detects common flaky test patterns (setTimeout, Math.random, external API calls without mocking).

**Enforcement:** MANDATORY for all test code. MEDIUM SEVERITY.

**Example violation:**
```javascript
// BLOCKED - Timing dependency
it("should process data", async () => {
  process();
  setTimeout(() => {
    expect(result).toBe(expected);
  }, 1000);
});

// BLOCKED - Random data
it("should handle data", () => {
  const data = Math.random();
  expect(process(data)).toBe(expected);
});

// BLOCKED - External dependency
it("should fetch data", async () => {
  const data = await fetch("https://api.example.com/data");
  expect(data).toBeDefined();
});
```

**How to fix:** Use proper test patterns.

```javascript
// ALLOWED - Proper async handling
it("should process data", async () => {
  const result = await process();
  expect(result).toBe(expected);
});

// ALLOWED - Fixed data
it("should handle data", () => {
  const data = { value: 5 };
  expect(process(data)).toBe(expected);
});

// ALLOWED - Mocked external dependency
it("should fetch data", async () => {
  const mockData = { value: "test" };
  jest.mock("./api.js", () => ({ fetch: () => mockData }));
  const data = await fetch();
  expect(data).toBe(mockData);
});
```

---

## CATEGORY 6: PERFORMANCE POLICIES (2 Policies)

### Policy 29: No N+1 Query Problems

**Problem:** Developers write code that makes one query per item in a loop, leading to massive performance degradation.

**Business Impact:** N+1 queries can cause database overload and application slowdown. Teams have experienced production outages due to N+1 queries.

**What it catches:**
- Database queries inside loops
- Multiple queries that could be combined
- Inefficient query patterns

**How it works:** Detects database queries inside loops. Flags queries that could be batched.

**Enforcement:** MANDATORY for all database code. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - N+1 query
const users = await User.findAll();
for (const user of users) {
  const posts = await Post.findByUserId(user.id); // Query per user
  user.posts = posts;
}
```

**How to fix:** Use batch queries or joins.

```javascript
// ALLOWED - Batch query
const users = await User.findAll();
const allPosts = await Post.findByUserIds(users.map(u => u.id));
const postsByUser = groupBy(allPosts, "userId");
users.forEach(user => {
  user.posts = postsByUser[user.id] || [];
});

// ALLOWED - Join query
const users = await User.findAll({ include: "posts" });
```

---

### Policy 30: No Memory Leaks in Event Listeners

**Problem:** Developers add event listeners without removing them, causing memory leaks as objects accumulate in memory.

**Business Impact:** Memory leaks cause memory exhaustion and application crashes. Teams have experienced production outages due to memory leaks.

**What it catches:**
- Event listeners added without removal
- Subscriptions without unsubscribe
- Callbacks stored without cleanup
- Missing cleanup in component lifecycle

**How it works:** Detects event listener registration without corresponding removal. Flags subscriptions without unsubscribe.

**Enforcement:** MANDATORY for all event handling. HIGH SEVERITY.

**Example violation:**
```javascript
// BLOCKED - No cleanup
class Component {
  constructor() {
    window.addEventListener("resize", this.handleResize);
  }
}

// BLOCKED - No unsubscribe
const subscription = observable.subscribe(data => {
  process(data);
});

// BLOCKED - No cleanup in React
useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  // Missing cleanup
}, []);
```

**How to fix:** Properly cleanup listeners.

```javascript
// ALLOWED - With cleanup
class Component {
  constructor() {
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener("resize", this.handleResize);
  }
  
  destroy() {
    window.removeEventListener("resize", this.handleResize);
  }
}

// ALLOWED - With unsubscribe
const subscription = observable.subscribe(data => {
  process(data);
});
subscription.unsubscribe();

// ALLOWED - With cleanup in React
useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);
```

---

## Summary Table: All 30 Policies

| # | Policy Name | Category | Severity | Impact | Frequency |
|---|---|---|---|---|---|
| 1 | No Hardcoded Secrets | Security | HIGH | Critical | Very High |
| 2 | No SQL Injection Vulnerabilities | Security | HIGH | Critical | High |
| 3 | No Unvalidated User Input | Security | HIGH | Critical | High |
| 4 | No Unencrypted Sensitive Data | Security | HIGH | Critical | Medium |
| 5 | No Insecure Cryptography | Security | HIGH | Critical | Medium |
| 6 | No Exposed Admin Endpoints | Security | HIGH | Critical | Medium |
| 7 | No Dependency Vulnerabilities | Security | HIGH | Critical | High |
| 8 | No Debug Mode in Production | Security | MEDIUM | High | Medium |
| 9 | Required Test Coverage (Critical Code) | Reliability | HIGH | Critical | Very High |
| 10 | Minimum Test Coverage Threshold | Reliability | MEDIUM | High | High |
| 11 | No Unhandled Promise Rejections | Reliability | HIGH | Critical | Very High |
| 12 | No Null/Undefined Reference Errors | Reliability | HIGH | Critical | Very High |
| 13 | No Infinite Loops or Recursion | Reliability | HIGH | Critical | Medium |
| 14 | No Resource Leaks | Reliability | HIGH | Critical | High |
| 15 | No Circular Dependencies | Architecture | MEDIUM | High | Medium |
| 16 | No Cross-Layer Imports | Architecture | MEDIUM | High | Medium |
| 17 | No God Objects | Architecture | LOW | Medium | Low |
| 18 | No Hardcoded Configuration | Architecture | MEDIUM | High | High |
| 19 | No Monolithic Functions | Architecture | LOW | Medium | Low |
| 20 | No Deprecated APIs | Architecture | MEDIUM | High | Medium |
| 21 | No Console Logs in Production | Quality | MEDIUM | Medium | High |
| 22 | No Magic Numbers | Quality | LOW | Low | Medium |
| 23 | No Unused Variables | Quality | LOW | Low | Medium |
| 24 | No Duplicate Code | Quality | LOW | Medium | Medium |
| 25 | No Type Errors | Quality | MEDIUM | High | High |
| 26 | No Skipped Tests | Testing | HIGH | Critical | High |
| 27 | No Empty Test Suites | Testing | MEDIUM | High | Medium |
| 28 | No Flaky Tests | Testing | MEDIUM | High | Medium |
| 29 | No N+1 Query Problems | Performance | HIGH | Critical | High |
| 30 | No Memory Leaks in Event Listeners | Performance | HIGH | Critical | Medium |

---

## Implementation Recommendations

### Enforcement Strategy

**Phase 1 (Week 1-2): OBSERVE Mode**
Deploy all 30 policies in OBSERVE mode. Let developers see violations without blocking. This establishes baseline and helps teams understand the policies.

**Phase 2 (Week 3-4): WARN Mode**
Move critical policies (1-7, 9, 11-14, 26, 29-30) to WARN mode. Developers see warnings but can still merge if needed.

**Phase 3 (Week 5-6): ENFORCE Mode**
Move critical policies to ENFORCE mode. PRs cannot merge without fixing violations. Move medium-severity policies to WARN mode.

**Phase 4 (Week 7+): Full Enforcement**
All policies in appropriate enforcement levels. Continuous monitoring and adjustment based on team feedback.

### Customization by Team Size

**For teams 50-100 engineers:**
Start with all 30 policies in OBSERVE mode. Move to WARN/ENFORCE gradually based on team readiness.

**For teams 100-200 engineers:**
Start with critical policies (1-14, 26, 29-30) in WARN mode. Move others to OBSERVE. Enforce based on team maturity.

### Expected Violations

Based on typical team behavior:
- **Security policies (1-8):** 5-10% of PRs violate
- **Reliability policies (9-14):** 15-25% of PRs violate
- **Architecture policies (15-20):** 10-20% of PRs violate
- **Quality policies (21-25):** 20-30% of PRs violate
- **Testing policies (26-28):** 10-15% of PRs violate
- **Performance policies (29-30):** 5-10% of PRs violate

### Expected Impact

After 30 days of enforcement:
- **50% reduction** in security-related bugs
- **40% reduction** in production incidents
- **30% reduction** in code review time
- **25% improvement** in test coverage
- **20% improvement** in deployment frequency

---

## Conclusion

These 30 core policies address the most common violations that cause production bugs, technical debt, and team frustration. They are designed for teams of 50-200 engineers and can be customized based on team maturity and specific needs.

The key to successful policy adoption is gradual enforcement (OBSERVE → WARN → ENFORCE) and clear communication about why each policy matters. Teams that understand the value of policies are more likely to adopt them willingly.

