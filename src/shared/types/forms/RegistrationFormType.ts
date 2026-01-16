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
    lastName?: string;
    email: string;
    password: string;
    isuNumber?: number;
}

export interface RegistrationBody {
    first_name: string;
    middle_name: string;
    last_name?: string;
    email: string;
    password: string;
    isu_number?: number;
}