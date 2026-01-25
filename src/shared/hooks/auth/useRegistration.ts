import { useMutation } from "@tanstack/react-query";
import AuthService from "../../../features/auth/services/AuthService";
import { type Dispatch, type SetStateAction } from "react";
import type { RegistrationBodyForRequest } from "../../types/forms/RegistrationFormType";

export function useRegistration(
    setAuthError: Dispatch<SetStateAction<string | null>>,
    onRegistrationSuccess: () => void,
) {
    const { mutate } = useMutation({
        mutationKey: ["auth"],
        mutationFn: async (data: RegistrationBodyForRequest) =>
            await AuthService.registration(data),
        onSuccess() {
            onRegistrationSuccess();
        },
        onError() {
            setAuthError("Такой пользователь уже существует");
        },
    });

    return {
        mutate,
    };
}
