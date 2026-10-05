import { describe, expect, it } from "vitest";

import { hasFormErrors, validateProjectForm } from "./project-validation";
import type { EditableVacancy } from "./vacancy-sync";
import { MAX_VACANCY_TASK_LENGTH } from "@/types/api";

const role = (over: Partial<EditableVacancy> = {}): EditableVacancy => ({
    id: 1,
    title: "Backend",
    tasks: ["поднять ci"],
    count: 1,
    ...over,
});

describe("validateProjectForm", () => {
    describe("название проекта", () => {
        it("не пропускает пустое название", () => {
            // given
            const form = { title: "   ", roles: [role()] };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.title).toBe("Введите название проекта");
        });

        it("не пропускает название из пробелов и табов", () => {
            // given / when
            const errors = validateProjectForm({ title: "\t\n ", roles: [] });

            // then
            expect(errors.title).toBe("Введите название проекта");
        });

        it("принимает заполненное название без ошибок", () => {
            // given / when
            const errors = validateProjectForm({ title: "Проект", roles: [role()] });

            // then
            expect(errors.title).toBeUndefined();
        });
    });

    describe("роли", () => {
        it("требует название роли", () => {
            // given
            const form = { title: "Проект", roles: [role({ title: "  " })] };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.title).toBe("Введите название роли");
        });

        it("требует хотя бы одну непустую задачу", () => {
            // given
            const form = { title: "Проект", roles: [role({ tasks: ["", "  "] })] };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.tasks).toBe("Добавьте хотя бы одну задачу");
        });

        it("не считает задачу из одних пробелов заполненной", () => {
            // given / when
            const errors = validateProjectForm({
                title: "Проект",
                roles: [role({ tasks: ["первая", " "] })],
            });

            // then
            expect(errors.roles[0]?.tasks).toBeUndefined();
        });

        it("ловит повторяющиеся задачи", () => {
            // given
            const form = {
                title: "Проект",
                roles: [role({ tasks: ["ci", "ci"] })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.tasks).toBe("Задачи внутри одной роли не должны повторяться");
        });

        it("считает повтором задачи, различающиеся пробелами", () => {
            // given — обрезка до сравнения, как в VacancyCreate на бэкенде
            const form = { title: "Проект", roles: [role({ tasks: ["ci", " ci "] })] };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.tasks).toBe("Задачи внутри одной роли не должны повторяться");
        });

        it("не считает повтором задачи, различающиеся регистром", () => {
            // given — сверка регистрозависимая, как на бэкенде
            const form = { title: "Проект", roles: [role({ tasks: ["CI", "ci"] })] };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.tasks).toBeUndefined();
        });

        it("ловит задачу длиннее лимита", () => {
            // given
            const form = {
                title: "Проект",
                roles: [role({ tasks: ["x".repeat(MAX_VACANCY_TASK_LENGTH + 1)] })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.tasks).toBe(
                `Задача не может быть длиннее ${MAX_VACANCY_TASK_LENGTH} символов`,
            );
        });

        it("принимает задачу ровно на весь лимит", () => {
            // given
            const form = {
                title: "Проект",
                roles: [role({ tasks: ["x".repeat(MAX_VACANCY_TASK_LENGTH)] })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.tasks).toBeUndefined();
        });

        it("складывает ошибки разных полей одной роли", () => {
            // given
            const form = { title: "Проект", roles: [role({ title: "", tasks: [] })] };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]?.title).toBe("Введите название роли");
            expect(errors.roles[0]?.tasks).toBe("Добавьте хотя бы одну задачу");
        });

        it("хранит ошибку по индексу роли, а не по порядку проверки", () => {
            // given — вторая роль битая, первая валидна
            const form = {
                title: "Проект",
                roles: [role({ id: 1 }), role({ id: 2, title: "" })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.roles[0]).toBeUndefined();
            expect(errors.roles[1]?.title).toBe("Введите название роли");
        });

        it("не требует задач, если ролей нет", () => {
            // given / when
            const errors = validateProjectForm({ title: "Проект", roles: [] });

            // then
            expect(errors.roles).toEqual([]);
            expect(errors.form).toBeUndefined();
        });
    });

    describe("лимит участников", () => {
        it("считает сумму по всем ролям и пишет в form", () => {
            // given
            const form = {
                title: "Проект",
                maxParticipants: 3,
                roles: [role({ id: 1, count: 2 }), role({ id: 2, count: 2 })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.form).toBe(
                "Сумма необходимых участников (4) превышает максимальное количество (3)",
            );
        });

        it("не ругается на ровно равную сумму", () => {
            // given
            const form = {
                title: "Проект",
                maxParticipants: 4,
                roles: [role({ id: 1, count: 2 }), role({ id: 2, count: 2 })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.form).toBeUndefined();
        });

        it("пропускает превышение, если лимит не задан", () => {
            // given
            const form = {
                title: "Проект",
                maxParticipants: null,
                roles: [role({ count: 99 })],
            };

            // when
            const errors = validateProjectForm(form);

            // then
            expect(errors.form).toBeUndefined();
        });
    });

    it("возвращает пустые ошибки для валидной формы", () => {
        // given / when
        const errors = validateProjectForm({
            title: "Проект",
            maxParticipants: 5,
            roles: [role({ count: 2 })],
        });

        // then
        expect(errors).toEqual({ roles: [] });
        expect(hasFormErrors(errors)).toBe(false);
    });
});

describe("hasFormErrors", () => {
    it("видит ошибку названия", () => {
        // given
        const errors = { title: "Введите название проекта", roles: [] };

        // when / then
        expect(hasFormErrors(errors)).toBe(true);
    });

    it("видит ошибку роли", () => {
        // given
        const errors = { roles: [{}, { title: "Введите название роли" }] };

        // when / then
        expect(hasFormErrors(errors)).toBe(true);
    });

    it("видит сквозную ошибку формы", () => {
        // given
        const errors = { roles: [], form: "превышение" };

        // when / then
        expect(hasFormErrors(errors)).toBe(true);
    });

    it("не считает пустые слоты ролей ошибкой", () => {
        // given — массив разреженный: ошибок у 0-й и 2-й ролей нет
        const errors = { roles: [{}, {}] };

        // when / then
        expect(hasFormErrors(errors)).toBe(false);
    });
});
