# Работа с API

## 📡 API Client

Базовый HTTP-клиент настроен в `src/lib/api-client.ts`.

### Конфигурация

```tsx
import { api } from "@/lib/api-client";

// Создание axios instance с базовым URL
export const api = Axios.create({
    baseURL: env.API_URL,
});
```

### Перехватчики (Interceptors)

#### Request Interceptor

Добавляет к каждому запросу:

- `Accept: application/json`
- `Authorization: Bearer {token}` из localStorage
- `withCredentials: true`

```tsx
function authRequestInterceptor(config: InternalAxiosRequestConfig) {
    if (config.headers) {
        config.headers.Accept = "application/json";

        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    config.withCredentials = true;
    return config;
}
```

#### Response Interceptor

Обрабатывает ответы и ошибки:

- Извлекает `response.data`
- Форматирует сообщения об ошибках
- Показывает уведомления через `useNotifications`
- Обрабатывает 401 ошибки

```tsx
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        let message = error.response?.data?.message || error.message;

        if (error.response?.status === 401) {
            message = "401 Incorrect username or password";
        }

        useNotifications.getState().addNotification({
            type: "error",
            title: "Error",
            message,
        });

        return Promise.reject(error);
    },
);
```

---

## 🔧 React Query

### Конфигурация

Файл: `src/lib/react-query.ts`

```tsx
export const queryConfig = {
    queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 1000 * 60, // 1 минута
    },
} satisfies DefaultOptions;
```

### Типы

```tsx
// Тип возвращаемого значения API-функции
export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> = Awaited<
    ReturnType<FnType>
>;

// Конфиг для query
export type QueryConfig<T extends (...args: any[]) => any> = Omit<
    ReturnType<T>,
    "queryKey" | "queryFn"
>;

// Конфиг для mutation
export type MutationConfig<MutationFnType extends (...args: any) => Promise<any>> =
    UseMutationOptions<ApiFnReturnType<MutationFnType>, Error, Parameters<MutationFnType>[0]>;
```

### Пример использования

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryConfig } from "@/lib/react-query";

// Query
export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: () => api.get("/users"),
        ...queryConfig.queries,
    });
}

// Mutation
export function useLogin() {
    return useMutation({
        mutationFn: (data: LoginParams) => api.post("/auth/login", data),
        onSuccess: () => {
            // Инвалидация кэша
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
}
```

---

## 📝 TypeScript Типы API

Файл: `src/types/api.ts`

### Базовые типы

```tsx
export type BaseEntity = {
    id: string;
    createdAt: number;
};

export type Entity<T> = {
    [K in keyof T]: T[K];
} & BaseEntity;

export type Meta = {
    page: number;
    total: number;
    totalPages: number;
};
```

### Модели данных

```tsx
export type User = Entity<{
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string;
}>;

export type AuthResponse = {
    access_token: any;
    jwt: string;
    user: User;
};

export type Team = Entity<{
    name: string;
    description: string;
}>;

export type Discussion = Entity<{
    title: string;
    body: string;
    teamId: string;
    author: User;
}>;
```

---

## 🔐 Аутентификация

### Получение токена

```tsx
const token = localStorage.getItem("token");
```

### Логаут

При 401 ошибке можно выполнить редирект на страницу логина:

```tsx
const searchParams = new URLSearchParams();
const redirectTo = searchParams.get("redirectTo") || window.location.pathname;
window.location.href = paths.auth.login.getHref(redirectTo);
```
