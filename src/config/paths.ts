export const paths = {
    home: {
        path: "/",
        getHref: () => "/",
    },
    landing: {
        path: "/landing",
        getHref: () => "/landing",
    },

    auth: {
        createAcc: {
            path: "/auth/createacc",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/createacc${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        registerConfirm: {
            path: "/auth/registerconfirm",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/registerconfirm${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        registerName: {
            path: "/auth/registername",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/registername${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
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

    join: {
        path: "/join",
        getHref: (token: string) => `/join?token=${encodeURIComponent(token)}`,
    },

    app: {
        root: {
            path: "/app",
            getHref: () => "/app",
        },
        spaces: {
            path: "/app",
            getHref: () => "/app",
        },
        space: {
            path: "/app/space",
            getHref: (id: number) => `/app/space?id=${encodeURIComponent(id)}`,
        },
        spaceSettings: {
            path: "/app/space/settings",
            getHref: (id: number) => `/app/space/settings?id=${encodeURIComponent(id)}`,
        },
        project: {
            path: "/app/project",
            getHref: (id: number) => `/app/project?id=${encodeURIComponent(id)}`,
        },
        settings: {
            root: {
                path: "/app/settings",
                getHref: () => "/app/settings",
            },
        },
        admin: {
            root: {
                path: "/app/admin",
                getHref: () => "/app/admin",
            },
            users: {
                path: "/app/admin/users",
                getHref: () => "/app/admin/users",
            },
            roles: {
                path: "/app/admin/roles",
                getHref: () => "/app/admin/roles",
            },
            ideas: {
                path: "/app/admin/ideas",
                getHref: () => "/app/admin/ideas",
            },
            audit: {
                path: "/app/admin/audit",
                getHref: () => "/app/admin/audit",
            },
            sessions: {
                path: "/app/admin/sessions",
                getHref: () => "/app/admin/sessions",
            },
        },
        profile: {
            path: "/app/profile",
            getHref: () => "/app/profile",
        },
        ideas: {
            path: "/app/ideas",
            getHref: () => "/app/ideas",
            detail: {
                path: "ideas/:id",
                getHref: (id: number) => `/app/ideas/${id}`,
            },
        },
        kanban: {
            path: "kanban/:spaceId",
            getHref: (spaceId: string | number) => `/app/kanban/${spaceId}`,
        },
        resume: {
            path: "/app/resume",
            getHref: (id: number, projectId?: number | null, workspaceId?: number | null) =>
                `/app/resume?id=${id}${projectId ? `&projectId=${projectId}` : ""}${workspaceId ? `&workspaceId=${workspaceId}` : ""}`,
            create: {
                path: "/app/resume",
                getHref: () => "/app/resume",
            },
        },
    },
} as const;
