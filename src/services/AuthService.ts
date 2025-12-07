import $api from "../http"
import qs from 'qs';
import type { AxiosResponse } from 'axios'
import type { AuthResponce } from "../models/responce/AuthResponce"

export default class AuthService {
    static async login(email: string, password: string): Promise<AxiosResponse<AuthResponce>> {
        return $api.post('/auth/token', qs.stringify({"username": email, "password": password }), {headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
    }

    static async registration(firstName: string, middleName: string, lastName: string|undefined, ISU: number|undefined, email: string, password: string): Promise<AxiosResponse<AuthResponce>> {
        return $api.post('/v1/users', {
            "email": email,
            "first_name": firstName,
            "middle_name": middleName,
            "last_name": lastName,
            "password_string": password
        }, {headers: {'Content-Type': 'application/json'}})
    }

    static async logout(): Promise<void> {
        return $api.post('/logout')
    }
}
