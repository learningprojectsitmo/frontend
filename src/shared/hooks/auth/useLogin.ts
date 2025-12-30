import type { LoginFormType } from "../../types/forms/LoginFormType";
import { useMutation } from "@tanstack/react-query";
import AuthService from "../../../features/auth/services/AuthService";
import { type Dispatch, type SetStateAction } from "react";

export function useLogin(setAuthError: Dispatch<SetStateAction<string | null>>) {
    const { mutate } = useMutation({
        mutationKey: ["auth"],
        mutationFn: async (data: LoginFormType) => await AuthService.login(data),
        onSuccess() {},
        onError() {
            setAuthError("Неправильный логин или пароль");
        },
    });

    return {
        mutate,
    };
}
