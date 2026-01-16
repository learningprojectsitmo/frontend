import $api from '../../../api/interceptors';
import qs from 'qs';
import type { AxiosResponse } from 'axios'
import type { AuthResponce, RegistrationResponce } from "../../../shared/types/responce/AuthResponce";

export default class AuthService {
    static async login(email: string, password: string): Promise<AxiosResponse<AuthResponce>> {
        return $api.post('v1/auth/token', qs.stringify({"grant_type": "password", "username": email, "password": password }), {headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
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
    }
}
