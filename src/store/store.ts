import type { IUser } from "../models/IUser";
import { makeAutoObservable } from "mobx"
import AuthService from '../services/AuthService.ts'
import axios from 'axios';
import API_URL from "../http/index.ts"
import type { AuthResponce } from "../models/responce/AuthResponce.ts";

export default class Store {
    user = {} as IUser
    isAuth = false
    isLoading = false

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

    setLoginFailed(bool: boolean) {
        this.isLoginFailed = bool;
    }

    setRegistrationFailed(bool: boolean) {
        this.isRegistrationFailed = bool;
    }

    async login(email: string, password: string) {
        try {
            const responce = await AuthService.login(email, password);
            localStorage.setItem('token', responce.data.accessToken)
            this.setAuth(true)
            this.setUser(responce.data.user)
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
            const responce = await AuthService.registration(firstName, middleName, lastName, ISU, email, password);
            localStorage.setItem('token', responce.data.accessToken)
            this.setAuth(true)
            this.setUser(responce.data.user)
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
            const responce = await AuthService.logout();
            localStorage.removeItem('token')
            this.setAuth(false)
            this.setUser({} as IUser)
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
            const responce = await axios.get<AuthResponce>(`${API_URL}/refresh`, {withCredentials: true})
            localStorage.setItem('token', responce.data.accessToken)
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
}