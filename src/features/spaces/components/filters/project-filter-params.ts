import type { ProjectsListParams } from "@/lib/query-keys";
import type { FiltersState, ProjectFilterOptions } from "./types";
import { selectedValuesToParam } from "./filter-params";

export type ProjectFilterDateRange = { from: string; to: string };

function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

/**
 * Диапазон дедлайнов для пресета фильтра дат.
 *
 * «Сегодня» и N дней — это дедлайны, которые уже наступили (просроченные и
 * сегодняшние), поэтому `to` равен сегодняшнему дню, а не будущему.
 */
export function projectDateRange(state: FiltersState): ProjectFilterDateRange | null {
    if (state.datePreset === "all") return null;

    if (state.datePreset === "today") {
        const today = toIsoDate(new Date());
        return { from: today, to: today };
    }

    if (state.datePreset === "custom") {
        if (!state.customDate) return null;
        return {
            from: toIsoDate(startOfDay(state.customDate.from)),
            to: toIsoDate(startOfDay(state.customDate.to)),
        };
    }

    const days = state.datePreset === "7days" ? 7 : 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { from: toIsoDate(startOfDay(from)), to: toIsoDate(new Date()) };
}

/**
 * Переводит состояние фильтров проектов в query-параметры списка.
 *
 * Пустой выбор и выбор всех доступных значений превращаются в `undefined` —
 * см. комментарий в filter-params.ts: полный IN исключил бы проекты без
 * тегов, а это не то же самое, что «без фильтра».
 */
type ProjectFilterParams = Pick<
    ProjectsListParams,
    "stages" | "tags" | "member_ids" | "date_from" | "date_to"
>;

export function projectFiltersToParams(
    state: FiltersState,
    options: ProjectFilterOptions,
): ProjectFilterParams {
    const params: ProjectFilterParams = {};

    const stages = selectedValuesToParam(
        state.stages,
        options.stages.map((s) => ({ value: s })),
    );
    if (stages) params.stages = stages;

    const tags = selectedValuesToParam(
        state.tags,
        options.tags.map((t) => ({ value: t })),
    );
    if (tags) params.tags = tags;

    const members = selectedValuesToParam(
        state.members.map(String),
        options.members.map((m) => ({ value: String(m.id) })),
    );
    if (members) params.member_ids = members.map(Number);

    const range = projectDateRange(state);
    if (range) {
        params.date_from = range.from;
        params.date_to = range.to;
    }

    return params;
}
