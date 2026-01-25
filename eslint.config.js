import js from "@eslint/js";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tailwindPlugin from "eslint-plugin-tailwindcss";
import importPlugin from "eslint-plugin-import";

export default [
    // Ignore patterns
    {
        ignores: [
            "dist/",
            "node_modules/",
            "coverage/",
            "build/",
            ".vite/",
            "*.config.*",
            "*.md",
            "**/__tests__/**",
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/*.spec.ts",
            "**/*.spec.tsx",
        ],
    },

    // Base JavaScript rules
    js.configs.recommended,

    // TypeScript rules
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            "@typescript-eslint": tseslintPlugin,
            import: importPlugin,
        },
        languageOptions: {
            parser: tseslintParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                localStorage: "readonly",
                console: "readonly",
                URLSearchParams: "readonly",
                // React
                React: "readonly",
                // DOM types (for TypeScript JSDoc)
                HTMLDivElement: "readonly",
                HTMLButtonElement: "readonly",
                HTMLInputElement: "readonly",
                HTMLParagraphElement: "readonly",
                HTMLHeadingElement: "readonly",
            },
        },
        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },
        rules: {
            ...tseslintPlugin.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
        },
    },

    // React rules
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            ...reactHooksPlugin.configs.recommended.rules,
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
        },
    },

    // Tailwind CSS rules (only essential, no stylistic rules)
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            tailwindcss: tailwindPlugin,
        },
        rules: {
            // Only enforce important rules, disable stylistic ones
            "tailwindcss/classnames-order": "off",
            "tailwindcss/enforces-shorthand": "off",
            "tailwindcss/migration-from-tailwind-2": "off",
            "tailwindcss/no-custom-classname": "off",
        },
    },
];
