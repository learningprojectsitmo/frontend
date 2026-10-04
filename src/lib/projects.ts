import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
    type BackendProjectType,
    type ProjectFullResponse,
    type ProjectListResponse,
    type MyProjectListResponse,
    type ProjectFilterFacetsResponse,
    type ProjectUpdateInput,
} from "@/types/api";
import { queryKeys, type ProjectsListParams } from "./query-keys";

/** Ключи строятся через `as const`, поэтому элемент — readonly-кортеж. */
type QueryKeyLike = readonly unknown[];

export const invalidateProjectImpact = (
    queryClient: QueryClient,
    projectId: string | number,
    workspaceId?: number | null,
): void => {
    const keys: QueryKeyLike[] = [
        queryKeys.project.detail(projectId),
        queryKeys.project.lists(),
        queryKeys.project.recent(),
        queryKeys.project.byIds(),
        queryKeys.profile.responses(),
        queryKeys.profile.invitations(),
        queryKeys.profile.projects(),
        queryKeys.profile.createdProjects(),
        queryKeys.specification.detail(projectId),
        // Список откликов/приглашений лежит под ключом с параметрами фильтра,
        // поэтому инвалидируем по корню — TanStack матчит ключи по префиксу.
        queryKeys.responses.root(),
    ];
    if (workspaceId) {
        keys.push(queryKeys.workspace.participants(workspaceId));
        keys.push(queryKeys.workspace.resumes(workspaceId));
        // Список приглашения хранится по паре (пространство, проект): после
        // отправки приглашения кандидат получает reason "pending" и кнопка
        // должна погаснуть без перезагрузки страницы.
        keys.push(["workspaces", workspaceId, "invite-candidates"]);
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

export const getProject = async (id: string): Promise<ProjectFullResponse> => {
    return await api.get(`/projects/${id}`);
};

export const useProject = (id: string) => {
    return useQuery({
        queryKey: queryKeys.project.detail(id),
        queryFn: () => getProject(id),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!id,
    });
};

export const getProjectsList = async (
    workspaceId: string,
    params?: ProjectsListParams,
): Promise<ProjectListResponse> => {
    return await api.get("/projects/", { params: { workspace_id: workspaceId, ...params } });
};

export const useProjectsList = (workspaceId: string, params?: ProjectsListParams) => {
    return useQuery({
        queryKey: queryKeys.project.list(workspaceId, params),
        queryFn: () => getProjectsList(workspaceId, params),
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: "always",
        enabled: !!workspaceId,
        retry: 3,
    });
};

export const getProjectFilters = async (
    workspaceId: string | number,
): Promise<ProjectFilterFacetsResponse> => {
    return await api.get("/projects/filters", { params: { workspace_id: workspaceId } });
};

export const useProjectFilters = (workspaceId: string | number) => {
    return useQuery({
        queryKey: queryKeys.project.filters(workspaceId),
        queryFn: () => getProjectFilters(workspaceId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!workspaceId,
    });
};

export const updateProject = async ({
    id,
    data,
}: {
    id: string;
    data: ProjectUpdateInput;
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

/**
 * Действия со стороны кандидата: подтвердить вступление после принятия
 * отклика, принять или отклонить присланное приглашение.
 *
 * Эти эндпоинты адресуются по id записи и не требуют project_id, поэтому
 * входных данных здесь на одно поле меньше, чем у `ResponseActionInput`.
 */
export type ResponseSelfActionInput = {
    responseId: number;
    projectId: number;
    workspaceId?: number | null;
};

const useSelfResponseAction = (
    mutationFn: (variables: ResponseSelfActionInput) => Promise<{ message: string }>,
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (_data, variables) => {
            invalidateProjectImpact(queryClient, variables.projectId, variables.workspaceId);
        },
    });
};

export const useConfirmJoinResponse = () =>
    useSelfResponseAction(({ responseId }) => api.patch(`/responses/${responseId}/confirm-join`));

export const useAcceptInvitation = () =>
    useSelfResponseAction(({ responseId }) => api.patch(`/invitations/${responseId}/accept`));

export const useRejectInvitation = () =>
    useSelfResponseAction(({ responseId }) => api.patch(`/invitations/${responseId}/reject`));

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
    data: {
        name: string;
        order: number;
        requires_approval?: boolean;
        visible_to_participants?: boolean;
        duration_days?: number | null;
    },
): Promise<BackendProjectType> => {
    return await api.post(`/project-types/${typeId}/stages`, data);
};

export const updateProjectStage = async (
    typeId: number,
    stageId: number,
    data: {
        name?: string;
        order?: number;
        requires_approval?: boolean;
        visible_to_participants?: boolean;
        duration_days?: number | null;
    },
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
        mutationFn: ({
            typeId,
            data,
        }: {
            typeId: number;
            data: { name?: string; description?: string | null };
        }) => updateProjectType(typeId, data),
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

type ProjectStageCreateInput = {
    name: string;
    order: number;
    requires_approval?: boolean;
    visible_to_participants?: boolean;
    duration_days?: number | null;
};

type ProjectStageUpdateInput = {
    name?: string;
    order?: number;
    requires_approval?: boolean;
    visible_to_participants?: boolean;
    duration_days?: number | null;
};

export const useCreateProjectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ typeId, data }: { typeId: number; data: ProjectStageCreateInput }) =>
            createProjectStage(typeId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

export const useUpdateProjectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            typeId,
            stageId,
            data,
        }: {
            typeId: number;
            stageId: number;
            data: ProjectStageUpdateInput;
        }) => updateProjectStage(typeId, stageId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTypes.all() }),
    });
};

