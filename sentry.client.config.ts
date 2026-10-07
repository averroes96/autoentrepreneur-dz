import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Replay on errors
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Environment tagging
  environment: process.env.NODE_ENV,
});
