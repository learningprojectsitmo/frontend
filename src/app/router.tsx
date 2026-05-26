import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { LoaderFunction, ActionFunction } from "react-router";

import { paths } from "@/config/paths";

import { Spinner } from "@/components/ui/spinner/spinner";

type LazyModule = {
    clientLoader?: (client: QueryClient) => LoaderFunction;
    clientAction?: (client: QueryClient) => ActionFunction;
    default: React.ComponentType<unknown>;
    [key: string]: unknown;
};

const convert = (queryClient: QueryClient) => (m: LazyModule) => {
    const { clientLoader, clientAction, default: Component, ...rest } = m;
    return {
        ...rest,
        loader: clientLoader?.(queryClient),
        action: clientAction?.(queryClient),
        Component,
    };
};

// Компонент для отображения во время загрузки
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
    </div>
);

export const createAppRouter = (queryClient: QueryClient) =>
    createBrowserRouter([
        {
            path: paths.home.path,
            lazy: () => import("./routes/landing").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.auth.createAcc.path,
            lazy: () => import("./routes/auth/create-acc").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.auth.registerConfirm.path,
            lazy: () => import("./routes/auth/register-confirm").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.auth.registerContacts.path,
            lazy: () => import("./routes/auth/register-contacts").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.auth.login.path,
            lazy: () => import("./routes/auth/login").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.auth.resetPassword.path,
            lazy: () => import("./routes/auth/reset-password").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.auth.resetEmail.path,
            lazy: () => import("./routes/auth/reset-email").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
        {
            path: paths.landing.path,
            lazy: () => import("./routes/landing").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />,
        },
        {
            path: paths.app.root.path,
            lazy: () => import("./routes/app/root").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />,
            children: [
                {
                    path: paths.app.spaces.path,
                    lazy: () => import("./routes/app/spaces").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />, // Добавить
                },
                {
                    path: paths.app.kanban.path,
                    lazy: () => import("./routes/app/kanban").then(convert(queryClient)),
                },
                {
                    path: paths.app.space.path,
                    lazy: () => import("./routes/app/space").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />, // Добавить
                },
                {
                    path: paths.app.project.path,
                    lazy: () => import("./routes/app/project").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />, // Добавить
                },
                {
                    path: paths.app.profile.path,
                    lazy: () => import("./routes/app/profile").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />,
                },
                {
                    path: paths.app.resume.path,
                    lazy: () => import("./routes/app/resume").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />,
                },
                {
                    path: paths.app.ideas.path,
                    lazy: () => import("./routes/app/ideas").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />,
                },
                {
                    path: paths.app.ideas.detail.path,
                    lazy: () => import("./routes/app/ideas.$id").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />,
                },
                {
                    path: paths.app.settings.roles.path,
                    lazy: () => import("./routes/app/settings/roles").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />, // Добавить
                },
            ],
        },
        {
            path: paths.join.path,
            lazy: () => import("./routes/join").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />,
        },
        {
            path: "*",
            lazy: () => import("./routes/not-found").then(convert(queryClient)),
            hydrateFallbackElement: <LoadingFallback />, // Добавить
        },
    ]);

export const AppRouter = () => {
    const queryClient = useQueryClient();

    const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

    return <RouterProvider router={router} />;
};
