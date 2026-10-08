import { describe, expect, it } from "vitest";

import type { BackendVacancy } from "@/types/api";
import {
    countResponsesByVacancy,
    findBlockedVacancies,
    type EditableVacancy,
} from "./vacancy-sync";

const vacancy = (id: number, title: string): BackendVacancy => ({
    id,
    title,
    tasks: ["задача"],
    required_count: 1,
});

const kept = (id: number): EditableVacancy => ({
    id,
    title: `Роль ${id}`,
    tasks: ["задача"],
    count: 1,
});

/** Отклик для подсчёта: `vacancy_id` + статус (как в `BackendReplycant`). */
const response = (vacancyId: number | null, status = "pending") => ({
    vacancy_id: vacancyId,
    status,
});

describe("countResponsesByVacancy", () => {
    it("считает отклики по vacancy_id", () => {
        // given
        const replycants = [response(5), response(5), response(6)];

        // when
        const counts = countResponsesByVacancy(replycants);

        // then
        expect(counts.get(5)).toBe(2);
        expect(counts.get(6)).toBe(1);
    });

    it("игнорирует отклики без роли", () => {
        // given: отклик на весь проект, а не на конкретную роль
        const replycants = [response(null), response(null)];

        // when
        const counts = countResponsesByVacancy(replycants);

        // then
        expect(counts.size).toBe(0);
    });

    it("учитывает только активные статусы — как бэкенд", () => {
        // given: счёт обязан совпадать с `get_response_counts_by_vacancy_ids`
        const replycants = [
            response(5, "pending"),
            response(5, "accepted"),
            response(5, "in_team"),
            response(5, "rejected"),
            response(5, "withdrawn"),
            response(5, "cancelled"),
        ];

        // when
        const counts = countResponsesByVacancy(replycants);

        // then: три активных записи, отклонённая/отозванная/отменённая не мешают
        expect(counts.get(5)).toBe(3);
    });

    it("не считает роль свободной только из-за обработанных откликов", () => {
        // given: на роль остались одни отказы
        const replycants = [response(5, "rejected"), response(5, "withdrawn")];

        // when
        const counts = countResponsesByVacancy(replycants);

        // then
        expect(counts.get(5)).toBeUndefined();
    });

    it("не падает на пустом списке", () => {
        expect(countResponsesByVacancy([]).size).toBe(0);
        expect(countResponsesByVacancy(null).size).toBe(0);
        expect(countResponsesByVacancy(undefined).size).toBe(0);
    });
});

describe("findBlockedVacancies", () => {
    it("находит роль с активными откликами, снятую в форме", () => {
        // given
        const vacancies = [vacancy(5, "Backend"), vacancy(6, "QA")];
        const replycants = [response(6), response(6), response(6)];

        // when: роль 6 убрали, роль 5 оставили
        const blocked = findBlockedVacancies(vacancies, [kept(5)], replycants);

        // then
        expect(blocked).toHaveLength(1);
        expect(blocked[0].vacancy.title).toBe("QA");
        expect(blocked[0].responses).toBe(3);
    });

    it("не блокирует снятие роли, обработанной отказами", () => {
        // given: все отклики отклонены — роль свободна
        const replycants = [response(5, "rejected"), response(5, "withdrawn")];

        // when
        const blocked = findBlockedVacancies([vacancy(5, "Backend")], [], replycants);

        // then
        expect(blocked).toHaveLength(0);
    });

    it("не блокирует, если роль осталась в форме", () => {
        // given: роль с откликами не трогали, её правят
        const blocked = findBlockedVacancies([vacancy(5, "Backend")], [kept(5)], [response(5)]);

        // then
        expect(blocked).toHaveLength(0);
    });

    it("не блокирует удаление роли без откликов", () => {
        // given: на роль никто не откликался
        const blocked = findBlockedVacancies([vacancy(5, "Backend")], [], []);

        // then
        expect(blocked).toHaveLength(0);
    });

    it("не считает новую роль за снятую", () => {
        // given: роль добавлена прямо в форме, у неё ещё нет id на сервере
        const blocked = findBlockedVacancies(
            [vacancy(5, "Backend")],
            [{ id: null, title: "Frontend", tasks: ["ui"], count: 1 }],
            [response(5)],
        );

        // then: снята серверная роль 5, а новая в форме осталась
        expect(blocked.map((b) => b.vacancy.title)).toEqual(["Backend"]);
    });

    it("возвращает все снятые роли с активными откликами", () => {
        // given
        const vacancies = [vacancy(5, "A"), vacancy(6, "B"), vacancy(7, "C")];
        const replycants = [response(5), response(7, "accepted")];

        // when: оставили только B
        const blocked = findBlockedVacancies(vacancies, [kept(6)], replycants);

        // then
        expect(blocked.map((b) => b.vacancy.id)).toEqual([5, 7]);
    });

    it("устойчив к пустому проекту", () => {
        expect(findBlockedVacancies([], [], [response(5)])).toEqual([]);
        expect(findBlockedVacancies(null, [], [])).toEqual([]);
        expect(findBlockedVacancies(undefined, [], null)).toEqual([]);
    });
});
