import * as z from "zod";

const createEnv = () => {
    const EnvSchema = z.object({
        API_URL: z.string(),
        ENABLE_API_MOCKING: z
            .string()
            .refine((s) => s === "true" || s === "false")
            .transform((s) => s === "true")
            .optional(),
        APP_URL: z.string().optional().default("http://localhost:3000"),
        APP_MOCK_API_PORT: z.string().optional().default("8080"),
        SENTRY_DSN: z.string().optional(),
        SENTRY_ENVIRONMENT: z.string().optional().default("development"),
        SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().optional().default(1.0),
        SENTRY_ERRORS_SAMPLE_RATE: z.coerce.number().optional().default(1.0),
        YANDEX_METRIKA_ID: z.string().optional(),
    });

    const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>((acc, curr) => {
        const [key, value] = curr;
        if (key.startsWith("VITE_APP_")) {
            acc[key.replace("VITE_APP_", "")] = value;
        }
        return acc;
    }, {});

    // Runtime-конфиг (config.js, инъектируется в рантайме) имеет приоритет:
    // позволяет менять API_URL/Sentry-параметры на сервере БЕЗ пересборки образа.
    const runtimeConfig =
        typeof window !== "undefined" && window.__APP_CONFIG__
            ? Object.fromEntries(
                  Object.entries(window.__APP_CONFIG__).filter(([key]) => {
                      return key !== "" && import.meta.env[`VITE_APP_${key}`] !== undefined;
                  }),
              )
            : {};

    Object.assign(envVars, runtimeConfig);

    const parsedEnv = EnvSchema.safeParse(envVars);

    if (!parsedEnv.success) {
        throw new Error(
            `Invalid env provided.
            The following variables are missing or invalid:
            ${Object.entries(parsedEnv.error.flatten().fieldErrors)
                .map(([k, v]) => `- ${k}: ${v}`)
                .join("\n")}
            `,
        );
    }

    return parsedEnv.data;
};

export const env = createEnv();
