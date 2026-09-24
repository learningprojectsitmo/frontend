/// <reference types="vite/client" />
declare module "*.svg?react" {
    import * as React from "react";
    const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}

// ── Runtime-конфиг (config.js, инъектируется на сервере в рантайме) ──
// Используется в src/config/env.ts. Значения задаются на сервере в /usr/share/nginx/html/config.js
// и имеют приоритет над build-time (import.meta.env) — менять можно БЕЗ пересборки образа.
interface AppConfig {
    API_URL?: string;
    APP_URL?: string;
    ENABLE_API_MOCKING?: string;
    APP_MOCK_API_PORT?: string;
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;
    SENTRY_TRACES_SAMPLE_RATE?: string;
    SENTRY_ERRORS_SAMPLE_RATE?: string;
}

interface Window {
    __APP_CONFIG__?: AppConfig;
}
