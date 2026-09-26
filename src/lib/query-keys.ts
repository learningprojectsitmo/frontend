import type { SpacesListParams } from "@/types/api";

type WorkspaceParticipantsParams = {
    page?: number;
    limit?: number;
    search?: string;
    project_id?: number;
    date_from?: string;
    date_to?: string;
};

type WorkspaceResumeParams = {
    page?: number;
    limit?: number;
    search?: string;
    skills?: string[];
    interests?: string[];
};

/**
 * Централизованные query-ключи TanStack Query.
 *
 * Все id нормализуются в строку — TanStack сравнивает элементы ключей строго
 * (число !== строка), а инвалидация по несогласованному типу молча не срабатывает.
 */

export const queryKeys = {
    user: () => ["current-user"] as const,

    profile: {
        detail: () => ["profile"] as const,
        byId: (id: string | number) => ["profile", "public", String(id)] as const,
        byIdActivity: (id: string | number) =>
            ["profile", "public", String(id), "activity"] as const,
        responses: () => ["profile", "responses"] as const,
        invitations: () => ["profile", "invitations"] as const,
        spaces: () => ["profile", "spaces"] as const,
        createdProjects: () => ["profile", "created-projects"] as const,
        projects: () => ["profile", "projects"] as const,
        // day — выбранный день графика; попадает в ключ, чтобы лента и общая
        // лента не путались в кэше.
        activity: (page = 1, limit?: number, day?: string | null) =>
            compact(["profile", "activity", page, limit, day] as const),
    },

    project: {
        detail: (id: string | number) => ["project", String(id)] as const,
        list: (workspaceId: string | number) => ["projects", "list", String(workspaceId)] as const,
        lists: () => ["projects", "list"] as const,
        recent: () => ["projects", "recent"] as const,
        byIds: (ids?: number[]) =>
            ids ? (["projects", "by_ids", ids] as const) : (["projects", "by_ids"] as const),
        activity: (id: string | number, page = 1, limit?: number, day?: string | null) =>
            compact(["project", String(id), "activity", page, limit, day] as const),
    },

    projectTypes: {
        all: () => ["project-types"] as const,
        scoped: (workspaceId?: number | null) =>
            ["project-types", workspaceId ?? "system"] as const,
    },

    stageHistory: {
        detail: (projectId: string | number) => ["stage-history", String(projectId)] as const,
    },

    specification: {
        detail: (projectId: string | number) =>
            ["project", String(projectId), "specification"] as const,
        comments: (projectId: string | number) =>
            ["project", String(projectId), "specification", "comments"] as const,
    },

    workspace: {
        list: (params?: SpacesListParams) =>
            params ? (["workspaces", "list", params] as const) : (["workspaces", "list"] as const),
        settings: (id: number) => ["workspaces", id, "settings"] as const,
        inviteLinks: (id: number) => ["workspaces", id, "invite-link"] as const,
        participants: (id: number, params?: WorkspaceParticipantsParams) =>
            params
                ? (["workspaces", id, "participants", params] as const)
                : (["workspaces", id, "participants"] as const),
        resumes: (id: number, params?: WorkspaceResumeParams) =>
            params
                ? (["workspaces", id, "resumes", params] as const)
                : (["workspaces", id, "resumes"] as const),
        resumeFilters: (id: number) => ["workspaces", id, "resumes", "filters"] as const,
    },

    notifications: {
        all: () => ["notifications"] as const,
        list: () => ["notifications", "list"] as const,
        my: (page: number, limit: number) => ["notifications", "my", page, limit] as const,
    },

    resume: {
        detail: (id: string | number) => ["resume", String(id), "detail"] as const,
    },

    roles: () => ["roles"] as const,

    authResetEmail: (token: string) => ["auth", "reset-email", token] as const,

    search: (q: string, scope: "default" | "extended" = "default") => ["search", scope, q] as const,
};

/** Убирает пустые сегменты из ключа: `undefined`/`null` не должны его различать. */
function compact<T extends readonly unknown[]>(parts: T): T {
    return parts.filter((p) => p !== undefined && p !== null) as unknown as T;
}
