import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { LoaderFunction, ActionFunction } from "react-router";

import { paths } from "@/config/paths";
import { ProtectedRoute } from "@/lib/auth";

import { default as AppRoot, ErrorBoundary as AppRootErrorBoundary } from "./routes/app/root";
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
            path: paths.app.root.path,
            element: (
                <ProtectedRoute>
                    <AppRoot />
                </ProtectedRoute>
            ),
            ErrorBoundary: AppRootErrorBoundary,
            hydrateFallbackElement: <LoadingFallback />, // Добавить
            children: [
                {
                    path: paths.app.spaces.path,
                    lazy: () => import("./routes/app/spaces").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />, // Добавить
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
                    path: paths.app.settings.roles.path,
                    lazy: () => import("./routes/app/settings/roles").then(convert(queryClient)),
                    hydrateFallbackElement: <LoadingFallback />, // Добавить
                },
            ],
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
