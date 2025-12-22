import type { IUser } from "../shared/types/entities/User.ts";
import { makeAutoObservable } from "mobx"
import axios from 'axios';
import { API_URL } from "../api/interceptors.ts"
import type { AuthResponce } from "../shared/types/responce/AuthResponce.ts";
import AuthService from "../features/auth/services/AuthService.ts";
import UserService from "../features/auth/services/UserService.ts";

export default class Store {
    user = {} as IUser
    isAuth = false
    isLoading = false
    isLoadingUsers = false

    isLoginFailed = false
    isRegistrationFailed = false

    constructor() {
        makeAutoObservable(this);
    }

    setAuth(bool: boolean) {
        this.isAuth = bool;
    }

    setUser(user: IUser) {
        this.user = user;
    }

    setLoading(bool: boolean) {
        this.isLoading = bool;
    }

    setLoadingUsers(bool: boolean) {
        this.isLoadingUsers = bool;
    }

    setLoginFailed(bool: boolean) {
        this.isLoginFailed = bool;
    }

    setRegistrationFailed(bool: boolean) {
        this.isRegistrationFailed = bool;
    }

    async login(email: string, password: string) {
        try {
            const response = await AuthService.login(email, password);
            localStorage.setItem('token', response.data.access_token)
            
            // После успешного логина делаем запрос к API для получения информации о пользователе
            // Используем email из формы для поиска пользователя
            // TODO: лучше создать отдельный endpoint для получения текущего пользователя
            const usersResponse = await UserService.fetchUsers(1, 100); // Получаем достаточно пользователей для поиска
            const currentUser = usersResponse.data.items.find(user => user.email === email);
            
            if (currentUser) {
                this.setUser(currentUser);
            } else {
                console.warn('User not found after login');
            }
            
            this.setAuth(true)
        } catch(e) {
            this.setLoginFailed(true)
            if (axios.isAxiosError(e)) {
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }
        }
    }

    async registration(firstName: string, middleName: string, lastName: string | undefined, email: string, password: string, isuNumber?: number) {
        try {
            const response = await AuthService.registration(firstName, middleName, lastName, email, password, isuNumber);
            const userData = response.data;
            
            // При регистрации пользователь НЕ должен автоматически логиниться
            // Пользователь должен ввести свои данные на странице логина
            console.log('Пользователь успешно создан:', userData.email);
            
            // Сбрасываем состояние аутентификации
            this.setAuth(false);
            this.setUser({} as IUser);

            localStorage.removeItem('token');
            
        } catch(e) {
            this.setRegistrationFailed(true)
            if (axios.isAxiosError(e)) {
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }
        }
    }

    async logout() {
        try {
            await AuthService.logout();
            localStorage.removeItem('token')
            this.setAuth(false)
        } catch(e) {
            if (axios.isAxiosError(e)) {
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }
        }
    }

    async checkAuth() {
        this.setLoading(true);
        try {
            const response = await axios.get<AuthResponce>(`${API_URL}/v1/auth/refresh`, {withCredentials: true})
            localStorage.setItem('token', response.data.access_token)
        } catch(e) {
            if (axios.isAxiosError(e)) {
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }
        } finally {
            this.setLoading(false)
        }
    }

    async getUsers() {
        this.setLoadingUsers(true);
        try {
            return await UserService.fetchUsers();
        } catch(e) {
            if (axios.isAxiosError(e)) {
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }
        } finally {
            this.setLoadingUsers(false);
        }
    }
}