import * as Sentry from "@sentry/nextjs";

/**
 * Capture an exception to Sentry with contextual metadata.
 * Gracefully logs to console in development if Sentry DSN is not configured.
 */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("[Sentry Dev / Local]", error, context);
  }
}

/**
 * Record a custom monitoring event or audit message.
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
}

export { Sentry };
