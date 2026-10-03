import { describe, expect, it } from "vitest";

import {
    projectDateRange,
    projectFiltersToParams,
    type ProjectFilterOptions,
} from "@/features/spaces/components/filters/project-filter-params";
import { defaultFiltersState, type FiltersState } from "@/features/spaces/components/filters/types";

const options: ProjectFilterOptions = {
    statuses: ["planned", "in_progress"],
    tags: ["ml", "backend"],
    members: [
        { id: 1, full_name: "Анна Иванова" },
        { id: 2, full_name: "Борис Петров" },
    ],
};

function filters(patch: Partial<FiltersState>): FiltersState {
    return { ...defaultFiltersState, ...patch };
}

function localIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

describe("projectFiltersToParams", () => {
    it("не отправляет фильтры, если ничего не выбрано", () => {
        // given
        // when
        const params = projectFiltersToParams(defaultFiltersState, options);
        // then
        expect(params).toEqual({});
    });

    it("передаёт выбранные статусы и теги", () => {
        // given
        const state = filters({ statuses: ["planned"], tags: ["ml"] });
        // when
        const params = projectFiltersToParams(state, options);
        // then
        expect(params.statuses).toEqual(["planned"]);
        expect(params.tags).toEqual(["ml"]);
    });

    it("передаёт участников числами", () => {
        // given
        const state = filters({ members: [2] });
        // when
        const params = projectFiltersToParams(state, options);
        // then
        expect(params.member_ids).toEqual([2]);
    });

    it("выключает фильтр, если выбраны все доступные значения", () => {
        // given: полный IN исключил бы проекты без тегов — это не «без фильтра»
        const state = filters({ statuses: ["planned", "in_progress"], tags: ["ml", "backend"] });
        // when
        const params = projectFiltersToParams(state, options);
        // then
        expect(params.statuses).toBeUndefined();
        expect(params.tags).toBeUndefined();
    });

    it("передаёт участников и при незагруженном справочнике", () => {
        // given: справочник ещё не пришёл, а галки уже стоят
        const state = filters({ members: [1, 2] });
        // when
        const params = projectFiltersToParams(state, { statuses: [], tags: [], members: [] });
        // then
        expect(params.member_ids).toEqual([1, 2]);
    });

    it("передаёт дедлайн по пресету 7 дней как просроченный диапазон", () => {
        // given
        const state = filters({ datePreset: "7days" });
        // when
        const params = projectFiltersToParams(state, options);
        // then
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 7);
        expect(params.date_from).toBe(localIsoDate(from));
        expect(params.date_to).toBe(localIsoDate(to));
    });

    it("передаёт произвольный диапазон дат", () => {
        // given
        const state = filters({
            datePreset: "custom",
            customDate: {
                from: new Date(2026, 0, 5, 15, 0),
                to: new Date(2026, 0, 20, 15, 0),
            },
        });
        // when
        const params = projectFiltersToParams(state, options);
        // then
        expect(params.date_from).toBe("2026-01-05");
        expect(params.date_to).toBe("2026-01-20");
    });
});

describe("projectDateRange", () => {
    it("возвращает null для пресета all", () => {
        // given
        // when
        const range = projectDateRange(defaultFiltersState);
        // then
        expect(range).toBeNull();
    });

    it("возвращает сегодняшний день для пресета today", () => {
        // given
        const state = filters({ datePreset: "today" });
        // when
        const range = projectDateRange(state);
        // then
        expect(range?.from).toBe(range?.to);
    });
});
