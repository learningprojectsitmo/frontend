import * as Sentry from "@sentry/react";

import { env } from "@/config/env";

let isInitialized = false;

export function setupSentry() {
    if (isInitialized || !env.SENTRY_DSN) return;

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        sampleRate: env.SENTRY_ERRORS_SAMPLE_RATE,
        tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
        autoSessionTracking: false,
        sendDefaultPii: true,
    });
    isInitialized = true;
}

export function disableSentry(): void {
    Sentry.getClient()?.close();
    isInitialized = false;
}
