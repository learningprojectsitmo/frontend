export type ActivityDay = {
    date: string;
    count: number;
};

export type ActivityItem = {
    id: number;
    kind: string;
    description: string;
    performed_at: string;
};

export type ActivityResponse = {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    summary: ActivityDay[];
    items: ActivityItem[];
};
