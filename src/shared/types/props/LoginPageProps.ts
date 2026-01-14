<<<<<<< HEAD
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
=======
export interface LoginFormProps {
    setRegistration: (prop: boolean) => void
}

export interface RegistrationFormProps {
    setRegistration: (prop: boolean) => void
    onRegistrationSuccess: () => void
}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
