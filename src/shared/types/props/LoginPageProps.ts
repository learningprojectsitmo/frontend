export interface LoginFormProps {
    setRegistration: (prop: boolean) => void
}

export interface RegistrationFormProps {
    setRegistration: (prop: boolean) => void
    onRegistrationSuccess: () => void
}