export const useDeleteProjectStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ typeId, stageId }: { typeId: number; stageId: number }) =>
            deleteProjectStage(typeId, stageId),
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

export type AllResponsesParams = {
    type?: "all" | "response" | "invitation";
    status?: string | null;
    workspaceId?: number | null;
    projectId?: number | null;
    search?: string | null;
    page?: number;
    limit?: number;
};

export const useAllResponses = (params: AllResponsesParams = {}) => {
    return useQuery({
        queryKey: queryKeys.responses.all(params as Record<string, unknown>),
        queryFn: async () => {
            const { api } = await import("./api-client");
            type ResponseListResponseApi = {
                items: Array<{
                    id: number;
                    project_id: number;
                    project_name: string;
                    workspace_id: number | null;
                    workspace_name: string | null;
                    user_id: number;
                    name: string;
                    respondent_email: string | null;
                    inviter_name: string | null;
                    vacancy_id: number | null;
                    role: string;
                    resume_url: string;
                    response_date: string;
                    type: string;
                    status: string;
                    allow_multi_project_participation: boolean;
                    busy_in_other_project: boolean;
                    created_at: string | null;
                    updated_at: string | null;
                }>;
                total: number;
                page: number;
                limit: number;
                total_pages: number;
            };
            // Слеш обязателен. Роут на бэкенде объявлен как `@response_router.get("/")`,
            // поэтому запрос без него уходит в 307-редирект, а браузер при
            // следовании за ним отбрасывает заголовок Authorization — и
            // `/responses/` отвечает 401 вместо данных.
            return await api.get<ResponseListResponseApi>("/responses/", {
                params: {
                    // "all" — сентинел UI, а не значение из БД. Бэкенд применяет
                    // `Response.type == type` только для непустого параметра,
                    // поэтому отправка "all" отсекала бы вообще все записи
                    // (в БД только "response"/"invitation"). "Все" = не слать
                    // параметр вовсе.
                    type: params.type && params.type !== "all" ? params.type : undefined,
                    status: params.status ?? undefined,
                    workspace_id: params.workspaceId ?? undefined,
                    project_id: params.projectId ?? undefined,
                    search: params.search ?? undefined,
                    page: params.page ?? 1,
                    limit: params.limit ?? 50,
                },
            });
        },
        // При смене фильтра показываем прошлые данные, а не «Данных не найдено»:
        // таблица не мигает пустотой, пока летит новый запрос.
        placeholderData: (prev) => prev,
    });
};
