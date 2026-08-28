import { configureAuth } from "react-query-auth";
import {
    useMutation,
    useQueryClient,
    type UseMutationResult,
    type UseMutationOptions,
} from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";

import { paths } from "@/config/paths";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useNotifications } from "@/components/ui/notifications";
import type { User, AuthTokenResponse, NewUserResponse } from "@/types/api";
import {
    api,
    setAccessToken,
    clearAccessToken,
    isSessionExpired,
    clearSessionExpired,
} from "./api-client";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const loginInputSchema = z.object({
    email: z.string().min(1, "Обязательное поле").email("Неправильный формат почты"),
    password: z.string().min(5, "Обязательное поле").max(64, "Слишком большой пароль"),
    rememberMe: z.boolean().default(false),
});

export const telegramSchema = z
    .string()
    .trim()
    .refine(
        (val) => {
            if (val === "") return true;
            return /^@[a-zA-Z0-9_]{5,32}$/.test(val);
        },
        {
            message:
                'Username Telegram должен начинаться с @, содержать только латиницу, цифры или "_" и иметь длину от 5 до 32 символов',
        },
    );

export const vkSchema = z
    .string()
    .trim()
    .refine(
        (val) => {
            if (val === "") return true;
            if (!/^@[a-zA-Z0-9._-]{5,31}$/.test(val)) return false;
            const username = val.slice(1);
            if (/^[._-]|[._-]$/.test(username)) return false;
            if (/[._-]{2,}/.test(username)) return false;
            return true;
        },
        {
            message:
                "Username VK должен начинаться с @, может содержать латиницу, цифры и символы . _ -, длиной 5–31 символ. " +
                "Запрещены начало/конец с . _ -, а также их повторение подряд.",
        },
    );

export const createAccInputSchema = z.object({
    email: z.string().min(1, "Обязательное поле").email("Неправильный формат почты"),
    password: z.string().min(5, "Обязательное поле").max(64, "Слишком большой пароль"),
});

export const registerConfirmInputSchema = z.object({
    newuser_id: z.number(),
    code: z.string().min(6, "Обязательное поле"),
});

export const resendCodeInputSchema = z.object({
    newuser_id: z.number(),
});

export const registerNameInputSchema = z.object({
    first_name: z.string().min(1, "Обязательное поле"),
    middle_name: z.string().min(1, "Обязательное поле"),
    last_name: z.string().optional(),
});

export const addContactsInputSchema = z.object({
    telegram: telegramSchema,
    vk: vkSchema,
    showMyContacts: z.boolean().default(true),
});

export const resetWithEmailInputSchema = z.object({
    email: z.string().min(1, "Обязательное поле").email("Неправильный формат почты"),
});

