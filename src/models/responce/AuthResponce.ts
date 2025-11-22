import type { IUser } from "../IUser";

export interface AuthResponce {
    accessToken: string;
    refreshToken: string;
    user: IUser;
}