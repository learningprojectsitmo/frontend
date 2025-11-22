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

    async login(email: string, password: string) {
        try {
            const responce = await AuthService.login(email, password);
            localStorage.setItem('token', responce.data.accessToken)
            this.setAuth(true)
            this.setUser(responce.data.user)
        } catch(e) {
            if (axios.isAxiosError(e)) {
                console.log(e.response?.data?.message)
            } else {
                console.log(e)
            }
        }
    }

    async registration(email: string, password: string) {
        try {
            const responce = await AuthService.registration(email, password);
            localStorage.setItem('token', responce.data.accessToken)
            this.setAuth(true)
            this.setUser(responce.data.user)
        } catch(e) {
            if (axios.isAxiosError(e)) {
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