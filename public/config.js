// Заглушка — реальные значения перезаписываются на сервере в entrypoint-скрипте
// (deploy-репо, edge-контейнер). Этот файл — просто дефолт, чтобы dev-режим работал.
window.__APP_CONFIG__ = {
    API_URL: "/v1",
    APP_URL: "http://localhost:3000",
    ENABLE_API_MOCKING: "true",
    APP_MOCK_API_PORT: "8080",
    YANDEX_METRIKA_ID: "",
};
