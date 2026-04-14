import { configureAuth } from "react-query-auth";
import {
    useMutation,
    type UseMutationResult,
    type UseMutationOptions,
} from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";

import { paths } from "@/config/paths";
import type { User, AuthTokenResponse } from "@/types/api";
import { api } from "./api-client";

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
    email: z.string().min(1, "Обязательное поле").email("Неправильный формат почты"),
    confirmationCode: z.string().min(6, "Обязательное поле"),
});

export const resendCodeInputSchema = z.object({
    email: z.string().min(1, "Обязательное поле").email("Неправильный формат почты"),
});

export const addContactsInputSchema = z.object({
    email: z.string().min(1, "Обязательное поле").email("Неправильный формат почты"),
    telegram: telegramSchema,
    vk: vkSchema,
    showMyContacts: z.boolean().default(false),
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
export type AddContactsInput = z.infer<typeof addContactsInputSchema>;
export type ResetWithEmailInput = z.infer<typeof resetWithEmailInputSchema>;
export type ResetWithPasswordInput = z.infer<typeof resetWithPasswordInputSchema>;

// ─── API Functions ────────────────────────────────────────────────────────────

const getUser = async (): Promise<User | null> => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        return await api.get<User>("/auth/me") as unknown as User;
    } catch {
        localStorage.removeItem("token");
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
    form.append("email", data.email);
    form.append("password", data.password);
    form.append("remember_me", data.rememberMe.toString());

    return await api.post<AuthTokenResponse>("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }) as unknown as AuthTokenResponse;
};

const createAcc = async (data: CreateAccInput): Promise<unknown> => {
    return await api.post("/auth/createacc", data);
};

const registerWithEmailAndPassword = async (
    data: RegisterConfirmInput,
): Promise<AuthTokenResponse> => {
    return await api.post<AuthTokenResponse>("/auth/register", data) as unknown as AuthTokenResponse;
};

const resendCode = async (data: ResendCodeInput): Promise<unknown> => {
    return await api.post("/auth/resendcode", data);
};

const addContacts = async (data: AddContactsInput): Promise<AuthTokenResponse> => {
    return await api.post<AuthTokenResponse>("/auth/addcontacts", data) as unknown as AuthTokenResponse;
};

const resetWithEmail = async (data: ResetWithEmailInput): Promise<unknown> => {
    return await api.post("/auth/resetemail", data);
};

const resetWithPassword = async (data: ResetWithPasswordInput): Promise<unknown> => {
    return await api.post("/auth/resetpassword", data);
};

// ─── Auth Config ──────────────────────────────────────────────────────────────

const authConfig = {
    userFn: getUser,

    loginFn: async (data: LoginInput): Promise<User> => {
        const response = await loginWithEmailAndPassword(data);
        if (response.access_token) {
            localStorage.setItem("token", response.access_token);
        }
        const user = await getUser();
        if (!user) throw new Error("Не удалось получить данные пользователя после входа");
        return user;
    },

    registerFn: async (data: RegisterConfirmInput): Promise<User> => {
        const response = await registerWithEmailAndPassword(data);
        if (response.access_token) {
            localStorage.setItem("token", response.access_token);
        }
        const user = await getUser();
        if (!user) throw new Error("Не удалось получить данные пользователя после регистрации");
        return user;
    },

    // interceptor срезает статус — просто чистим токен без проверки статуса
    logoutFn: async (): Promise<void> => {
        await logout();
        localStorage.removeItem("token");
    },
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } =
    configureAuth(authConfig);

// ─── Custom Mutation Hooks ────────────────────────────────────────────────────

export const useCreateAcc = (
    options?: UseMutationOptions<unknown, Error, CreateAccInput>,
): UseMutationResult<unknown, Error, CreateAccInput> => {
    return useMutation({ mutationFn: createAcc, ...options });
};

export const useResendCode = (
    options?: UseMutationOptions<unknown, Error, ResendCodeInput>,
): UseMutationResult<unknown, Error, ResendCodeInput> => {
    return useMutation({ mutationFn: resendCode, ...options });
};

export const useAddContacts = (
    options?: UseMutationOptions<AuthTokenResponse, Error, AddContactsInput>,
): UseMutationResult<AuthTokenResponse, Error, AddContactsInput> => {
    return useMutation({ mutationFn: addContacts, ...options });
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
    const user = useUser();
    const location = useLocation();

    if (!user.data) {
        return <Navigate to={paths.auth.login.getHref(location.pathname)} replace />;
    }

    return <>{children}</>;
};
