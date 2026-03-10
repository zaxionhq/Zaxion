import * as Sentry from "@sentry/react";

// Initialize Sentry
export const initMonitoring = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    const integrations = [];
    
    // Browser Tracing
    if (typeof Sentry.browserTracingIntegration === 'function') {
        integrations.push(Sentry.browserTracingIntegration());
    } else {
        // Fallback for older versions if needed, but we expect v8+
        // integrations.push(new Sentry.BrowserTracing());
    }

    if (typeof Sentry.replayIntegration === 'function') {
        integrations.push(Sentry.replayIntegration());
    }

    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations,
      tracesSampleRate: 1.0, // Adjust this in production
      replaysSessionSampleRate: 0.1, 
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
    });
    console.log("Monitoring initialized");
  } else {
    console.log("Monitoring skipped: No DSN provided");
  }
};

// Track Error
export const trackError = (error: Error, context?: Record<string, any>) => {
  console.error("Tracked Error:", error, context);
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

// Track Performance Metric
export const trackMetric = (name: string, value: number, tags?: Record<string, string>) => {
  // In a real app, send to Datadog/New Relic
  console.log(`[Metric] ${name}: ${value}`, tags);
  
  // Example: Send to custom analytics endpoint
  // api.post('/analytics/metrics', { name, value, tags });
};

// Web Vitals Reporter
export const reportWebVitals = (metric: unknown) => {
  console.log(metric);
  // Send to analytics
};
