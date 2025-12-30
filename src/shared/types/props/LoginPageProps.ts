import type { Dispatch, SetStateAction } from "react";

export interface LoginFormProps {
    setRegistration: (prop: boolean) => void;
}

export interface RegistrationFormProps {
    setRegistration: (prop: boolean) => void;
    onRegistrationSuccess: () => void;
}

export interface UseLoginProprs {
    setEmailError: Dispatch<SetStateAction<string>>;
    setPasswordError: Dispatch<SetStateAction<string>>;
}
