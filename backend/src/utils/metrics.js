import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

// Register default metrics (Node.js process metrics)
register.setDefaultLabels({ app: 'github-testcase-generator-backend' });

// Custom Metrics

// HTTP Request Counter
const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// HTTP Request Duration Histogram
const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDurationSeconds);

// AI Service Call Counter
const aiServiceCallCounter = new Counter({
  name: 'ai_service_calls_total',
  help: 'Total number of AI service calls',
  labelNames: ['service', 'operation', 'status'],
});
register.registerMetric(aiServiceCallCounter);

// GitHub Service Call Counter
const githubServiceCallCounter = new Counter({
  name: 'github_service_calls_total',
  help: 'Total number of GitHub service calls',
  labelNames: ['operation', 'status'],
});
register.registerMetric(githubServiceCallCounter);

// Test Runner Execution Counter
const testRunnerExecutionCounter = new Counter({
  name: 'test_runner_executions_total',
  help: 'Total number of test runner executions',
  labelNames: ['language', 'status'],
});
register.registerMetric(testRunnerExecutionCounter);

export { register, httpRequestCounter, httpRequestDurationSeconds, aiServiceCallCounter, githubServiceCallCounter, testRunnerExecutionCounter };
