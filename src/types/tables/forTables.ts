export interface Member {
    id: number;
    name: string;
    role: string;
    contacts: string;
    resumeUrl: string;
    dateAdded: string;
    avatarUrl?: string;
    status: "default" | "delete";
}

export interface Replycant {
    id: number;
    name: string;
    priority: number;
    contacts: string;
    resumeUrl: string;
    responseDate: string;
    avatarUrl?: string;
    status: "invite" | "invited";
}

export interface Role {
    nameRole: string;
    responsibilities: string[];
    numberOfMembers: number;
}

export interface Platform {
    name: string;
    description: string;
    status: string;
    progressInPercent: number;
    due: string;
    tags: string[];
    members: number;
}
