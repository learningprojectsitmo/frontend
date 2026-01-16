import $api from "../../../api/interceptors";
import type { AxiosResponse } from "axios";
import type {
    AuthResponce,
    RegistrationResponce,
} from "../../../shared/types/responce/AuthResponce";
import type { LoginFormType } from "../../../shared/types/forms/LoginFormType";
import type { RegistrationBody, RegistrationBodyForRequest } from "../../../shared/types/forms/RegistrationFormType";

export default class AuthService {
    static async login(data: LoginFormType): Promise<AxiosResponse<AuthResponce>> {
        return $api.post("/auth/token", data, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
    }

    static async registration(
        data: RegistrationBodyForRequest,
    ): Promise<AxiosResponse<RegistrationResponce>> {
        const payload: RegistrationBody = {
            email: data.email,
            first_name: data.firstName,
            middle_name: data.middleName,
            password: data.password,
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
    }
}
