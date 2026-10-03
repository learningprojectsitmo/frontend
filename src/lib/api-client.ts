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

// ─── Refresh queue (prevents concurrent refresh calls) ────────────────────

interface QueueItem {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null): void {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
}

// ─── Axios instance ───────────────────────────────────────────────────────

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
    if (config.headers) {
        config.headers.Accept = "application/json";
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
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
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        // Если токена не было — не показываем «Сессия истекла»,
        // потому что сессии и не было (чистый визит, не залогинен).
        const hadToken = !!accessToken;

        try {
            const { access_token: newToken } = await refreshApi.post<{ access_token: string }>(
                "/auth/refresh",
            );

            setAccessToken(newToken);
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearAccessToken();
            if (hadToken) {
                _sessionExpired = true;
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
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

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
    const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    if (detail && ERROR_TRANSLATIONS[detail]) {
        return ERROR_TRANSLATIONS[detail];
    }
    return fallback;
};
