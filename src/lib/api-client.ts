import Axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";

let _sessionExpired = false;

export const isSessionExpired = (): boolean => _sessionExpired;
export const clearSessionExpired = (): void => {
    _sessionExpired = false;
};

// ─── In-memory token store ────────────────────────────────────────────────

let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;
export const setAccessToken = (token: string | null): void => {
    accessToken = token;
};
export const clearAccessToken = (): void => {
    accessToken = null;
};

// ─── Refresh single-flight ───────────────────────────────────────────────
//
// Refresh-cookie ротируется на каждом вызове, а бэкенд при повторном
// использовании старого токена отзывает ВСЁ семейство сессии
// (`auth_service.refresh_access_token` → reuse detection). Поэтому refresh
// должен вызываться:
//   * строго один раз на все параллельные 401 (`refreshPromise`, а не флаг),
//   * не чаще, чем раз в REFRESH_COOLDOWN_MS — иначе React Query с
//     `refetchOnWindowFocus` и перемонтированием компонентов выбивает новую
//     волну 401, а та уходит в refresh до того, как браузер успеет записать
//     новую cookie, и семейство сессии умирает.

let refreshPromise: Promise<string> | null = null;
let lastRefreshAt = 0;
const REFRESH_COOLDOWN_MS = 5_000;

/**
 * Эндпоинты, где 401 — это ожидаемый ответ, а не протухший access-токен.
 * Для них refresh бессмысленен: он либо ничего не даёт, либо (на `/auth/logout`)
 * обнуляет куку, которую кто-то ещё пробует использовать.
 *
 * `/auth/me` в список НЕ входит: для залогиненного пользователя с истёкшим
 * токеном это единственный запрос, который поднимает сессию обратно.
 */
const REFRESH_EXEMPT_PATHS = [
    "/auth/login",
    "/auth/token",
    "/auth/refresh",
    "/auth/logout",
    "/auth/password-reset",
];

const isRefreshExempt = (url: string | undefined): boolean => {
    if (!url) return false;
    const path = url.split("?")[0] ?? "";
    if (REFRESH_EXEMPT_PATHS.some((p) => path.includes(p))) return true;
    // Регистрация: отдельный префикс роутера, 401 там означает «код неверный».
    return path.includes("/signup");
};

type RetriableRequest = InternalAxiosRequestConfig & {
    /** Токен, который реально ушёл в запрос, — нужен, чтобы отличить
     * «протухший токен» от «токен обновился, пока запрос летел». */
    _authToken?: string | null;
    _retry?: boolean;
};

const refreshAccessToken = async (): Promise<string> => {
    if (refreshPromise) return refreshPromise;

    const pending = (async () => {
        // Отмечаем попытку, а не только успех: при отказе refresh (например,
        // после отзыва семейства сессии) cooldown всё равно должен остановить
        // волну повторных попыток от остальных запросов.
        lastRefreshAt = Date.now();

        const { access_token } = await refreshApi.post<{ access_token: string }>("/auth/refresh");
        if (!access_token) {
            throw new Error("Refresh-ответ не содержит access_token");
        }
        setAccessToken(access_token);
        return access_token;
    })();

    refreshPromise = pending;

    // Обнуляем строго после завершения: пока промис висит, все параллельные
    // 401 получают один и тот же refresh вместо того, чтобы выбить новый.
    pending
        .finally(() => {
            if (refreshPromise === pending) refreshPromise = null;
        })
        .catch(() => undefined);

    return pending;
};

// ─── Axios instance ───────────────────────────────────────────────────────

