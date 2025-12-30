import axios from "axios";
import type { AuthResponce } from "../shared/types/responce/AuthResponce";

// Используем localhost для разработки, но с возможностью переключения
// Функция для получения правильного API URL в зависимости от окружения
const getApiUrl = () => {
    // Приоритет переменной окружения
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // В development режиме используем localhost
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:8083";
    }

    // В production/Docker используем имя сервиса
    return "http://backend:8083";
};

export const API_URL = getApiUrl();

const $api = axios.create({
    withCredentials: true,
    baseURL: API_URL,
});

$api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return config;
});

$api.interceptors.response.use(
    (config) => {
        return config;
    },
    async (error) => {
        const originalRequest = error.config;
        // Добавляем проверку на существование error.response
        if (error.response?.status === 401 && error.config && !error.config._isRetry) {
            originalRequest._isRetry = true;
            try {
                const responce = await axios.get<AuthResponce>(`${API_URL}/v1/auth/refresh`, {
                    withCredentials: true,
                });
                localStorage.setItem("token", responce.data.access_token);
                return $api.request(originalRequest);
            } catch (e) {
                console.log(e);
            }
        }
        throw error;
    },
);

export default $api;
