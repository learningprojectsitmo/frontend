import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
    type BackendProjectType,
    type ProjectFullResponse,
    type ProjectListResponse,
    type MyProjectListResponse,
} from "@/types/api";
import { queryKeys } from "./query-keys";

export const invalidateProjectImpact = (
    queryClient: QueryClient,
    projectId: string | number,
    workspaceId?: number | null,
): void => {
    const keys: readonly unknown[][] = [
        queryKeys.project.detail(projectId),
        queryKeys.project.lists(),
        queryKeys.project.recent(),
        queryKeys.project.byIds(),
        queryKeys.profile.responses(),
        queryKeys.profile.invitations(),
        queryKeys.profile.projects(),
        queryKeys.profile.createdProjects(),
    ];
    if (workspaceId) {
        keys.push(queryKeys.workspace.participants(workspaceId));
        keys.push(queryKeys.workspace.resumes(workspaceId));
    }
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
};

export type CreateProjectInput = {
    name: string;
    theme?: string | null;
    description?: string | null;
    workspace_id?: number | null;
    project_type_id?: number | null;
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
                    queryKey: queryKeys.project.list(variables.workspace_id),
                });
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.project.recent() });
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
        queryKey: queryKeys.project.detail(id),
        queryFn: getProject,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!id,
    });
};

export const getProjectsList = async (workspaceId: string): Promise<ProjectListResponse> => {
    return await api.get("/projects/", { params: { workspace_id: workspaceId } });
};

export const useProjectsList = (workspaceId: string) => {
    return useQuery({
        queryKey: queryKeys.project.list(workspaceId),
        queryFn: () => getProjectsList(workspaceId),
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: "always",
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
        queryKey: queryKeys.project.recent(),
        queryFn: getRecentProjects,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

export const getProjectsByIds = async (ids: number[]): Promise<MyProjectListResponse> => {
    const idsStr = ids.join(",");
    return await api.get("/projects/by_ids", { params: { ids: idsStr } });
};

export const useProjectsByIds = (ids: number[]) => {
    return useQuery({
        queryKey: queryKeys.project.byIds(ids),
        queryFn: () => getProjectsByIds(ids),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: ids.length > 0,
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProject,
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(
                queryClient,
                variables.id,
                variables.data.workspace_id ?? undefined,
            );
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
            invalidateProjectImpact(queryClient, projectId);
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

type RemoveParticipantParams = {
    projectId: number;
    userId: number;
};

export type RemoveParticipantInput = RemoveParticipantParams & {
    workspaceId?: number | null;
};

export const useRemoveParticipant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: RemoveParticipantInput) => removeParticipant(variables),
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(queryClient, variables.projectId, variables.workspaceId);
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

export type ApplyInput = {
    projectId: number;
    vacancyId?: number | null;
    resumeId?: number | null;
    workspaceId?: number | null;
};

export const useApplyForProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: ApplyInput) => applyForProject(variables),
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(queryClient, variables.projectId, variables.workspaceId);
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

export type InviteInput = {
    projectId: number;
    userId: number;
    vacancyId?: number | null;
    resumeId?: number | null;
    workspaceId?: number | null;
};

export const useInviteToProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: InviteInput) => inviteToProject(variables),
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(queryClient, variables.projectId, variables.workspaceId);
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

export type ResponseActionInput = {
    projectId: number;
    responseId: number;
    workspaceId?: number | null;
};

export const useAcceptResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: ResponseActionInput) => acceptResponse(variables),
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(queryClient, variables.projectId, variables.workspaceId);
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
        mutationFn: (variables: ResponseActionInput) => rejectResponse(variables),
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(queryClient, variables.projectId, variables.workspaceId);
        },
    });
};

// ====== Типы проектов и этапы ======

export const getProjectTypes = async (
    workspaceId?: number | null,
): Promise<BackendProjectType[]> => {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : "";
    return await api.get(`/project-types/${query}`);
};

export const useProjectTypes = (workspaceId?: number | null, enabled = true) => {
    return useQuery({
        queryKey: queryKeys.projectTypes.scoped(workspaceId),
        queryFn: () => getProjectTypes(workspaceId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled,
    });
};

export const createProjectType = async (data: {
    name: string;
    description?: string | null;
    workspace_id: number | null;
}): Promise<BackendProjectType> => {
    return await api.post("/project-types/", data);
};

export const updateProjectType = async (
    typeId: number,
    data: {
        name?: string;
        description?: string | null;
    },
) => {
    return await api.put(`/project-types/${typeId}`, data);
};

export const deleteProjectType = async (typeId: number) => {
    return await api.delete(`/project-types/${typeId}`);
};

export const createProjectStage = async (
    typeId: number,
    data: { name: string; order: number; requires_approval?: boolean },
): Promise<BackendProjectType> => {
    return await api.post(`/project-types/${typeId}/stages`, data);
};

export const updateProjectStage = async (
    typeId: number,
    stageId: number,
    data: { name?: string; order?: number; requires_approval?: boolean },
): Promise<BackendProjectType> => {
    return await api.put(`/project-types/${typeId}/stages/${stageId}`, data);
};

export const deleteProjectStage = async (typeId: number, stageId: number) => {
    return await api.delete(`/project-types/${typeId}/stages/${stageId}`);
};

const afterTypeMutation = (
    queryClient: ReturnType<typeof useQueryClient>,
    workspaceId: number | null,
) => {
    queryClient.invalidateQueries({
        queryKey: queryKeys.projectTypes.scoped(workspaceId),
    });
};

export const useCreateProjectType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProjectType,
        onSuccess: (_data, variables) => afterTypeMutation(queryClient, variables.workspace_id),
    });
};

export const useUpdateProjectType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProjectType,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

export const useDeleteProjectType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProjectType,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

export const useCreateProjectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProjectStage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

export const useUpdateProjectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProjectStage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

export const useDeleteProjectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProjectStage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

const afterStageMutation = (queryClient: ReturnType<typeof useQueryClient>, projectId: number) => {
    invalidateProjectImpact(queryClient, projectId);
    queryClient.invalidateQueries({ queryKey: queryKeys.stageHistory.detail(projectId) });
};

export const advanceStage = async (projectId: number): Promise<ProjectFullResponse> => {
    return await api.post(`/projects/stages/${projectId}/advance`);
};

export const approveStage = async (projectId: number): Promise<ProjectFullResponse> => {
    return await api.post(`/projects/stages/${projectId}/approve`);
};

export const rejectStage = async (
    projectId: number,
    comment?: string | null,
): Promise<ProjectFullResponse> => {
    return await api.post(`/projects/stages/${projectId}/reject`, {
        comment: comment ?? null,
    });
};

export const useAdvanceStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId }: { projectId: number }) => advanceStage(projectId),
        onSuccess: (_data, { projectId }) => afterStageMutation(queryClient, projectId),
    });
};

export const useApproveStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId }: { projectId: number }) => approveStage(projectId),
        onSuccess: (_data, { projectId }) => afterStageMutation(queryClient, projectId),
    });
};

export const useRejectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, comment }: { projectId: number; comment?: string | null }) =>
            rejectStage(projectId, comment),
        onSuccess: (_data, { projectId }) => afterStageMutation(queryClient, projectId),
    });
};
