import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type Notification,
    type SpacesListParams,
    type SpacesListResponce,
    type CreateWorkspaceInput,
    type SpaceSettingsInput,
    type WorkSpaceFull,
    type InviteLinkResponse,
    type InviteLinkCreate,
    type JoinByLinkResponse,
} from "@/types/api";

export const getSuggestions = async (search: string): Promise<string[]> => {
    return await api.get("/app/suggestions", { params: { search } });
};

export const getSpacesList = async (params?: SpacesListParams): Promise<SpacesListResponce> => {
    return await api.get("/workspaces/menu", { params });
};

export const useSpacesList = (params?: SpacesListParams) => {
    return useQuery({
        // params может содержать { page: 1, limit: 10 } и т.д.
        queryKey: ["workspaces", "list", params],
        queryFn: () => getSpacesList(params),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};

export const getNotificationsList = async (): Promise<Notification[]> => {
    return await api.get("/app/notifications");
};

export const useNotificationsList = () => {
    return useQuery({
        queryKey: ["notifications", "list"],
        queryFn: getNotificationsList,
        staleTime: 5 * 60 * 1000, // 10 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
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
            queryClient.invalidateQueries({ queryKey: ["workspaces", "list"] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces", "list"] });
        },
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
            queryClient.invalidateQueries({ queryKey: ["workspaces", "list"] });
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces", "list"] });
        },
    });
};

// === Invite link ===

export const getInviteLink = async (workspaceId: number): Promise<InviteLinkResponse> => {
    return await api.get(`/workspaces/${workspaceId}/invite-link`);
};

export const createInviteLink = async (
    workspaceId: number,
    data?: InviteLinkCreate,
): Promise<InviteLinkResponse> => {
    return await api.post(`/workspaces/${workspaceId}/invite-link`, data ?? {});
};

export const revokeInviteLink = async (workspaceId: number): Promise<void> => {
    return await api.delete(`/workspaces/${workspaceId}/invite-link`);
};

export const useInviteLink = (workspaceId: number) => {
    return useQuery({
        queryKey: ["workspaces", workspaceId, "invite-link"],
        queryFn: () => getInviteLink(workspaceId),
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
};

export const useCreateInviteLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: InviteLinkCreate }) =>
            createInviteLink(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["workspaces", variables.id, "invite-link"],
            });
        },
    });
};

export const useRevokeInviteLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: revokeInviteLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
    });
};

// === Join by link ===

export const joinByLink = async (token: string): Promise<JoinByLinkResponse> => {
    return await api.post("/workspaces/join-by-link", { token });
};

export const useJoinByLink = () => {
    return useMutation({
        mutationFn: joinByLink,
    });
};
