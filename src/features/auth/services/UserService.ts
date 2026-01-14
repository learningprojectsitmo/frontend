<<<<<<< HEAD
import $api from "../../../api/interceptors";
import type { AxiosResponse } from "axios";
import type { UserListResponce } from "../../../shared/types/responce/UserListResponce";

export default class UserService {
    static fetchUsers(
        page: number = 1,
        limit: number = 10,
    ): Promise<AxiosResponse<UserListResponce>> {
        return $api.get<UserListResponce>(`/v1/users?page=${page}&limit=${limit}`);
    }
}
=======
import $api from '../../../api/interceptors'
import type { AxiosResponse } from 'axios'
import type { UserListResponce } from "../../../shared/types/responce/UserListResponce"

export default class UserService {
    static fetchUsers(page: number = 1, limit: number = 10): Promise<AxiosResponse<UserListResponce>> {
        return $api.get<UserListResponce>(`/v1/users?page=${page}&limit=${limit}`)
    }
}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
