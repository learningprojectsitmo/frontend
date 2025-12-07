export interface IUser {
    id: number;
    email: string;
    first_name: string;
    middle_name: string;
    last_name?: string | null;
    isu_number?: number | null;
    tg_nickname?: string | null;
}