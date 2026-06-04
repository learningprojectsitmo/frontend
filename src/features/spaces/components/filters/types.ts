export type DatePreset = "all" | "today" | "7days" | "30days" | "custom";

export type FiltersState = {
    statuses: string[];
    tags: string[];
    members: number[];
    datePreset: DatePreset;
    customDate?: { from: Date; to: Date };
};

export type FilterSectionConfig = {
    id: string;
    label: string;
    icon: string;
    type: "checkbox" | "date";
    options?: { value: string; label: string }[];
};

export const defaultFiltersState: FiltersState = {
    statuses: [],
    tags: [],
    members: [],
    datePreset: "all",
};
