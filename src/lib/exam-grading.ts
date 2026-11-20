import { api } from "@/lib/api-client";
import { getExamErrorCode, isExamAccessDenied } from "@/lib/exams";
import type { ExamWeights, ProjectTypeQuestion } from "@/types/exam";

type Decimal = string | number;
type Role = keyof ExamWeights;
export type Answer = { question_id: number; score: number | null; comment: string | null };
type Draft = { answers: Answer[]; updated_at: string };
type Submission = { version: number; submitted_at: string; total: number; answers: Answer[] };
export type AssessmentForm = {
    attempt_id: number;
    window: { opened_at: string; closes_at: string; settings_version: number };
    assessor: { role: Role; weight: number; excluded: boolean };
    questions: ProjectTypeQuestion[];
    draft: Draft;
    submission: { version: number; submitted_at: string; has_unsubmitted_changes: boolean } | null;
};

type Snapshot = { max_score: Decimal; settings_version: number; sheet_max: number };
type Edition = {
    version: number; kind: "calculated" | "manual"; calculated_score: Decimal | null;
    final_score: Decimal; reason: string | null; decided_by: number; decided_at: string;
    published_at: string | null; snapshot: Snapshot;
};
type Result = {
    edition: Edition | null;
    preliminary: {
        score: Decimal | null; snapshot: Snapshot;
        roles: { role: Role; weight: number; sheets_count: number; average: Decimal | null; counted: boolean }[];
    } | null;
    outdated: boolean;
};
export type RegistryItem = {
    attempt_id: number; project_id: number; project_name: string; state: "undecided" | "accepted" | "published";
    current: (Omit<Edition, "snapshot" | "decided_by"> & { max_score: Decimal; decided_by_name: string }) | null;
    editions_count: number; previous_final_score: Decimal | null; settings_outdated: boolean;
};
type Participation = {
    state: "not_offered" | "open" | "closed";
    summary: { total: { admitted: number; submitted: number; not_submitted: number; excluded: number } };
    items: {
        user_id: number; name: string; role: Role; status: "excluded" | "submitted" | "not_submitted";
        exclusion_reason: "manager_of_defending_team" | "member_of_defending_team" | null;
        submission: Submission | null;
    }[];
};

const exam = (space: number, id: number) => `/workspaces/${space}/exams/${id}`;
const attempt = (space: number, id: number, attemptId: number) => `${exam(space, id)}/attempts/${attemptId}`;
export const gradingKey = (space: number, id: number) => ["exam-grading", space, id] as const;
export const examGradingApi = {
    form: (space: number, id: number, target: number) => api.get<AssessmentForm>(`${attempt(space, id, target)}/assessment`),
    draft: (space: number, id: number, target: number, answers: Answer[]) =>
        api.put<Draft>(`${attempt(space, id, target)}/assessment/draft`, { answers }),
    submit: (space: number, id: number, target: number) =>
        api.post<Submission>(`${attempt(space, id, target)}/assessment/submit`, {}),
    registry: async (space: number, id: number) => {
        const items: RegistryItem[] = [];
        while (true) {
            const page = await api.get<{ items: RegistryItem[]; has_more: boolean }>(`${exam(space, id)}/results`, {
                params: { offset: items.length, limit: 100 },
            });
            items.push(...page.items);
            if (!page.has_more || !page.items.length) return items;
        }
    },
    result: (space: number, id: number, target: number) => api.get<Result>(`${attempt(space, id, target)}/result`),
    editions: (space: number, id: number, target: number) => api.get<{ items: Edition[] }>(`${attempt(space, id, target)}/result/editions`),
    decide: (space: number, id: number, target: number, action: "accept" | "manual" | "publish",
        payload: { expected_version: number; reason?: string; final_score?: string }) =>
        api.post<Result>(`${attempt(space, id, target)}/result/${action}`, payload),
    participation: (space: number, id: number, target: number) => api.get<Participation>(`${attempt(space, id, target)}/participation`),
    csv: (space: number, id: number) => api.get<Blob>(`${exam(space, id)}/exports/csv`, { responseType: "blob" }),
};

export const roleTitles: Record<Role, string> = { teacher: "Комиссия", manager: "Магистранты", member: "Бакалавры" };

export function getGradingError(error: unknown) {
    if (isExamAccessDenied(error)) return "Действие недоступно для вашей роли или этого экзамена.";
    const messages: Record<string, string> = {
        assessment_window_closed: "Время оценивания истекло.",
        assessment_window_open: "Принять итог можно после закрытия оценивания.",
        audience_snapshot_unavailable: "Для этой защиты не сохранён список оценщиков.",
        incomplete_sheet: "Выберите балл по каждому критерию.",
        result_version_conflict: "Итог уже изменился. Проверьте новую редакцию.",
        no_calculation: "Нет учитываемых оценок. Можно ввести итог вручную.",
        final_score_out_of_range: "Балл выходит за допустимый диапазон.",
    };
    return messages[getExamErrorCode(error) ?? ""] ?? "Не удалось выполнить действие. Попробуйте ещё раз.";
}
