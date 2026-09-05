import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type Notification,
    type SpacesListParams,
    type SpacesListResponce,
    type CreateWorkspaceInput,
    type SpaceSettingsInput,
    type SpaceSettingsFull,
    type WorkSpaceFull,
    type WorkspaceParticipantListResponse,
    type WorkspaceResumeListResponse,
    type InviteLinkResponse,
    type InviteLinkListResponse,
    type InviteLinkCreate,
    type JoinByLinkResponse,
} from "@/types/api";
import { queryKeys } from "./query-keys";

export const getSuggestions = async (search: string): Promise<string[]> => {
    return await api.get("/app/suggestions", { params: { search } });
};

export const getSpacesList = async (params?: SpacesListParams): Promise<SpacesListResponce> => {
    return await api.get("/workspaces/menu", { params });
};

export const useSpacesList = (params?: SpacesListParams) => {
    return useQuery({
        // params может содержать { page: 1, limit: 10 } и т.д.
        queryKey: queryKeys.workspace.list(params),
        queryFn: () => getSpacesList(params),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnMount: "always",
    });
};

export const getNotificationsList = async (): Promise<Notification[]> => {
    return await api.get("/app/notifications");
};

export const useNotificationsList = () => {
    return useQuery({
        queryKey: queryKeys.notifications.list(),
        queryFn: getNotificationsList,
        staleTime: 5 * 60 * 1000, // 10 минут
        gcTime: 10 * 60 * 1000,
    });
};

export const createWorkspace = async (data: CreateWorkspaceInput): Promise<WorkSpaceFull> => {
    return await api.post("/workspaces/", data);
};

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createWorkspace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.spaces() });
        },
    });
};

export const updateSpaceSettings = async (id: number, data: SpaceSettingsInput): Promise<void> => {
    return await api.put(`/workspaces/${id}/settings`, data);
};

export const useUpdateSpaceSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SpaceSettingsInput }) =>
            updateSpaceSettings(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.settings(variables.id) });
        },
    });
};

export const getSpaceSettings = async (workspaceId: number): Promise<SpaceSettingsFull> => {
    return await api.get(`/workspaces/${workspaceId}/settings`);
};

export const useSpaceSettings = (workspaceId: number, enabled?: boolean) => {
    return useQuery({
        queryKey: queryKeys.workspace.settings(workspaceId),
        queryFn: () => getSpaceSettings(workspaceId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: enabled ?? !!workspaceId,
    });
};

export const updateWorkspaceName = async (
    id: number,
    data: { name: string; description?: string },
): Promise<void> => {
    return await api.put(`/workspaces/${id}`, data);
};

export const useUpdateWorkspaceName = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) =>
            updateWorkspaceName(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.spaces() });
        },
    });
};

export const deleteWorkspace = async (id: number): Promise<void> => {
    return await api.delete(`/workspaces/${id}`);
};

export const useDeleteWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteWorkspace,
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.spaces() });
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.settings(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.inviteLinks(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.participants(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.resumes(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.createdProjects() });
            queryClient.invalidateQueries({ queryKey: queryKeys.project.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.project.recent() });
            queryClient.invalidateQueries({ queryKey: queryKeys.project.byIds() });
        },
    });
};

// === Invite link ===

export const getInviteLinks = async (workspaceId: number): Promise<InviteLinkListResponse> => {
    return await api.get(`/workspaces/${workspaceId}/invite-link`);
};

export const createInviteLink = async (
    workspaceId: number,
    data?: InviteLinkCreate,
): Promise<InviteLinkResponse> => {
    return await api.post(`/workspaces/${workspaceId}/invite-link`, data ?? {});
};

export const revokeInviteLink = async (workspaceId: number, token: string): Promise<void> => {
    return await api.delete(`/workspaces/${workspaceId}/invite-link/${token}`);
};

export const revokeAllInviteLinks = async (workspaceId: number): Promise<void> => {
    return await api.delete(`/workspaces/${workspaceId}/invite-link`);
};

export const useInviteLinks = (workspaceId: number, enabled?: boolean) => {
    return useQuery({
        queryKey: queryKeys.workspace.inviteLinks(workspaceId),
        queryFn: () => getInviteLinks(workspaceId),
        staleTime: 5 * 60 * 1000,
        retry: false,
        enabled: enabled ?? true,
    });
};

export const useCreateInviteLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: InviteLinkCreate }) =>
            createInviteLink(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.workspace.inviteLinks(variables.id),
            });
        },
    });
};

export const useRevokeInviteLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, token }: { id: number; token: string }) => revokeInviteLink(id, token),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.workspace.inviteLinks(variables.id),
            });
        },
    });
};

export const useRevokeAllInviteLinks = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: revokeAllInviteLinks,
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.workspace.inviteLinks(id),
            });
        },
    });
};

// === Join by link ===

export const joinByLink = async (token: string): Promise<JoinByLinkResponse> => {
    return await api.post("/workspaces/join-by-link", { token });
};

export const useJoinByLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: joinByLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.workspace.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.spaces() });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.projects() });
        },
    });
};

// === Workspace participants ===

export type ParticipantsParams = {
    page?: number;
    limit?: number;
    search?: string;
    project_id?: number;
    date_from?: string;
    date_to?: string;
};

export const getWorkspaceParticipants = async (
    workspaceId: number,
    params?: ParticipantsParams,
): Promise<WorkspaceParticipantListResponse> => {
    return await api.get(`/workspaces/${workspaceId}/participants`, { params });
};

export const useWorkspaceParticipants = (workspaceId: number, params?: ParticipantsParams) => {
    return useQuery({
        queryKey: queryKeys.workspace.participants(workspaceId, params),
        queryFn: () => getWorkspaceParticipants(workspaceId, params),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!workspaceId,
    });
};

export const removeWorkspaceParticipant = async (
    workspaceId: number,
    userId: number,
): Promise<void> => {
    return await api.delete(`/workspaces/${workspaceId}/participants/${userId}`);
};

export const useRemoveWorkspaceParticipant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ workspaceId, userId }: { workspaceId: number; userId: number }) =>
            removeWorkspaceParticipant(workspaceId, userId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.workspace.participants(variables.workspaceId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.workspace.resumes(variables.workspaceId),
            });
        },
    });
};

// === Workspace resumes ===

export const getWorkspaceResumes = async (
    workspaceId: number,
): Promise<WorkspaceResumeListResponse> => {
    return await api.get(`/workspaces/${workspaceId}/resumes`);
};

export const useWorkspaceResumes = (workspaceId: number) => {
    return useQuery({
        queryKey: queryKeys.workspace.resumes(workspaceId),
        queryFn: () => getWorkspaceResumes(workspaceId),
        enabled: !!workspaceId,
    });
};
