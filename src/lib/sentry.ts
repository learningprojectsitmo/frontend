import * as Sentry from "@sentry/react";

import { env } from "@/config/env";

export function setupSentry() {
    if (!env.SENTRY_DSN) return;

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        tracesSampleRate: 1.0,
    });
}
