export type ResponseItem = {
    id: number;
    projectId: number;
    projectName: string;
    description: string;
    role: string;
    resumeUrl: string;
    resumeTitle: string;
    date: string;
    status: "pending" | "accepted" | "rejected" | "withdrawn";
};

export type InvitationItem = {
    id: number;
    projectId: number;
    projectName: string;
    description: string;
    inviterName: string;
    role: string;
    resumeUrl: string;
    resumeTitle: string;
    date: string;
    status: "pending" | "accepted" | "rejected";
};

export type ProfileSpace = {
    id: number;
    name: string;
    description: string;
    role: string;
    projectsCount: number;
    membersCount: number;
};

export type ProfileProject = {
    id: number;
    title: string;
    description: string;
    status: "in_progress" | "paused" | "completed" | "not_started";
    progress: number;
    startDate: string;
    membersCount: number;
    roles: string[];
};

export type ProfileFiltersState = {
    dateRange: { from: string; to: string } | null;
    authors: string[];
    projects: string[];
    roles: string[];
    datePreset: "all" | "today" | "7days" | "30days" | "custom";
    calendarDates: string[];
    customDate: { from: Date; to: Date } | undefined;
};

export const defaultProfileFilters: ProfileFiltersState = {
    dateRange: null,
    authors: [],
    projects: [],
    roles: [],
    datePreset: "all",
    calendarDates: [],
    customDate: undefined,
};
