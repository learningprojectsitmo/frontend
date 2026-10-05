import type { BackendVacancy } from "@/types/api";

/** Роль в состоянии формы редактирования. */
export type EditableVacancy = {
    id: number | null;
    title: string;
    tasks: string[];
    count: number;
};

/** Отклик в том виде, в котором он приходит с бэкенда для подсчёта. */
type ResponseWithVacancy = {
    vacancy_id: number | null;
};

/**
 * Сколько откликов и приглашений висит на каждой роли.
 *
 * Считаем по `vacancy_id`, а не по названию: бэкенд тоже опирается на id, и
 * только по нему понимает, что роль занята.
 *
 * Учитываются все статусы — ровно так же, как в
 * `get_response_counts_by_vacancy_ids` на сервере. Если посчитать иначе,
 * форма пропустит проверку, а запрос упадёт с 422.
 */
export const countResponsesByVacancy = (
    replycants: readonly ResponseWithVacancy[] | null | undefined,
): Map<number, number> => {
    const counts = new Map<number, number>();
    for (const r of replycants ?? []) {
        if (r.vacancy_id === null) continue;
        counts.set(r.vacancy_id, (counts.get(r.vacancy_id) ?? 0) + 1);
    }
    return counts;
};

export type BlockedVacancy = {
    vacancy: BackendVacancy;
    responses: number;
};

/**
 * Роли, которые сняли в форме, но на которые кто-то уже откликнулся.
 *
 * Такое удаление бэкенд отклоняет: роль пропала бы из откликов, а её
 * `vacancy_id` обнулился бы. Список нужен, чтобы объяснить причину прямо в
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
