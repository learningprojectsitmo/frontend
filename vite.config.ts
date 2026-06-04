/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

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
        alias: {
            "@": path.resolve(__dirname, "./src"),
            msw: path.resolve(__dirname, "./node_modules/msw/lib/core/index.js"),
        },
    },
    server: {
        port: 3000,
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
    optimizeDeps: { exclude: ["fsevents"] },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            external: ["fs/promises"],
            output: {
                experimentalMinChunkSize: 50000,
                manualChunks(id: string) {
                    if (id.includes("node_modules")) {
                        if (
                            id.includes("react") ||
                            id.includes("react-router") ||
                            id.includes("react-dom")
                        ) {
                            return "vendor-react";
                        }
                        if (id.includes("@tanstack/react-query")) {
                            return "vendor-query";
                        }
                        if (id.includes("framer-motion")) {
                            return "vendor-animation";
                        }
                        if (id.includes("lucide-react")) {
                            return "vendor-icons";
                        }
                        if (id.includes("react-hook-form") || id.includes("@hookform/resolvers")) {
                            return "vendor-forms";
                        }
                        if (id.includes("@radix-ui/")) {
                            return "vendor-radix";
                        }
                        if (id.includes("@dnd-kit/")) {
                            return "vendor-dnd";
                        }
                        if (
                            id.includes("sonner") ||
                            id.includes("react-helmet-async") ||
                            id.includes("react-error-boundary")
                        ) {
                            return "vendor-ui";
                        }
                        if (
                            id.includes("axios") ||
                            id.includes("zustand") ||
                            id.includes("zod") ||
                            id.includes("dayjs") ||
                            id.includes("clsx") ||
                            id.includes("camelcase-keys") ||
                            id.includes("tailwind-merge") ||
                            id.includes("class-variance-authority") ||
                            id.includes("nanoid")
                        ) {
                            return "vendor-utils";
                        }
                    }
                },
            },
        },
    },
});
