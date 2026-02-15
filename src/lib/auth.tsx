import { configureAuth } from "react-query-auth";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";

import { paths } from "@/config/paths";
import type { LoginResponse, User } from "@/types/api";

import { api } from "./api-client";

export const loginInputSchema = z.object({
    email: z.string().min(1, "Required").email("Invalid email"),
    password: z.string().min(5, "Required"),
});


export const registerInputSchema = z
    .object({
        email: z.string().min(1, "Required"),
        firstName: z.string().min(1, "Required"),
        lastName: z.string().min(1, "Required"),
        password: z.string().min(5, "Required"),
    })
    .and(
        z
            .object({
                teamId: z.string().min(1, "Required"),
                teamName: z.null().default(null),
            })
            .or(
                z.object({
                    teamName: z.string().min(1, "Required"),
                    teamId: z.null().default(null),
                }),
            ),
    );

export const resetWithEmailInputSchema = z.object({
    email: z.string().min(1, "Required").email("Invalid email"),
});

export const resetWithPasswordInputSchema = z.object({
    password: z.string().min(5, "Required"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
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

const loginWithEmailAndPassword = async (data: LoginInput) : Promise<LoginResponse> => {
    const form = new URLSearchParams();
    form.append("grant_type", "password");
    form.append("username", data.email);
    form.append("password", data.password);

    return await api.post("/auth/token", form, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
};

const registerWithEmailAndPassword = async (data: RegisterInput) => {
    return await api.post("/auth/register", data);
};

const resetWithEmail = async (data: ResetWithEmailInput) => {
    await api.post("/auth/resetemail", data);
};

const resetWithPassword = async (data: ResetWithPasswordInput) => {
    await api.post("/auth/resetpassword", data);
};

const authConfig = {
    userFn: getUser,
    loginFn: async (data: LoginInput)  => {
        const response = await loginWithEmailAndPassword(data);

        if (response.access_token) {
            localStorage.setItem("token", response.access_token);
        }

        return await getUser();
    },

    registerFn: async (data: RegisterInput) => {
        const response = await registerWithEmailAndPassword(data);

        if (response.access_token) {
            localStorage.setItem("token", response.access_token);
        }
        return await getUser();
    },
    logoutFn: async () => {
        const response = await logout();
        if (response.status === 200) {
            localStorage.removeItem("token");
        }
    },
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } = configureAuth(authConfig);

export const useResetWithEmail = (): UseMutationResult<void, Error, ResetWithEmailInput> => {
    return useMutation({
        mutationFn: resetWithEmail,
    });
};

export const useResetWithPassword = (): UseMutationResult<void, Error, ResetWithPasswordInput> => {
    return useMutation({
        mutationFn: resetWithPassword,
    });
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useUser();
    const location = useLocation();

    if (!user.data) {
        return <Navigate to={paths.auth.login.getHref(location.pathname)} replace />;
    }

    return children;
};
