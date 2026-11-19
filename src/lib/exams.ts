import { useQuery, type QueryClient } from "@tanstack/react-query";
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
    QueueItem,
    ProjectTypeQuestions,
    QuestionTemplate,
} from "@/types/exam";
import { isAxiosError } from "axios";

type QueueMutation = {
    item: QueueItem;
    queue_revision: number;
    server_now: string;
};

const pageSize = 100;

async function fetchAllPages<T, Page extends { items: T[]; has_more: boolean }>(
    fetchPage: (offset: number) => Promise<Page>,
): Promise<Page> {
    const first = await fetchPage(0);
    if (!first.has_more) return first;

    const items = [...first.items];
    let hasMore: boolean = first.has_more;
    while (hasMore) {
        const page = await fetchPage(items.length);
        if (!page.items.length) break;
        items.push(...page.items);
        hasMore = page.has_more;
    }
    return { ...first, items, has_more: hasMore };
}

const examPath = (workspaceId: number | string, examId?: number | string) =>
    `/workspaces/${workspaceId}/exams${examId === undefined ? "" : `/${examId}`}`;

const attemptPath = (workspaceId: number | string, examId: number | string) =>
    `${examPath(workspaceId, examId)}/attempts`;

const queuePath = (workspaceId: number | string, examId: number | string) =>
    `${examPath(workspaceId, examId)}/queue`;

export const getExamErrorCode = (error: unknown): string | null => {
    if (!isAxiosError<{ detail?: { code?: string } | string }>(error)) return null;
    const response = error.response;
    const detail = response?.data?.detail;
    return detail && typeof detail === "object" && typeof detail.code === "string"
        ? detail.code
        : null;
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
        questions_locked:
            "По этому типу проектов уже начинали выставлять оценки на экзамене. Критерии закреплены, чтобы сохранить правила, по которым оценивали команды.",
        settings_version_conflict:
            "Настройки уже изменились. Обновите страницу и повторите действие.",
        slot_schedule_closed: "Добавлять слоты нельзя: время начала экзамена уже наступило.",
        slot_overlap: "Слоты пересекаются. Укажите непересекающиеся интервалы.",
        slot_before_exam: "Слот не может начинаться раньше начала экзамена.",
        slot_schedule_locked: "Расписание слотов уже заблокировано после назначения команд.",
        registration_not_active:
            "Нельзя изменить команду на этом слоте: регистрация команды неактивна. Проверьте статус команды или регистрации.",
        defense_already_started: "Защита команды уже началась. Изменить запись или явку нельзя.",
        registration_version_conflict:
            "Запись команды изменилась. Повторите действие после обновления списка.",
        registration_not_queued: "Команда уже вне очереди.",
        queue_position_out_of_range:
            "Очередь изменилась. Проверьте порядок команд и повторите действие.",
        another_defense_active: "Сначала завершите текущую защиту.",
        attempt_version_conflict:
            "Состояние защиты изменилось. Обновите страницу и повторите действие.",
        attempt_not_postponed: "Эту защиту нельзя возобновить из текущего состояния.",
        attempt_paused: "Сначала снимите защиту с паузы.",
        attempt_postponed: "Эта защита отложена.",
        queue_position_conflict:
            "Это место в очереди занято. Обновите очередь и повторите действие.",
        slot_schedule_conflict: "Начало экзамена должно быть раньше первого сохранённого слота.",
        attempt_running: "Сейчас уже идёт защита.",
        attempt_finished: "Эта защита уже завершена.",
        questions_not_ready: "Нельзя опубликовать: вопросы экзамена не готовы.",
        published_schedule_locked:
            "Для опубликованного экзамена дату начала и типы проектов менять нельзя.",
    };
    return code && Object.prototype.hasOwnProperty.call(messages, code) ? messages[code] : null;
};

export type CreateExamInput = ExamConfiguration;
export type ReplaceExamSettingsInput = {
    expected_version: number;
    reason: string;
    configuration: ExamConfiguration;
};

