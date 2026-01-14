export interface RegistrationFormType {
    firstName: string;
    middleName: string;
    lastName: string | undefined;
    email: string;
    password: string;
    isuNumber?: string;
    secondPassword: string;
}

export interface RegistrationBodyForRequest {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    password: string;
    isuNumber: string;
}
