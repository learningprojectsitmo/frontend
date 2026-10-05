/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createRequire } from "node:module";
import path from "path";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

const require = createRequire(import.meta.url);

/**
 * `react-i18next` импортирует `use-sync-external-store/shim` — то есть
 * директорию. В закреплённом `use-sync-external-store@1.2.2` нет поля
 * `exports`, поэтому нативный ESM-резолвер Node такой импорт не понимает
 * («Directory import … is not supported»), а Vite-бандлер справляется.
 * Именно нативный резолвер использует Vitest, поэтому тесты, импортирующие
 * `react-i18next`, падали на импорте. Алиас указывает на тот же файл, что
 * достался бы бандлеру.
 *
 * Путь резолвим от `react-i18next`, а не руками: при `npm install` пакет
 * лежит то рядом с ним, то в корне `node_modules`, и хардкод пути сломал бы
 * тесты после переустановки зависимостей.
 */
const useSyncExternalStoreShim = require.resolve("use-sync-external-store/shim", {
    paths: [path.dirname(require.resolve("react-i18next/package.json"))],
});

export const enableMocking = async () => {
    if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_MOCK !== "true") {
        return;
    }
    // ...
};

// https://vite.dev/config/
export default defineConfig({
    base: "./",
    plugins: [react(), viteTsconfigPaths(), svgr()],
    resolve: {
        alias: [
            {
                find: "@",
                replacement: path.resolve(__dirname, "./src"),
            },
            {
                find: /^msw$/,
                replacement: path.resolve(__dirname, "./node_modules/msw/lib/core/index.js"),
            },
            // Точный матч, чтобы `shim/with-selector` (если появится) не
            // переписывался на `shim/index.js`.
            { find: /^use-sync-external-store\/shim$/, replacement: useSyncExternalStoreShim },
        ],
    },
    server: {
        port: 3000,
        proxy: {
            "/v1": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
            "/api": {
                target: "http://localhost:9090",
                changeOrigin: true,
            },
        },
        allowedHosts: [
            "test.1855789-cn23133.twc1.net",
            "fpin-projects.ru",
            "localhost",
            "localhost:8000",
            "127.0.0.1",
            "fpin-projects.ru:1268",
        ],
    },
    preview: {
        port: 3000,
    },
    test: {
        passWithNoTests: true,
        // Алиас выше не применяется к внешним (не обработанным Vite)
        // зависимостям: их резолвит Node. `react-i18next` должен попасть в
        // конвейер Vite, иначе импорт shim снова упадёт.
        server: { deps: { inline: ["react-i18next"] } },
    },
    optimizeDeps: { exclude: ["fsevents"] },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            external: ["fs/promises"],
        },
    },
});
