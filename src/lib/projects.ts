import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type ProjectFullResponse,
    type ProjectListResponse,
    type MyProjectListResponse,
} from "@/types/api";

export type CreateProjectInput = {
    name: string;
    theme?: string | null;
    description?: string | null;
    workspace_id?: number | null;
};

export const createProject = async (data: CreateProjectInput): Promise<ProjectFullResponse> => {
    return await api.post("/projects/", data);
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProject,
        onSuccess: (_data, variables) => {
            if (variables.workspace_id) {
                queryClient.invalidateQueries({
                    queryKey: ["projects", "list", String(variables.workspace_id)],
                });
            }
            queryClient.invalidateQueries({ queryKey: ["projects", "recent"] });
        },
    });
};

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

export const deleteProject = async (projectId: number): Promise<{ message: string }> => {
    return await api.delete(`/projects/${projectId}`);
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProject,
        onSuccess: (_data, projectId: number) => {
            queryClient.invalidateQueries({ queryKey: ["project", String(projectId)] });
            queryClient.invalidateQueries({ queryKey: ["projects", "recent"] });
            queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
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

export const applyForProject = async ({
    projectId,
    vacancyId,
    resumeId,
}: {
    projectId: number;
    vacancyId?: number | null;
    resumeId?: number | null;
}): Promise<{ message: string }> => {
    return await api.post(`/projects/${projectId}/apply`, {
        vacancy_id: vacancyId ?? null,
        resume_id: resumeId ?? null,
    });
};

export const useApplyForProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: applyForProject,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", String(variables.projectId)] });
        },
    });
};

export const inviteToProject = async ({
    projectId,
    userId,
    vacancyId,
    resumeId,
}: {
    projectId: number;
    userId: number;
    vacancyId?: number | null;
    resumeId?: number | null;
}): Promise<{ message: string }> => {
    return await api.post(`/projects/${projectId}/invite`, {
        user_id: userId,
        vacancy_id: vacancyId ?? null,
        resume_id: resumeId ?? null,
    });
};

export const useInviteToProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: inviteToProject,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", String(variables.projectId)] });
        },
    });
};

export const acceptResponse = async ({
    projectId,
    responseId,
}: {
    projectId: number;
    responseId: number;
}): Promise<{ message: string }> => {
    return await api.put(`/projects/${projectId}/responses/${responseId}/accept`);
};

export const useAcceptResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: acceptResponse,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", String(variables.projectId)] });
        },
    });
};

export const rejectResponse = async ({
    projectId,
    responseId,
}: {
    projectId: number;
    responseId: number;
}): Promise<{ message: string }> => {
    return await api.put(`/projects/${projectId}/responses/${responseId}/reject`);
};

export const useRejectResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rejectResponse,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["project", String(variables.projectId)] });
        },
    });
};
