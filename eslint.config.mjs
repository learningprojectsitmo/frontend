// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";
import prettier from "eslint-config-prettier";

export default [
    // Игнор
    {
        ignores: [
            "dist",
            "build",
            "coverage",
            "node_modules",
            ".vite/",
            "*.config.*",
            ".eslintrc.*",
            "*.md",
            "*.tsbuildinfo",
        ],
    },

    // База
    js.configs.recommended,

    // TypeScript (БЕЗ type-aware)
    ...tseslint.configs.recommended,

    // React + TS
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "react-x": reactX,
            "react-dom": reactDom,
        },
        rules: {
            // Hooks
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // Vite HMR
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

            // React 19
            "react/react-in-jsx-scope": "off",

            // TS
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",

            // Прод
            "no-console": "warn",
        },
    },

    prettier,
];
