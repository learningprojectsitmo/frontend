import $api from "../http"
import type { AxiosResponse } from 'axios'
import type { UserListResponce } from "../models/responce/UserListResponce"

export default class UserService {
    static fetchUsers(page: number = 1, limit: number = 10): Promise<AxiosResponse<UserListResponce>> {
        return $api.get<UserListResponce>(`/v1/users?page=${page}&limit=${limit}`)
    }
}