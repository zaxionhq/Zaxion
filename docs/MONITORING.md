# Monitoring and Performance Dashboard Setup

## Overview
Zaxion uses a dual-layer monitoring strategy:
1. **Application Performance Monitoring (APM):** Sentry (Error tracking + Tracing)
2. **Infrastructure & Business Metrics:** Prometheus (Metrics) + Grafana (Dashboards)

## 1. Error Tracking (Sentry)

### Setup
1. Create a Sentry project for Backend (Node.js) and Frontend (React).
2. Get the DSN for each.
3. Set environment variables:
   - Backend: `SENTRY_DSN=https://...@sentry.io/...`
   - Frontend: `VITE_SENTRY_DSN=https://...@sentry.io/...`

### Dashboard Configuration
- **Issues:** View real-time errors with stack traces.
- **Performance:** Enable "Performance" tab to see transaction traces.
- **Alerts:** Set up alerts for:
  - New issues
  - High error rate (> 1%)
  - Slow transactions (> 2s for Login, > 3s for Governance)

## 2. Metrics (Prometheus + Grafana)

The backend exposes metrics at `/metrics`.

### Key Metrics to Track
| Metric Name | Description | Alert Threshold |
|---|---|---|
| `http_requests_total` | Total request count by status/route | Rate > 0 |
| `http_request_duration_seconds` | Latency histogram | p95 > 2s |
| `ai_service_calls_total` | AI usage stats | - |
| `github_service_calls_total` | GitHub API usage | - |

### Grafana Dashboard Panel Examples

#### A. API Latency (p95)
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

#### B. Error Rate (%)
```promql
sum(rate(http_requests_total{status_code=~"5.*"}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

#### C. Login Performance
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route="/api/v1/auth/login"}[5m])) by (le))
```

## 3. Frontend Performance (Web Vitals)

Integrate Vercel Analytics or use Sentry's Web Vitals tracking.

**Targets:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

## Deployment
1. Ensure `SENTRY_DSN` is set in your CI/CD pipeline.
2. Configure Prometheus to scrape `https://api.zaxion.dev/metrics`.
