import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type ProjectFullResponse,
    type ProjectListResponse,
    type MyProjectListResponse,
} from "@/types/api";

export const getProject = async ({
    queryKey,
}: {
    queryKey: [string, string];
}): Promise<ProjectFullResponse> => {
    const [, id] = queryKey;
    return await api.get(`/projects/${id}`);
};

export const useProject = (id: string) => {
    return useQuery({
        queryKey: ["project", id],
        queryFn: getProject,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!id,
    });
};

export const getProjectsList = async (workspaceId: string): Promise<ProjectListResponse> => {
    return await api.get("/projects/", { params: { workspace_id: workspaceId } });
};

export const useProjectsList = (workspaceId: string) => {
    return useQuery({
        queryKey: ["projects", "list", workspaceId],
        queryFn: () => getProjectsList(workspaceId),
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: "always",
        refetchOnWindowFocus: false,
        enabled: !!workspaceId,
        retry: 3,
    });
};

export const updateProject = async ({
    id,
    data,
}: {
    id: string;
    data: Partial<ProjectFullResponse>;
}): Promise<ProjectFullResponse> => {
    return await api.put(`/projects/${id}`, data);
};

export const getRecentProjects = async (): Promise<MyProjectListResponse> => {
    return await api.get("/projects/my");
};

export const useRecentProjectsList = () => {
    return useQuery({
        queryKey: ["projects", "recent"],
        queryFn: getRecentProjects,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const getProjectsByIds = async (ids: number[]): Promise<MyProjectListResponse> => {
    const idsStr = ids.join(",");
    return await api.get("/projects/by_ids", { params: { ids: idsStr } });
};

export const useProjectsByIds = (ids: number[]) => {
    return useQuery({
        queryKey: ["projects", "by_ids", ids],
        queryFn: () => getProjectsByIds(ids),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: ids.length > 0,
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProject,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
        },
    });
};

export const removeParticipant = async ({
    projectId,
    userId,
}: {
    projectId: number;
    userId: number;
}): Promise<{ message: string }> => {
    return await api.delete(`/projects/${projectId}/participants/${userId}`);
};

export const useRemoveParticipant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: removeParticipant,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", String(variables.projectId)] });
        },
    });
};
