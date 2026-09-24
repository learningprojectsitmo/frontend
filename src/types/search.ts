export type SearchProjectItem = {
    id: number;
    name: string;
    description?: string | null;
    workspace_id?: number | null;
    workspace_name?: string | null;
    status?: string | null;
    progress: number;
};

export type SearchSpaceItem = {
    id: number;
    title: string;
    description?: string | null;
    category?: string | null;
    projects_count: number;
    members_count: number;
};

export type SearchUserItem = {
    id: number;
    first_name: string | null;
    last_name: string | null;
    middle_name: string | null;
    email: string | null;
    role: string | null;
};

export type SearchResults = {
    projects: SearchProjectItem[];
    spaces: SearchSpaceItem[];
    users: SearchUserItem[];
};
