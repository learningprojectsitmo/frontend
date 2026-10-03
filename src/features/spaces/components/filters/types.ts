export type DatePreset = "all" | "today" | "7days" | "30days" | "custom";

/** Общая для обоих фильтров часть: пресет даты. */
export type DateFilterState = {
    datePreset: DatePreset;
    customDate?: { from: Date; to: Date };
};

/**
 * Фильтры списка проектов пространства.
 *
 * `stages`, а не `statuses`: статус у всех проектов «draft» (создаёт его FixtureService),
 * а реальный прогресс проекта задаёт его текущий этап.
 */
export type FiltersState = {
    stages: string[];
    tags: string[];
    members: number[];
} & DateFilterState;

/** Фильтры списка пространств: у пространства статус есть, и он осмысленный. */
export type SpaceFiltersState = {
    statuses: string[];
    tags: string[];
    members: number[];
} & DateFilterState;

export type FilterSectionConfig = {
    id: string;
    label: string;
    icon: string;
    type: "checkbox" | "date";
    options?: { value: string; label: string }[];
};

/**
 * Справочник пространства для фильтров проектов: приходит отдельным запросом,
 * чтобы варианты не зависели от того, какая страница списка открыта.
 */
export type ProjectFilterOptions = {
    stages: string[];
    tags: string[];
    members: { id: number; full_name: string }[];
};

export const defaultFiltersState: FiltersState = {
    stages: [],
    tags: [],
    members: [],
    datePreset: "all",
};
