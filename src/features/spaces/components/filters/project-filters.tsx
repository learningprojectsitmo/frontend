import { useState, useCallback } from "react";
import { Users, Tag, CircleDot, Calendar } from "lucide-react";
import type { ProjectListItemResponse } from "@/types/api";
import type { FiltersState } from "./types";
import { FilterTrigger } from "./filter-trigger";
import { FilterDropdown } from "./filter-dropdown";
import { FilterSection } from "./filter-section";
import { CheckboxGroup } from "./checkbox-group";
import { DateFilter } from "./date-filter";

const STATUS_LABELS: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    draft: "Черновик",
    archived: "Архив",
};

type ProjectFiltersProps = {
    state: FiltersState;
    onChange: (state: FiltersState) => void;
    onReset: () => void;
    projects: ProjectListItemResponse[];
};

export function ProjectFilters({
    state,
    onChange,
    onReset,
    projects,
}: ProjectFiltersProps) {
    const [open, setOpen] = useState(false);

    const activeCount = [
        state.statuses.length > 0,
        state.tags.length > 0,
        state.members.length > 0,
        state.datePreset !== "all",
    ].filter(Boolean).length;

    const handleClose = useCallback(() => setOpen(false), []);

    const handleDateChange = (patch: Partial<FiltersState>) => {
        onChange({ ...state, ...patch });
    };

    return (
        <div className="relative">
            <FilterTrigger
                activeCount={activeCount}
                open={open}
                onClick={() => setOpen((v) => !v)}
            />

            <FilterDropdown
                open={open}
                onClose={handleClose}
                onReset={onReset}
            >
                <FilterSection
                    icon={<CircleDot size={16} />}
                    label="Статус"
                    count={state.statuses.length}
                >
                    <CheckboxGroup
                        options={projects
                            .map((p) => ({
                                value: p.status?.name || "draft",
                                label: STATUS_LABELS[p.status?.name || "draft"],
                            }))
                            .filter(
                                (opt, i, arr) =>
                                    arr.findIndex((o) => o.value === opt.value) === i,
                            )
                            .sort((a, b) => a.label.localeCompare(b.label, "ru"))}
                        selected={state.statuses}
                        onChange={(v) => onChange({ ...state, statuses: v })}
                    />
                </FilterSection>

                <FilterSection
                    icon={<Tag size={16} />}
                    label="Теги"
                    count={state.tags.length}
                >
                    <CheckboxGroup
                        options={[
                            ...new Set(projects.flatMap((p) => p.tags)),
                        ]
                            .sort((a, b) => a.localeCompare(b, "ru"))
                            .map((t) => ({ value: t, label: t }))}
                        selected={state.tags}
                        onChange={(v) => onChange({ ...state, tags: v })}
                    />
                </FilterSection>

                <FilterSection
                    icon={<Users size={16} />}
                    label="Участники"
                    count={state.members.length}
                >
                    <CheckboxGroup
                        options={[
                            ...new Map(
                                projects.flatMap((p) =>
                                    p.participants_preview.map((m) => [m.id, m] as const),
                                ),
                            ).values(),
                        ]
                            .sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"))
                            .map((m) => ({
                                value: String(m.id),
                                label: m.full_name,
                            }))}
                        selected={state.members.map(String)}
                        onChange={(v) =>
                            onChange({ ...state, members: v.map(Number) })
                        }
                    />
                </FilterSection>

                <FilterSection
                    icon={<Calendar size={16} />}
                    label="Дата"
                    count={state.datePreset !== "all" ? 1 : undefined}
                >
                    <DateFilter state={state} onChange={handleDateChange} />
                </FilterSection>
            </FilterDropdown>
        </div>
    );
}
