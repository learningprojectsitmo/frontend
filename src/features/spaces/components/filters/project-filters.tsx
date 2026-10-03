import { useState, useCallback } from "react";
import { Users, Tag, CircleDot, Calendar } from "lucide-react";
import type { FiltersState, ProjectFilterOptions } from "./types";
import { FilterTrigger } from "./filter-trigger";
import { FilterDropdown } from "./filter-dropdown";
import { FilterSection } from "./filter-section";
import { CheckboxGroup } from "./checkbox-group";
import { DateFilter } from "./date-filter";

type ProjectFiltersProps = {
    state: FiltersState;
    onChange: (state: FiltersState) => void;
    onReset: () => void;
    /** Справочник пространства: варианты фильтра одинаковы на всех страницах. */
    options: ProjectFilterOptions;
};

export function ProjectFilters({ state, onChange, onReset, options }: ProjectFiltersProps) {
    const [open, setOpen] = useState(false);

    const activeCount = [
        state.stages.length > 0,
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

            <FilterDropdown open={open} onClose={handleClose} onReset={onReset}>
                <FilterSection
                    icon={<CircleDot size={16} />}
                    label="Этап"
                    count={state.stages.length}
                >
                    <CheckboxGroup
                        options={options.stages.map((name) => ({ value: name, label: name }))}
                        selected={state.stages}
                        onChange={(v) => onChange({ ...state, stages: v })}
                    />
                </FilterSection>

                <FilterSection icon={<Tag size={16} />} label="Теги" count={state.tags.length}>
                    <CheckboxGroup
                        options={options.tags.map((t) => ({ value: t, label: t }))}
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
                        options={[...options.members]
                            .sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"))
                            .map((m) => ({
                                value: String(m.id),
                                label: m.full_name,
                            }))}
                        selected={state.members.map(String)}
                        onChange={(v) => onChange({ ...state, members: v.map(Number) })}
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