export const resetWithPasswordInputSchema = z.object({
    password: z.string().min(5, "Обязательное поле").max(64, "Слишком большой пароль"),
    special_token: z.string(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginInputSchema>;
export type CreateAccInput = z.infer<typeof createAccInputSchema>;
export type RegisterConfirmInput = z.infer<typeof registerConfirmInputSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeInputSchema>;
export type RegisterNameInput = z.infer<typeof registerNameInputSchema>;
export type AddContactsInput = z.infer<typeof addContactsInputSchema>;
export type ResetWithEmailInput = z.infer<typeof resetWithEmailInputSchema>;
export type ResetWithPasswordInput = z.infer<typeof resetWithPasswordInputSchema>;

// ─── API Functions ────────────────────────────────────────────────────────────

const getUser = async (): Promise<User | null> => {
    try {
        const response: Record<string, unknown> = await api.get("/auth/me");
        if (response.access_token) {
            setAccessToken(response.access_token as string);
        }
        return response as unknown as User;
    } catch {
        clearAccessToken();
        return null;
    }
};

// interceptor возвращает response.data, поэтому тип возврата — сам объект, не AxiosResponse
const logout = async (): Promise<unknown> => {
    return await api.post("/auth/logout");
};

const loginWithEmailAndPassword = async (data: LoginInput): Promise<AuthTokenResponse> => {
    const form = new URLSearchParams();
    form.append("grant_type", "password");
    form.append("username", data.email);
    form.append("password", data.password);
    form.append("remember_me", data.rememberMe.toString());

    return (await api.post<AuthTokenResponse>("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })) as unknown as AuthTokenResponse;
};

const createAcc = async (data: CreateAccInput): Promise<NewUserResponse> => {
    return (await api.post<NewUserResponse>("/signup/request", data)) as NewUserResponse;
};

const registerWithEmailAndPassword = async (
    data: RegisterConfirmInput,
): Promise<AuthTokenResponse> => {
    return (await api.post<AuthTokenResponse>(`/signup/${data.newuser_id}/verify`, null, {
        params: { code: data.code },
    })) as unknown as AuthTokenResponse;
};

const resendCode = async (data: ResendCodeInput): Promise<unknown> => {
    return await api.post(`/signup/${data.newuser_id}/resend-code`);
};

const updateFullName = async (userId: number, data: RegisterNameInput): Promise<User> => {
    return (await api.put<User>(`/users/${userId}`, data)) as unknown as User;
};

const updateContacts = async (userId: number, data: AddContactsInput): Promise<User> => {
    return (await api.put<User>(`/users/${userId}`, {
        tg_nickname: data.telegram,
        vk_nickname: data.vk,
        show_my_contacts: data.showMyContacts,
    })) as unknown as User;
};

const resetWithEmail = async (data: ResetWithEmailInput): Promise<unknown> => {
    return await api.post("/auth/password-reset/request", data);
};

const resetWithPassword = async (data: ResetWithPasswordInput): Promise<unknown> => {
    return await api.post("/auth/password-reset/confirm", {
        token: data.special_token,
        new_password: data.password,
    });
};

// ─── Auth Config ──────────────────────────────────────────────────────────────

const authConfig = {
    userFn: getUser,

    loginFn: async (data: LoginInput): Promise<User> => {
        const response = await loginWithEmailAndPassword(data);
        if (response.access_token) {
            setAccessToken(response.access_token);
        }
        const user = await getUser();
        if (!user) throw new Error("Не удалось получить данные пользователя после входа");
        return user;
    },

    registerFn: async (data: RegisterConfirmInput): Promise<User> => {
        const response = await registerWithEmailAndPassword(data);
        if (response.access_token) {
            setAccessToken(response.access_token);
        }
        const user = await getUser();
        if (!user) throw new Error("Не удалось получить данные пользователя после регистрации");
        return user;
    },

    // interceptor срезает статус — просто чистим токен без проверки статуса
    logoutFn: async (): Promise<void> => {
        await logout();
        clearAccessToken();
    },
};

const { useLogout: useLogoutBase, ...auth } = configureAuth(authConfig);

export const useLogout = (options?: Parameters<typeof useLogoutBase>[0]) => {
    const queryClient = useQueryClient();
    return useLogoutBase({
        ...options,
        onSuccess: (...args) => {
            queryClient.clear();
            localStorage.removeItem("recently_viewed_project_ids");
            options?.onSuccess?.(...args);
        },
    });
};

export const { useUser, useLogin, useRegister, AuthLoader } = auth;

// ─── Custom Mutation Hooks ────────────────────────────────────────────────────

export const useCreateAcc = (
    options?: UseMutationOptions<NewUserResponse, Error, CreateAccInput>,
): UseMutationResult<NewUserResponse, Error, CreateAccInput> => {
    return useMutation({ mutationFn: createAcc, ...options });
};

export const useResendCode = (
    options?: UseMutationOptions<unknown, Error, ResendCodeInput>,
): UseMutationResult<unknown, Error, ResendCodeInput> => {
    return useMutation({ mutationFn: resendCode, ...options });
};

export const useUpdateFullName = (
    userId: number,
    options?: UseMutationOptions<User, Error, RegisterNameInput>,
): UseMutationResult<User, Error, RegisterNameInput> => {
    return useMutation({
        mutationFn: (data: RegisterNameInput) => updateFullName(userId, data),
        ...options,
    });
};

export const useUpdateContacts = (
    userId: number,
    options?: UseMutationOptions<User, Error, AddContactsInput>,
): UseMutationResult<User, Error, AddContactsInput> => {
    return useMutation({
        mutationFn: (data: AddContactsInput) => updateContacts(userId, data),
        ...options,
    });
};

export const useResetWithEmail = (
    options?: UseMutationOptions<unknown, Error, ResetWithEmailInput>,
): UseMutationResult<unknown, Error, ResetWithEmailInput> => {
    return useMutation({ mutationFn: resetWithEmail, ...options });
};

export const useResetWithPassword = (
    options?: UseMutationOptions<unknown, Error, ResetWithPasswordInput>,
): UseMutationResult<unknown, Error, ResetWithPasswordInput> => {
    return useMutation({ mutationFn: resetWithPassword, ...options });
};

// ─── Protected Route ──────────────────────────────────────────────────────────

export const ProtectedRoute = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    const { data: user, isLoading } = useUser();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        if (isSessionExpired()) {
            useNotifications.getState().addNotification({
                type: "error",
                title: "Error",
                message: "Сессия истекла. Пожалуйста, войдите снова.",
            });
            clearSessionExpired();
        }
        return <Navigate to={paths.auth.login.getHref(location.pathname)} replace />;
    }

    return <>{children}</>;
};
