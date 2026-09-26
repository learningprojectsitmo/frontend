export type ActivityDay = {
    date: string;
    count: number;
};

export type ActivityActor = {
    id: number;
    name: string;
};

export type ActivityItem = {
    id: number;
    kind: string;
    description: string;
    performed_at: string;
    actor: ActivityActor | null;
};

export type ActivityResponse = {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    /** Начало окна активности: дата регистрации пользователя или создания проекта. */
    since: string | null;
    summary: ActivityDay[];
    items: ActivityItem[];
};
