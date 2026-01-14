
export interface AuthResponce {
    access_token: string;
    token_type: string;
}

// Для регистрации, когда создается пользователь
export interface RegistrationResponce {
    id: number;
    email: string;
    first_name: string;
    middle_name: string;
    last_name?: string;
    isu_number?: number;
    tg_nickname?: string;
}