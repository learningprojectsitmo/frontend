import type { IUser } from "../IUser";

export interface UserListResponce {
    items: IUser[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}