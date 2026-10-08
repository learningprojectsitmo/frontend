import type { BackendVacancy } from "@/types/api";

/** Роль в состоянии формы редактирования. */
export type EditableVacancy = {
    id: number | null;
    title: string;
    tasks: string[];
    count: number;
};

/**
 * Статусы, из-за которых роль нельзя снять из проекта.
 *
 * Зеркалят `ACTIVE_RESPONSE_STATUSES` на бэкенде (там же считает
 * `get_response_counts_by_vacancy_ids`): решение по отклику ещё не принято
 * либо человек уже в команде. Отклонённые, отозванные и отменённые записи
 * не мешают — отказом роль и освобождают.
 */
export const ACTIVE_RESPONSE_STATUSES: ReadonlySet<string> = new Set([
    "pending",
    "accepted",
    "in_team",
]);

/** Отклик в том виде, в котором он приходит с бэкенда для подсчёта. */
type ResponseWithVacancy = {
    vacancy_id: number | null;
    /** Статус записи из `BackendReplycant.status`/`ResponseListItem.status`. */
    status: string;
};

/**
 * Сколько АКТИВНЫХ откликов и приглашений висит на каждой роли.
 *
 * Считаем по `vacancy_id`, а не по названию: бэкенд тоже опирается на id, и
 * только по нему понимает, что роль занята.
 *
 * Активные статусы — ровно те же, что в `get_response_counts_by_vacancy_ids`
 * на сервере. Если посчитать иначе, форма пропустит проверку, а запрос
 * упадёт с 422.
 */
export const countResponsesByVacancy = (
    replycants: readonly ResponseWithVacancy[] | null | undefined,
): Map<number, number> => {
    const counts = new Map<number, number>();
    for (const r of replycants ?? []) {
        if (r.vacancy_id === null) continue;
        if (!ACTIVE_RESPONSE_STATUSES.has(r.status)) continue;
        counts.set(r.vacancy_id, (counts.get(r.vacancy_id) ?? 0) + 1);
    }
    return counts;
};

export type BlockedVacancy = {
    vacancy: BackendVacancy;
    responses: number;
};

/**
 * Роли, которые сняли в форме, но на которых есть активные отклики.
 *
 * Такое снятие бэкенд отклоняет: роль осталась бы в откликах, а новая форма
 * её больше не показывает. Список нужен, чтобы объяснить причину прямо в
 * форме и предложить вернуть роль, а не гадать по общему «не удалось
 * сохранить».
 */
export const findBlockedVacancies = (
    vacancies: readonly BackendVacancy[] | null | undefined,
    editRoles: readonly EditableVacancy[],
    replycants: readonly ResponseWithVacancy[] | null | undefined,
): BlockedVacancy[] => {
    const counts = countResponsesByVacancy(replycants);
    const keptIds = new Set(editRoles.map((r) => r.id).filter((id): id is number => id !== null));
    return (vacancies ?? [])
        .filter((v) => !keptIds.has(v.id) && (counts.get(v.id) ?? 0) > 0)
        .map((v) => ({ vacancy: v, responses: counts.get(v.id) ?? 0 }));
};