export const examApi = {
    list: (workspaceId: number, status?: "draft" | "published") =>
        fetchAllPages((offset) =>
            api.get<ExamListResponse>(examPath(workspaceId), {
                params: { status, limit: pageSize, offset },
            }),
        ),
    get: (workspaceId: number, examId: number) => api.get<Exam>(examPath(workspaceId, examId)),
    create: (workspaceId: number, data: CreateExamInput) =>
        api.post<Exam>(examPath(workspaceId), data),
    replaceSettings: (workspaceId: number, examId: number, data: ReplaceExamSettingsInput) =>
        api.put<Exam>(`${examPath(workspaceId, examId)}/settings`, data),
    publish: (workspaceId: number, examId: number, expected_version: number) =>
        api.post<Exam>(`${examPath(workspaceId, examId)}/publish`, { expected_version }),
    settings: (workspaceId: number, examId: number) =>
        fetchAllPages((offset) =>
            api.get<ExamSettingsHistoryResponse>(`${examPath(workspaceId, examId)}/settings`, {
                params: { limit: pageSize, offset },
            }),
        ),
    slots: (workspaceId: number, examId: number) =>
        fetchAllPages((offset) =>
            api.get<{ items: ExamSlot[]; has_more: boolean }>(
                `${examPath(workspaceId, examId)}/slots`,
                {
                    params: { limit: pageSize, offset },
                },
            ),
        ),
    addSlots: (
        workspaceId: number,
        examId: number,
        slots: { starts_at: string; ends_at: string }[],
    ) => api.post<ExamSlot[]>(`${examPath(workspaceId, examId)}/slots`, { slots }),
    registrations: (workspaceId: number, examId: number, self = false) =>
        fetchAllPages((offset) =>
            api.get<RegistrationListResponse>(
                `${examPath(workspaceId, examId)}/registrations${self ? "/self" : ""}`,
                { params: { limit: pageSize, offset } },
            ),
        ),
    register: (
        workspaceId: number,
        examId: number,
        data: { project_id: number; slot_id?: number | null },
        self = false,
    ) =>
        api.post<Registration>(
            `${examPath(workspaceId, examId)}/registrations${self ? "/self" : ""}`,
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
            `${examPath(workspaceId, examId)}/registrations/${registrationId}${self ? "/self-cancel" : "/cancel"}`,
            { expected_version, reason },
        ),
    moveRegistration: (
        workspaceId: number,
        examId: number,
        registration: Pick<Registration, "id" | "version">,
        targetSlotId: number,
    ) =>
        api.post<{ source: Registration; target: Registration }>(
            `${examPath(workspaceId, examId)}/registrations/${registration.id}/move`,
            {
                expected_version: registration.version,
                target_exam_id: examId,
                target_slot_id: targetSlotId,
                reason: "Перенос команды в другой слот",
            },
        ),
    queue: (workspaceId: number, examId: number) =>
        api.get<ExamQueue>(queuePath(workspaceId, examId)),
    place: (
        workspaceId: number,
        examId: number,
        registrationId: number,
        expected_version: number,
        position?: number,
    ) =>
        api.post<QueueMutation>(`${queuePath(workspaceId, examId)}/${registrationId}/place`, {
            expected_version,
            position,
        }),
    noShow: (
        workspaceId: number,
        examId: number,
        registrationId: number,
        expected_version: number,
        reason: string,
    ) =>
        api.post<QueueMutation>(`${queuePath(workspaceId, examId)}/${registrationId}/no-show`, {
            expected_version,
            reason,
        }),
    currentAttempt: (workspaceId: number, examId: number) =>
        api.get<{ attempt: Attempt | null }>(`${attemptPath(workspaceId, examId)}/current`),
    startAttempt: (
        workspaceId: number,
        examId: number,
        registration_id: number,
        expected_version: number,
    ) => api.post<Attempt>(attemptPath(workspaceId, examId), { registration_id, expected_version }),
    commandAttempt: (
        workspaceId: number,
        examId: number,
        attemptId: number,
        action: "questions" | "pause" | "resume" | "finish" | "postpone" | "restart",
        expected_version: number,
        reason?: string,
    ) =>
        api.post<Attempt>(`${attemptPath(workspaceId, examId)}/${attemptId}/${action}`, {
            expected_version,
            ...(reason ? { reason } : {}),
        }),
};

export const questionApi = {
    get: (workspaceId: number, typeId: number) =>
        api.get<ProjectTypeQuestions>(
            `/workspaces/${workspaceId}/project-types/${typeId}/questions`,
        ),
    replace: (workspaceId: number, typeId: number, questions: ProjectTypeQuestions["questions"]) =>
        api.put<ProjectTypeQuestions>(
            `/workspaces/${workspaceId}/project-types/${typeId}/questions`,
            {
                questions: questions.map(({ id, position: _position, ...question }) => ({
                    ...(id > 0 ? { id } : {}),
                    ...question,
                    description: question.description?.trim() || null,
                })),
            },
        ),
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

export const useExamSlots = (workspaceId: number, examId: number, enabled = true) =>
    useQuery({
        queryKey: queryKeys.exams.slots(workspaceId, examId),
        queryFn: () => examApi.slots(workspaceId, examId),
        enabled: enabled && workspaceId > 0 && examId > 0,
    });

export const useExamRegistrations = (workspaceId: number, examId: number, self = false, enabled = true) =>
    useQuery({
        queryKey: queryKeys.exams.registrations(workspaceId, examId, self),
        queryFn: () => examApi.registrations(workspaceId, examId, self),
        enabled: enabled && workspaceId > 0 && examId > 0,
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

export const invalidateExam = async (client: QueryClient, workspaceId: number, examId: number) => {
    await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.exams.list(workspaceId).slice(0, 3) }),
        client.invalidateQueries({ queryKey: queryKeys.exams.detail(workspaceId, examId) }),
        client.invalidateQueries({ queryKey: queryKeys.exams.settings(workspaceId, examId) }),
        client.invalidateQueries({ queryKey: queryKeys.exams.slots(workspaceId, examId) }),
        client.invalidateQueries({
            queryKey: queryKeys.exams.registrations(workspaceId, examId).slice(0, 4),
        }),
        client.invalidateQueries({ queryKey: queryKeys.exams.queue(workspaceId, examId) }),
        client.invalidateQueries({ queryKey: queryKeys.exams.currentAttempt(workspaceId, examId) }),
    ]);
};
