import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
    Attempt,
    Exam,
    ExamConfiguration,
    ExamListResponse,
    ExamQueue,
    ExamSettingsHistoryResponse,
    ExamSlot,
    Registration,
    RegistrationListResponse,
    ProjectTypeQuestions,
    QuestionTemplate,
} from "@/types/exam";
import type { AxiosError } from "axios";

const examPath = (workspaceId: number | string, examId?: number | string) =>
    `/workspaces/${workspaceId}/exams${examId === undefined ? "" : `/${examId}`}`;

const registrationPath = (workspaceId: number | string, examId: number | string) =>
    `${examPath(workspaceId, examId)}`;

const attemptPath = (workspaceId: number | string, examId: number | string) =>
    `${examPath(workspaceId, examId)}/attempts`;

const queuePath = (workspaceId: number | string, examId: number | string) =>
    `${examPath(workspaceId, examId)}/queue`;

export const getExamErrorCode = (error: unknown): string | null => {
    const response = (error as AxiosError<{ detail?: { code?: string } | string }>).response;
    const detail = response?.data?.detail;
    return typeof detail === "object" && detail !== null ? detail.code ?? null : null;
};

export const getExamErrorMessage = (error: unknown): string | null => {
    const code = getExamErrorCode(error);
    const messages: Record<string, string> = {
        exam_not_published: "Нельзя назначить проект: сначала опубликуйте экзамен.",
        registration_closed: "Запись на этот экзамен сейчас закрыта.",
        project_type_not_allowed: "Тип выбранного проекта не включён в этот экзамен.",
        project_already_registered: "Этот проект уже записан на экзамен.",
        slot_required: "Для записи нужно выбрать свободный слот.",
        slot_unavailable: "Выбранный слот уже занят. Обновите список и выберите другой.",
        questions_locked: "Вопросы уже заблокированы после начала оценки и больше не редактируются.",
        settings_version_conflict: "Настройки уже изменились. Обновите страницу и повторите действие.",
    };
    return code ? messages[code] ?? null : null;
};

export type CreateExamInput = ExamConfiguration;
export type ReplaceExamSettingsInput = {
    expected_version: number;
    reason: string;
    configuration: ExamConfiguration;
};

export const examApi = {
    list: (workspaceId: number, status?: "draft" | "published") =>
        api.get<ExamListResponse>(examPath(workspaceId), {
            params: { status, limit: 100, offset: 0 },
        }),
    get: (workspaceId: number, examId: number) => api.get<Exam>(examPath(workspaceId, examId)),
    create: (workspaceId: number, data: CreateExamInput) =>
        api.post<Exam>(examPath(workspaceId), data),
    replaceSettings: (workspaceId: number, examId: number, data: ReplaceExamSettingsInput) =>
        api.put<Exam>(`${examPath(workspaceId, examId)}/settings`, data),
    publish: (workspaceId: number, examId: number, expected_version: number) =>
        api.post<Exam>(`${examPath(workspaceId, examId)}/publish`, { expected_version }),
    settings: (workspaceId: number, examId: number) =>
        api.get<ExamSettingsHistoryResponse>(`${examPath(workspaceId, examId)}/settings`, {
            params: { limit: 100, offset: 0 },
        }),
    slots: (workspaceId: number, examId: number) =>
        api.get<{ items: ExamSlot[] }>(`${registrationPath(workspaceId, examId)}/slots`, {
            params: { limit: 100, offset: 0 },
        }),
    addSlots: (workspaceId: number, examId: number, slots: { starts_at: string; ends_at: string }[]) =>
        api.post<ExamSlot[]>(`${registrationPath(workspaceId, examId)}/slots`, { slots }),
    registrations: (workspaceId: number, examId: number, self = false) =>
        api.get<RegistrationListResponse>(
            `${registrationPath(workspaceId, examId)}/registrations${self ? "/self" : ""}`,
            { params: { limit: 100, offset: 0 } },
        ),
    register: (workspaceId: number, examId: number, data: { project_id: number; slot_id?: number | null }, self = false) =>
        api.post<Registration>(
            `${registrationPath(workspaceId, examId)}/registrations${self ? "/self" : ""}`,
            data,
        ),
    cancelRegistration: (
        workspaceId: number,
        examId: number,
        registrationId: number,
        expected_version: number,
        reason: string,
        self = false,
    ) =>
        api.post<Registration>(
            `${registrationPath(workspaceId, examId)}/registrations/${registrationId}${self ? "/self-cancel" : "/cancel"}`,
            { expected_version, reason },
        ),
    queue: (workspaceId: number, examId: number) =>
        api.get<ExamQueue>(queuePath(workspaceId, examId)),
    place: (workspaceId: number, examId: number, registrationId: number, expected_version: number, position?: number) =>
        api.post(`${queuePath(workspaceId, examId)}/${registrationId}/place`, {
            expected_version,
            position,
        }),
    next: (workspaceId: number, examId: number, registrationId: number, expected_version: number) =>
        api.post(`${queuePath(workspaceId, examId)}/${registrationId}/next`, { expected_version }),
    postpone: (workspaceId: number, examId: number, registrationId: number, expected_version: number, reason: string) =>
        api.post(`${queuePath(workspaceId, examId)}/${registrationId}/postpone`, { expected_version, reason }),
    noShow: (workspaceId: number, examId: number, registrationId: number, expected_version: number, reason: string) =>
        api.post(`${queuePath(workspaceId, examId)}/${registrationId}/no-show`, { expected_version, reason }),
    currentAttempt: (workspaceId: number, examId: number) =>
        api.get<{ attempt: Attempt | null }>(`${attemptPath(workspaceId, examId)}/current`),
    startAttempt: (workspaceId: number, examId: number, registration_id: number, expected_version: number) =>
        api.post<Attempt>(attemptPath(workspaceId, examId), { registration_id, expected_version }),
    commandAttempt: (workspaceId: number, examId: number, attemptId: number, action: "questions" | "pause" | "resume" | "finish", expected_version: number, reason?: string) =>
        api.post<Attempt>(`${attemptPath(workspaceId, examId)}/${attemptId}/${action}`, {
            expected_version,
            ...(reason ? { reason } : {}),
        }),
    postponeAttempt: (workspaceId: number, examId: number, attemptId: number, expected_version: number, reason: string) =>
        api.post<Attempt>(`${attemptPath(workspaceId, examId)}/${attemptId}/postpone`, { expected_version, reason }),
    restartAttempt: (workspaceId: number, examId: number, attemptId: number, expected_version: number, reason?: string) =>
        api.post<Attempt>(`${attemptPath(workspaceId, examId)}/${attemptId}/restart`, {
            expected_version,
            ...(reason ? { reason } : {}),
        }),
};

