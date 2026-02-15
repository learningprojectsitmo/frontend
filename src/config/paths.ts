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
        registerContacts: {
            path: "/auth/registercontacts",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/registercontacts${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        login: {
            path: "/auth/login",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        resetEmail: {
            path: "/auth/resetemail",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/resetemail${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        resetPassword: {
            path: "/auth/resetpassword",
            getHref: () => "/auth/resetpassword",
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
