import { configureAuth } from "react-query-auth";
import {
    useMutation,
    type UseMutationResult,
    type UseMutationOptions,
} from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";

import { paths } from "@/config/paths";
import type { User } from "@/types/api";

import { api } from "./api-client";
import type { AxiosResponse } from "axios";

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
            // если поле не заполнено - ок
            if (val === "") return true;
            // иначе проверяем формат @ + латиница/цифры/_, длина 5-32
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
                "Username VK должен начинаться с @, может латиницу, цифры и символы . _ -, длиной 5–31 символ. " +
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
    special_token: z.string(), //нужен какой нибудь ключ чтобы сторонний пользователь не мог просто так вызвать этот эндпоинт и сбросить пароль, например, uuid, который придет в ссылке на почту
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type CreateAccInput = z.infer<typeof createAccInputSchema>;
export type RegisterConfirmInput = z.infer<typeof registerConfirmInputSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeInputSchema>;
export type AddContactsInput = z.infer<typeof addContactsInputSchema>;
export type ResetWithEmailInput = z.infer<typeof resetWithEmailInputSchema>;
export type ResetWithPasswordInput = z.infer<typeof resetWithPasswordInputSchema>;

const getUser = async (): Promise<User | null> => {
    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    return await api.get("/auth/me");
};

const logout = async () => {
    return await api.post("/auth/logout");
};

const loginWithEmailAndPassword = async (data: LoginInput) => {
    const form = new URLSearchParams(); // для отправки данных в формате application/x-www-form-urlencoded
    form.append("grant_type", "password");
    form.append("email", data.email);
    form.append("password", data.password);
    form.append("remember_me", data.rememberMe.toString());

    return await api.post("/auth/login", form, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
};

const createAcc = async (data: CreateAccInput) => {
    //первый запрос для регистрации, нужен чтобы сервер отправил по почте код подтверждения, который пользователь введет на следующем шаге
    return await api.post("/auth/createacc", data);
};

const registerWithEmailAndPassword = async (data: RegisterConfirmInput) => {
    //второй запрос для регистрации, который подтверждает код из почты
    return await api.post("/auth/register", data);
};

const resendCode = async (data: ResendCodeInput) => {
    //запрос для повторной отправки кода подтверждения на почту
    return await api.post("/auth/resendcode", data);
};

const addContacts = async (data: AddContactsInput) => {
    //третий запрос для регистрации, добавление контактов (телеграм, вк) и настройка их отображения в профиле, после которого приходит access токен и пользователь считается полностью зарегистрированным и авторизованным в системе
    return await api.post("/auth/addcontacts", data);
};

const resetWithEmail = async (data: ResetWithEmailInput) => {
    //запрос для начала процесса восстановления пароля, сервер отправляет на почту ссылку на форму смены пароля
    return await api.post("/auth/resetemail", data);
};

const resetWithPassword = async (data: ResetWithPasswordInput) => {
    //запрос для завершения процесса восстановления пароля,
    return await api.post("/auth/resetpassword", data);
};

const authConfig = {
    userFn: getUser,
    loginFn: async (data: LoginInput) => {
        const response = await loginWithEmailAndPassword(data);
        if (response.data.access_token) {
            localStorage.setItem("token", response.data.access_token);
        }
        return response.data;
    },
    registerFn: async (data: RegisterConfirmInput) => {
        const response = await registerWithEmailAndPassword(data);
        if (response.data.access_token) {
            localStorage.setItem("token", response.data.access_token);
        }
        return response.data;
    },
    logoutFn: async () => {
        const response = await logout();
        if (response.status === 200) {
            localStorage.removeItem("token");
        }
    },
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } = configureAuth(authConfig);

export const useCreateAcc = (
    options?: UseMutationOptions<AxiosResponse<unknown>, Error, CreateAccInput>,
): UseMutationResult<AxiosResponse<unknown>, Error, CreateAccInput> => {
    //unknown потом поменяем
    return useMutation({
        mutationFn: createAcc,
        ...options, //...options позволяет переопределить дефолтные настройки мутации, например onSuccess, onError и т.д.
    });
};

export const useResendCode = (
    options?: UseMutationOptions<AxiosResponse<unknown>, Error, ResendCodeInput>,
): UseMutationResult<AxiosResponse<unknown>, Error, ResendCodeInput> => {
    return useMutation({
        mutationFn: resendCode,
        ...options,
    });
};

export const useAddContacts = (
    options?: UseMutationOptions<AxiosResponse<unknown>, Error, AddContactsInput>,
): UseMutationResult<AxiosResponse<unknown>, Error, AddContactsInput> => {
    return useMutation({
        mutationFn: addContacts,
        ...options,
    });
};

export const useResetWithEmail = (): UseMutationResult<
    AxiosResponse<unknown>,
    Error,
    ResetWithEmailInput
> => {
    return useMutation({
        mutationFn: resetWithEmail,
    });
};

export const useResetWithPassword = (
    options?: UseMutationOptions<AxiosResponse<unknown>, Error, ResetWithPasswordInput>,
): UseMutationResult<AxiosResponse<unknown>, Error, ResetWithPasswordInput> => {
    return useMutation({
        mutationFn: resetWithPassword,
        ...options,
    });
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useUser();
    const location = useLocation();

    if (!user.data) {
        return <Navigate to={paths.auth.login.getHref(location.pathname)} replace />; // если пользователь не авторизован, перенаправляем на страницу логина, при этом сохраняем текущий путь в параметре redirect для последующего возвращения после успешного входа
    }

    return children;
};
