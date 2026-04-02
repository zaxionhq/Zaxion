import * as Sentry from "@sentry/node";
import { log, error } from './logger.js';

export const initMonitoring = (app) => {
  if (process.env.SENTRY_DSN) {
    const integrations = [];

    // Http Integration
    if (typeof Sentry.httpIntegration === 'function') {
      integrations.push(Sentry.httpIntegration());
    } else if (Sentry.Integrations && Sentry.Integrations.Http) {
      integrations.push(new Sentry.Integrations.Http({ tracing: true }));
    }

    // Express Integration
    if (typeof Sentry.expressIntegration === 'function') {
      integrations.push(Sentry.expressIntegration({ app }));
    } else if (Sentry.Integrations && Sentry.Integrations.Express) {
      integrations.push(new Sentry.Integrations.Express({ app }));
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());

    log("Monitoring initialized (Sentry)");
  } else {
    log("Monitoring skipped: No DSN provided");
  }
};

export const monitoringErrorHandler = () => {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.errorHandler();
  }
  return (req, res, next) => next();
};

export const captureException = (err, context) => {
  error("Captured Exception:", err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, { extra: context });
  }
};
