import type { SpacesListParams } from "@/types/api";

type WorkspaceParticipantsParams = {
    page?: number;
    limit?: number;
    search?: string;
    project_id?: number;
    date_from?: string;
    date_to?: string;
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
        responses: () => ["profile", "responses"] as const,
        invitations: () => ["profile", "invitations"] as const,
        spaces: () => ["profile", "spaces"] as const,
        createdProjects: () => ["profile", "created-projects"] as const,
        projects: () => ["profile", "projects"] as const,
        activity: () => ["profile", "activity"] as const,
    },

    project: {
        detail: (id: string | number) => ["project", String(id)] as const,
        list: (workspaceId: string | number) => ["projects", "list", String(workspaceId)] as const,
        lists: () => ["projects", "list"] as const,
        recent: () => ["projects", "recent"] as const,
        byIds: (ids?: number[]) =>
            ids ? (["projects", "by_ids", ids] as const) : (["projects", "by_ids"] as const),
    },

    projectTypes: {
        all: () => ["project-types"] as const,
        scoped: (workspaceId?: number | null) =>
            ["project-types", workspaceId ?? "system"] as const,
    },

    stageHistory: {
        detail: (projectId: string | number) => ["stage-history", String(projectId)] as const,
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
        resumes: (id: number) => ["workspaces", id, "resumes"] as const,
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
};
