import type { IUser } from "../entities/User";

export interface UserListResponce {
    items: IUser[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}