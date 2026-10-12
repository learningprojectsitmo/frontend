import type { ProfileResponse } from "@/types/api";

export type ResponseItem = {
    id: number;
    projectId: number;
    projectName: string;
    description: string;
    role: string;
    resumeUrl: string;
    resumeTitle: string;
    date: string;
    status: "pending" | "accepted" | "rejected" | "withdrawn" | "in_team";
    /** Причина отказа (`rejected`), если руководитель её указал. */
    rejectionReason?: string | null;
    /**
     * Уже состоит в другом проекте ЭТОГО пространства. Статус `in_team`
     * выставляется на чтении, когда `allow_multi_project_participation` выключен,
     * поэтому без этого флага «в команде» и «уже в другой команде» не различить.
     */
    busyInOtherProject: boolean;
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
    /** `cancelled` — приглашение отозвано руководителем проекта. */
    status: "pending" | "accepted" | "rejected" | "in_team" | "cancelled";
    allowMultiProjectParticipation: boolean;
    /** Уже состоит в другом проекте ЭТОГО пространства. */
    busyInOtherProject: boolean;
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

export type PublicProfile = ProfileResponse & {
    spaces: ProfileSpace[];
    projects: ProfileProject[];
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
