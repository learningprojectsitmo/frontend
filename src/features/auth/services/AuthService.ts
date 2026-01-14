<<<<<<< HEAD
import $api from "../../../api/interceptors";
import type { AxiosResponse } from "axios";
import type {
    AuthResponce,
    RegistrationResponce,
} from "../../../shared/types/responce/AuthResponce";
import type { LoginFormType } from "../../../shared/types/forms/LoginFormType";
import type { RegistrationBodyForRequest } from "../../../shared/types/forms/RegistrationFormType";

export default class AuthService {
    static async login(data: LoginFormType): Promise<AxiosResponse<AuthResponce>> {
        return $api.post("/auth/token", data, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
    }

    static async registration(
        data: RegistrationBodyForRequest,
    ): Promise<AxiosResponse<RegistrationResponce>> {
        const payload: any = {
            email: data.email,
            first_name: data.firstName,
            middle_name: data.middleName,
            password_string: data.password,
        };

        if (data.lastName !== undefined) {
            payload.last_name = data.lastName;
        }

        if (data.isuNumber !== undefined) {
            payload.isu_number = data.isuNumber;
        }

        return $api.post("/v1/users", payload, { headers: { "Content-Type": "application/json" } });
    }

    static async logout(): Promise<void> {
        return $api.post("/v1/auth/logout");
=======
import $api from '../../../api/interceptors';
import qs from 'qs';
import type { AxiosResponse } from 'axios'
import type { AuthResponce, RegistrationResponce } from "../../../shared/types/responce/AuthResponce";

export default class AuthService {
    static async login(email: string, password: string): Promise<AxiosResponse<AuthResponce>> {
        return $api.post('/auth/token', qs.stringify({"username": email, "password": password }), {headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
    }

    static async registration(firstName: string, middleName: string, lastName: string | undefined, email: string, password: string, isuNumber?: number): Promise<AxiosResponse<RegistrationResponce>> {
        const payload: any = {
            "email": email,
            "first_name": firstName,
            "middle_name": middleName,
            "password_string": password
        }
        
        if (lastName) {
            payload.last_name = lastName;
        }
        
        if (isuNumber) {
            payload.isu_number = isuNumber;
        }

        return $api.post('/v1/users', payload, {headers: {'Content-Type': 'application/json'}})
    }

    static async logout(): Promise<void> {
        return $api.post('/v1/auth/logout')
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
    }
}
