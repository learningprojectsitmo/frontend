import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as SonnerToaster } from "sonner";

import { MainErrorFallback } from "@/components/errors/main";
import { Notifications } from "@/components/ui/notifications";
import { LanguageSync } from "@/lib/language-sync";
import { queryConfig } from "@/lib/react-query";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ThemeProvider, useTheme } from "@/lib/theme-provider";
import { ImagePromptProvider } from "@/components/image-prompt";
import { CookieConsentProvider } from "@/features/privacy/cookie-consent-provider";
import { HolidayDecor } from "@/features/decorations";

import "@/i18n/config";

type AppProviderProps = {
    children: React.ReactNode;
};

/**
 * Контейнер уведомлений на sonner.
 *
 * Без него `toast.*` из 18 файлов (133 вызова) не отрисовывается вообще:
 * sonner хранит очередь в своём Toaster, и без смонтированного Toaster вызов
 * молча ничего не делает. Из-за этого любая ошибка сохранения выглядела как
 * «кнопка ничего не делает».
 *
 * Позиция bottom-right — кастомные `Notifications` уже занимают правый
 * верхний угол, чтобы стеки не накладывались.
 */
const AppToaster = () => {
    const { theme } = useTheme();

    return (
        <SonnerToaster
            theme={theme === "dark" ? "dark" : "light"}
            position="bottom-right"
            richColors
            closeButton
        />
    );
};

const AppProvider = ({ children }: AppProviderProps) => {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: queryConfig,
            }),
    );

    return (
        <React.Suspense
            fallback={
                <div className="flex h-screen w-screen items-center justify-center">
                    <Spinner />
                </div>
            }
        >
            <ErrorBoundary FallbackComponent={MainErrorFallback}>
                <HelmetProvider>
                    <CookieConsentProvider>
                        <QueryClientProvider client={queryClient}>
                            {import.meta.env.DEV && <ReactQueryDevtools />}
                            <LanguageSync />
                            <ThemeProvider>
                                {children}
                                {/* Внутри ThemeProvider: AppToaster читает тему. */}
                                <AppToaster />
                            </ThemeProvider>
                            <Notifications />
                            <ImagePromptProvider />
                            {/* Глобальный декор: рендерится только при включённом
                                флаге из админ-панели, поэтому в обычном виде
                                это пустой фрагмент. */}
                            <HolidayDecor />
                        </QueryClientProvider>
                    </CookieConsentProvider>
                </HelmetProvider>
            </ErrorBoundary>
        </React.Suspense>
    );
};

export default AppProvider;
