import type { IUser } from "../models/IUser";
import { makeAutoObservable } from "mobx"
import AuthService from '../services/AuthService.ts'
import UserService from '../services/UserService.ts'
import axios from 'axios';
import API_URL from "../http/index.ts"
import type { AuthResponce } from "../models/responce/AuthResponce.ts";

export default class Store {
    user = {} as IUser
    isAuth = true
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
        this.user = user
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
            localStorage.setItem('token', response.data.accessToken)
            this.setAuth(true)
            this.setUser(response.data.user)
        } catch(e) {
            this.setLoginFailed(true)//remove after integration with backend
            if (axios.isAxiosError(e)) {
                //this.setLoginFailed(true) uncomment after integration with backend
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }

        }
    }

    async registration(firstName: string, middleName: string, lastName: string|undefined, ISU: number|undefined, email: string, password: string) {
        try {
            const response = await AuthService.registration(firstName, middleName, lastName, ISU, email, password);
            localStorage.setItem('token', response.data.accessToken)
            this.setAuth(true)
            this.setUser(response.data.user)
        } catch(e) {
            this.setRegistrationFailed(true)//remove after integration with backend
            if (axios.isAxiosError(e)) {
                //this.setRegistrationFailed(true) uncomment after integration with backend
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
            const response = await axios.get<AuthResponce>(`${API_URL}/refresh`, {withCredentials: true})
            localStorage.setItem('token', response.data.accessToken)
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