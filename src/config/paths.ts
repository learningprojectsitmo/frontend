export const paths = {
    home: {
        path: "/",
        getHref: () => "/",
    },

    auth: {
        register: {
            path: "/auth/register",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        login: {
            path: "/auth/login",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        reset: {
            path: "/auth/reset",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/reset${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
    },

    app: {
        root: {
            path: "/app",
            getHref: () => "/app",
        },
        spaces: {
            path: "",
            getHref: () => "/app",
        },
    },
} as const;
