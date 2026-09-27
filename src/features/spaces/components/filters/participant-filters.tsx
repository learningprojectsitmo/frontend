import { useState, useCallback } from "react";
import { Calendar, FileText, FolderKanban, Users } from "lucide-react";

import { CheckboxGroup } from "./checkbox-group";
import { CheckboxRow } from "./checkbox-row";
import { FilterDropdown } from "./filter-dropdown";
import { FilterSection } from "./filter-section";
import { FilterTrigger } from "./filter-trigger";

/**
 * Наличие резюме: три состояния одним значением, а не двумя чекбоксами —
 * «есть» и «нет» взаимоисключающи, и пара булевых флагов дала бы
 * невозможное сочетание «есть и нет».
 */
export type ResumePresence = "any" | "with" | "without";

/** Активные фильтры списка участников. Значения — строки, как у CheckboxGroup. */
export type ParticipantFiltersState = {
    projects: string[];
    /** Участники без единого проекта в этом пространстве. */
    withoutProject: boolean;
    roles: string[];
    resume: ResumePresence;
    dateFrom: string;
    dateTo: string;
};

export const emptyParticipantFilters: ParticipantFiltersState = {
    projects: [],
    withoutProject: false,
    roles: [],
    resume: "any",
    dateFrom: "",
    dateTo: "",
};

type ParticipantFiltersProps = {
    state: ParticipantFiltersState;
    onChange: (state: ParticipantFiltersState) => void;
    onReset: () => void;
    projectOptions: { value: string; label: string }[];
    roleOptions: { value: string; label: string }[];
};

function DateRangeFields({
    from,
    to,
    onChange,
}: {
    from: string;
    to: string;
    onChange: (patch: { from?: string; to?: string }) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5">
                <span className="text-[12px] text-gray-500">С</span>
                <input
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(e) => onChange({ from: e.target.value })}
                    className="h-[34px] px-3 bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-gray-900 outline-none focus:border-[#2563EB] transition-colors"
                />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-[12px] text-gray-500">По</span>
                <input
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(e) => onChange({ to: e.target.value })}
                    className="h-[34px] px-3 bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-gray-900 outline-none focus:border-[#2563EB] transition-colors"
                />
            </label>
        </div>
    );
}

/**
 * Единый фильтр списка участников: одна кнопка и одна панель с секциями
 * «Проект» / «Роль» / «Резюме» / «Добавлен» — по образцу `ProjectFilters`.
 *
 * Раньше фильтр по проектам жил прямо в `space.tsx` и не имел кнопки вовсе:
 * `setOpen(true)` не вызывался нигде, поэтому панель не могла открыться, и весь
 * фильтр был мёртвым UI.
 */
export function ParticipantFilters({
    state,
    onChange,
    onReset,
    projectOptions,
    roleOptions,
}: ParticipantFiltersProps) {
    const [open, setOpen] = useState(false);

    const activeCount = [
        state.projects.length > 0,
        state.withoutProject,
        state.roles.length > 0,
        state.resume !== "any",
        Boolean(state.dateFrom || state.dateTo),
    ].filter(Boolean).length;

    const handleClose = useCallback(() => setOpen(false), []);

    const handleDateChange = (patch: { from?: string; to?: string }) => {
        onChange({
            ...state,
            dateFrom: patch.from ?? state.dateFrom,
            dateTo: patch.to ?? state.dateTo,
        });
    };

    const handleResumeChange = (next: ResumePresence) => {
        // Повторный клик по активному пункту снимает фильтр — как у чекбоксов,
        // которые ведут себя как переключатели.
        onChange({ ...state, resume: state.resume === next ? "any" : next });
    };

    return (
        <div className="relative">
            <FilterTrigger
                activeCount={activeCount}
                open={open}
                onClick={() => setOpen((v) => !v)}
            />

            <FilterDropdown open={open} onClose={handleClose} onReset={onReset}>
                {/* Секция всегда видна: в ней живёт «Без проекта» — единственный
                    способ найти людей без проектов, и он нужен даже когда в
                    пространстве пока нет ни одного проекта. */}
                <FilterSection
                    icon={<FolderKanban size={16} />}
                    label="Проект"
                    count={state.projects.length + (state.withoutProject ? 1 : 0)}
                >
                    <CheckboxRow
                        label="Без проекта"
                        checked={state.withoutProject}
                        onChange={() =>
                            onChange({ ...state, withoutProject: !state.withoutProject })
                        }
                    />
                    {projectOptions.length > 0 && (
                        <CheckboxGroup
                            options={projectOptions}
                            selected={state.projects}
                            onChange={(v) => onChange({ ...state, projects: v })}
                        />
                    )}
                </FilterSection>

                {roleOptions.length > 0 && (
                    <FilterSection
                        icon={<Users size={16} />}
                        label="Роль"
                        count={state.roles.length}
                    >
                        <CheckboxGroup
                            options={roleOptions}
                            selected={state.roles}
                            onChange={(v) => onChange({ ...state, roles: v })}
                        />
                    </FilterSection>
                )}

                <FilterSection
                    icon={<FileText size={16} />}
                    label="Резюме"
                    count={state.resume === "any" ? undefined : 1}
                >
                    <div className="flex flex-col">
                        <CheckboxRow
                            label="Есть резюме"
                            checked={state.resume === "with"}
                            onChange={() => handleResumeChange("with")}
                        />
                        <CheckboxRow
                            label="Нет резюме"
                            checked={state.resume === "without"}
                            onChange={() => handleResumeChange("without")}
                        />
                    </div>
                </FilterSection>

                <FilterSection
                    icon={<Calendar size={16} />}
                    label="Добавлен"
                    count={state.dateFrom || state.dateTo ? 1 : undefined}
                >
                    <DateRangeFields
                        from={state.dateFrom}
                        to={state.dateTo}
                        onChange={handleDateChange}
                    />
                </FilterSection>
            </FilterDropdown>
        </div>
    );
}
