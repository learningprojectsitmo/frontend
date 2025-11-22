import axios from 'axios';
import type { AuthResponce } from '../models/responce/AuthResponce';

export const API_URL = "http://localhost:5000" // will change that later

const $api = axios.create({
    withCredentials: true,
    baseURL: API_URL
})

$api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
    return config;
})

$api.interceptors.response.use((config) => {
    return config
}, async (error) => {
    const originalRequest = error.config
    if (error.response.status == 401 && error.config && !error.config._isRetry) {
        originalRequest._isRetry = true
        try {
            const responce = await axios.get<AuthResponce>(`${API_URL}/refresh`, {withCredentials: true})
            localStorage.setItem('token', responce.data.accessToken)
            return $api.request(originalRequest) 
        } catch(e) {
            console.log(e)
        }
        
    }
    throw error;
})

export default $api;
