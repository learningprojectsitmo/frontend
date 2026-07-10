# Working with API

## 📡 API Client

Base HTTP client configured in `src/lib/api-client.ts`.

### Configuration

```tsx
import { api } from "@/lib/api-client";

// Creating axios instance with base URL
export const api = Axios.create({
    baseURL: env.API_URL,
});
```

### Interceptors

#### Request Interceptor

Adds to each request:

- `Accept: application/json`
- `Authorization: Bearer {token}` from localStorage
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

Handles responses and errors:

- Extracts `response.data`
- Formats error messages
- Shows notifications via `useNotifications`
- Handles 401 errors

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

### Configuration

File: `src/lib/react-query.ts`

```tsx
export const queryConfig = {
    queries: {
        refetchOnWindowFocus: false,
        retry: false,
        staleTime: 1000 * 60, // 1 minute
    },
} satisfies DefaultOptions;
```

### Types

```tsx
// Return type of API function
export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> = Awaited<
    ReturnType<FnType>
>;

// Query config
export type QueryConfig<T extends (...args: any[]) => any> = Omit<
    ReturnType<T>,
    "queryKey" | "queryFn"
>;

// Mutation config
export type MutationConfig<MutationFnType extends (...args: any) => Promise<any>> =
    UseMutationOptions<ApiFnReturnType<MutationFnType>, Error, Parameters<MutationFnType>[0]>;
```

### Usage Example

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
            // Cache invalidation
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
    });
}
```

---

## 📝 TypeScript API Types

File: `src/types/api.ts`

### Base Types

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

### Data Models

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

## 🔐 Authentication

### Getting the Token

```tsx
const token = localStorage.getItem("token");
```

### Logout

On a 401 error, redirect to the login page:

```tsx
const searchParams = new URLSearchParams();
const redirectTo = searchParams.get("redirectTo") || window.location.pathname;
window.location.href = paths.auth.login.getHref(redirectTo);
```