function authRequestInterceptor(config: RetriableRequest) {
    const token = accessToken;
    config._authToken = token;
    if (config.headers) {
        config.headers.Accept = "application/json";
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    config.withCredentials = true;
    return config;
}

/**
 * Ответ перехватчика — это `response.data`, а не `AxiosResponse`, поэтому
 * сигнатуры методов возвращают сам payload. Иначе каждый вызов в приложении
 * требовал бы каста, а `await api.get<T>()` типизировался бы как `AxiosResponse<T>`
 * и ломал вывод типов в хуках.
 */
export type ApiClient = {
    interceptors: AxiosInstance["interceptors"];
    defaults: AxiosInstance["defaults"];
    <T = unknown>(config: AxiosRequestConfig): Promise<T>;
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

const axiosInstance = Axios.create({
    baseURL: env.API_URL,
    // Axios по умолчанию сериализует массивы как `key[]=v1&key[]=v2`, а FastAPI
    // такие ключи молча игнорирует (list-параметр остаётся None) — фильтр
    // «проигрывается» без всякой ошибки. `indexes: null` даёт повторяющиеся
    // ключи `key=v1&key=v2`, которые парсер читает. Пустые массивы отбрасываются.
    paramsSerializer: { indexes: null },
});

export const api = axiosInstance as unknown as ApiClient;

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
    (response) => response.data,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequest | undefined;

        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Здесь 401 — часть контракта эндпоинта, обновлять токен нельзя.
        if (isRefreshExempt(originalRequest.url)) {
            return Promise.reject(error);
        }

        // Запрос уже переигрывали с обновлённым токеном и всё равно 401 —
        // значит токен не просто протух, а отозван. Помечаем сессию истёкшей,
        // чтобы UI ушёл на вход, иначе приложение остаётся с мёртвым токеном.
        if (originalRequest._retry) {
            if (accessToken) {
                _sessionExpired = true;
            }
            return Promise.reject(error);
        }

        const hadToken = !!accessToken;

        originalRequest._retry = true;

        const retryWith = async (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return await axiosInstance(originalRequest);
        };

        // 1. Токен обновился, пока запрос летел со старым Authorization.
        //    Refresh не нужен — просто переигрываем запрос с актуальным.
        if (accessToken && accessToken !== originalRequest._authToken) {
            return await retryWith(accessToken);
        }

        // 2. Refresh уже идёт — присоединяемся к нему. Проверять cooldown
        //    здесь нельзя: `lastRefreshAt` выставляется в начале попытки,
        //    и второй параллельный 401 отсёкся бы наглухо вместо повторного
        //    запроса с уже обновлённым токеном.
        if (refreshPromise) {
            try {
                return await retryWith(await refreshPromise);
            } catch (refreshError) {
                clearAccessToken();
                if (hadToken) {
                    _sessionExpired = true;
                }
                return Promise.reject(refreshError);
            }
        }

        // 3. Refresh только что прошёл и не помог — 401 настоящий (токен отозван,
        //    пользователь деактивирован). Ещё одна попытка лишь ускорит отзыв
        //    семейства сессии, поэтому просто отдаём ошибку.
        if (lastRefreshAt && Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) {
            if (hadToken) {
                _sessionExpired = true;
            }
            return Promise.reject(error);
        }

        // 4. Свой refresh — он же выставит cooldown для следующей волны 401.
        try {
            return await retryWith(await refreshAccessToken());
        } catch (refreshError) {
            clearAccessToken();
            if (hadToken) {
                _sessionExpired = true;
            }
            return Promise.reject(refreshError);
        }
    },
);

// ─── Separate instance for refresh (avoids interceptor loops) ─────────────

const refreshApi = Axios.create({
    baseURL: env.API_URL,
}) as unknown as ApiClient;

refreshApi.interceptors.request.use((config) => {
    config.withCredentials = true;
    return config;
});

refreshApi.interceptors.response.use((response) => response.data);

// ─── User-friendly error mapping ────────────────────────────────────────────
// Бэкенд отдаёт детали ошибок на английском; здесь переводим известные в русский,
// чтобы показывать пользователю понятный текст.

const ERROR_TRANSLATIONS: Record<string, string> = {
    "User with this email already exists": "Пользователь с такой почтой уже зарегистрирован",
    "Signup already in progress for this email":
        "Регистрация для этой почты уже начата. Проверьте письмо с кодом подтверждения",
    "Invalid confirmation code": "Неверный код подтверждения",
    "Confirmation code has expired": "Срок действия кода истёк. Запросите новый код",
    "Signup request not found": "Регистрация не найдена. Начните заново",
    "Project type is required to create a project in this workspace":
        "Для создания проекта в пространстве необходимо выбрать тип",
    "Project has reached maximum number of participants":
        "Проект достиг максимального числа участников",
};

/**
 * Текст ошибки для показа пользователю.
 *
 * `preferServerDetail` для эндпоинтов, чьи `detail` уже приходят локализованными
 * (например, `PUT /projects/{id}` объясняет, какую роль нельзя удалить и
 * почему). Без флага остаётся старое поведение: наружу уходят только переводы
 * из `ERROR_TRANSLATIONS`, а любой другой `detail` — служебный текст на
 * английском, который пользователю ничего не объясняет.
 */
export const getApiErrorMessage = (
    error: unknown,
    fallback: string,
    preferServerDetail = false,
): string => {
    const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    if (detail && ERROR_TRANSLATIONS[detail]) {
        return ERROR_TRANSLATIONS[detail];
    }
    if (preferServerDetail && detail) {
        return detail;
    }
    return fallback;
};