export const questionApi = {
    get: (workspaceId: number, typeId: number) =>
        api.get<ProjectTypeQuestions>(`/workspaces/${workspaceId}/project-types/${typeId}/questions`),
    replace: (workspaceId: number, typeId: number, questions: ProjectTypeQuestions["questions"]) =>
        api.put<ProjectTypeQuestions>(`/workspaces/${workspaceId}/project-types/${typeId}/questions`, {
            questions: questions.map(({ id, position: _position, ...question }) => ({
                ...(id > 0 ? { id } : {}),
                ...question,
            })),
        }),
    templates: () => api.get<QuestionTemplate[]>("/assessment/question-templates"),
    applyTemplate: (workspaceId: number, typeId: number, template_code: QuestionTemplate["code"]) =>
        api.post<ProjectTypeQuestions>(
            `/workspaces/${workspaceId}/project-types/${typeId}/questions/apply-template`,
            { template_code },
        ),
};

export const useProjectTypeQuestions = (workspaceId: number, typeId: number, enabled = true) =>
    useQuery({
        queryKey: queryKeys.projectTypeQuestions.detail(workspaceId, typeId),
        queryFn: () => questionApi.get(workspaceId, typeId),
        enabled: enabled && workspaceId > 0 && typeId > 0,
    });

export const useExams = (workspaceId: number, status?: "draft" | "published") =>
    useQuery({
        queryKey: queryKeys.exams.list(workspaceId, status),
        queryFn: () => examApi.list(workspaceId, status),
        enabled: workspaceId > 0,
    });

export const useExam = (workspaceId: number, examId: number) =>
    useQuery({
        queryKey: queryKeys.exams.detail(workspaceId, examId),
        queryFn: () => examApi.get(workspaceId, examId),
        enabled: workspaceId > 0 && examId > 0,
    });

export const useExamSlots = (workspaceId: number, examId: number) =>
    useQuery({
        queryKey: queryKeys.exams.slots(workspaceId, examId),
        queryFn: () => examApi.slots(workspaceId, examId),
        enabled: workspaceId > 0 && examId > 0,
    });

export const useExamRegistrations = (workspaceId: number, examId: number, self = false) =>
    useQuery({
        queryKey: queryKeys.exams.registrations(workspaceId, examId, self),
        queryFn: () => examApi.registrations(workspaceId, examId, self),
        enabled: workspaceId > 0 && examId > 0,
    });

export const useExamQueue = (workspaceId: number, examId: number, enabled = true) =>
    useQuery({
        queryKey: queryKeys.exams.queue(workspaceId, examId),
        queryFn: () => examApi.queue(workspaceId, examId),
        enabled: enabled && workspaceId > 0 && examId > 0,
        refetchInterval: 5000,
    });

export const useCurrentAttempt = (workspaceId: number, examId: number, enabled = true) =>
    useQuery({
        queryKey: queryKeys.exams.currentAttempt(workspaceId, examId),
        queryFn: () => examApi.currentAttempt(workspaceId, examId),
        enabled: enabled && workspaceId > 0 && examId > 0,
        refetchInterval: 5000,
    });

export const useExamMutation = <TVariables, TResult>(
    mutationFn: (variables: TVariables) => Promise<TResult>,
    invalidate: (client: ReturnType<typeof useQueryClient>, variables: TVariables) => void,
) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (_data, variables) => invalidate(queryClient, variables),
    });
};

export const invalidateExam = (client: ReturnType<typeof useQueryClient>, workspaceId: number, examId?: number) => {
    client.invalidateQueries({ queryKey: ["exams", "list", String(workspaceId)] });
    if (examId) {
        client.invalidateQueries({ queryKey: queryKeys.exams.detail(workspaceId, examId) });
        client.invalidateQueries({ queryKey: queryKeys.exams.slots(workspaceId, examId) });
        client.invalidateQueries({ queryKey: queryKeys.exams.registrations(workspaceId, examId) });
        client.invalidateQueries({ queryKey: queryKeys.exams.queue(workspaceId, examId) });
        client.invalidateQueries({ queryKey: queryKeys.exams.currentAttempt(workspaceId, examId) });
    }
};
