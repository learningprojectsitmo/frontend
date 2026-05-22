import Axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useNotifications } from "@/components/ui/notifications";
import { env } from "@/config/env";

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

export const api = Axios.create({
    baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
    (response) => response.data,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!originalRequest) return Promise.reject(error);

        if (error.response?.status !== 401) {
            useNotifications.getState().addNotification({
                type: "error",
                title: "Error",
                message: (error.response?.data as { message?: string })?.message || error.message,
            });
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            useNotifications.getState().addNotification({
                type: "error",
                title: "Error",
                message: "Неправильный ввод",
            });
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const response = await refreshApi.post("/auth/refresh");
            const newToken = (response as { access_token: string }).access_token;

            setAccessToken(newToken);
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearAccessToken();
            useNotifications.getState().addNotification({
                type: "error",
                title: "Error",
                message: "Сессия истекла. Пожалуйста, войдите снова.",
            });
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

// ─── Separate instance for refresh (avoids interceptor loops) ─────────────

const refreshApi = Axios.create({
    baseURL: env.API_URL,
});

refreshApi.interceptors.request.use((config) => {
    config.withCredentials = true;
    return config;
});

refreshApi.interceptors.response.use((response) => response.data);
