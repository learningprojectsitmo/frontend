import { useRef, useEffect, useState } from "react";
import { RotateCcw, CalendarIcon } from "lucide-react";
import { FilterSection } from "@/features/spaces/components/filters/filter-section";
import { Calendar } from "@/features/spaces/components/filters/calendar";
import { MultiSelectFilter } from "./multi-select-filter";
import type { ProfileFiltersState } from "@/types/profile";

const DATE_PRESETS: { value: ProfileFiltersState["datePreset"]; label: string }[] = [
    { value: "all", label: "За всё время" },
    { value: "today", label: "Сегодня" },
    { value: "7days", label: "Последние 7 дней" },
    { value: "30days", label: "Последние 30 дней" },
    { value: "custom", label: "Произвольный" },
];

function formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

const ROLE_OPTIONS = [
    { value: "system_analyst", label: "Системный аналитик" },
    { value: "ux_designer", label: "UX-дизайнер" },
    { value: "tester", label: "Тестировщик" },
    { value: "frontend", label: "Frontend-разработчик" },
    { value: "backend", label: "Backend-разработчик" },
    { value: "project_manager", label: "Project Manager" },
];

function DateFilterContent({
    datePreset,
    customDate,
    onChange,
}: {
    datePreset: ProfileFiltersState["datePreset"];
    customDate: ProfileFiltersState["customDate"];
    onChange: (
        preset: ProfileFiltersState["datePreset"],
        custom: ProfileFiltersState["customDate"],
    ) => void;
}) {
    const [activeInput, setActiveInput] = useState<"from" | "to" | null>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(e.target as Node) &&
                !(e.target as HTMLElement).closest(".date-input-wrap")
            ) {
                setActiveInput(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCalendarSelect = (date: Date) => {
        if (activeInput === "from") {
            onChange("custom", { from: date, to: customDate?.to ?? date });
        } else {
            onChange("custom", { from: customDate?.from ?? date, to: date });
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {DATE_PRESETS.map((preset) => (
                <label key={preset.value} className="flex items-center gap-2.5 h-7 cursor-pointer">
                    <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                            datePreset === preset.value
                                ? "border-[5px] border-[#2563EB]"
                                : "border-[1.5px] border-gray-300"
                        }`}
                    />
                    <input
                        type="radio"
                        name="date-preset"
                        value={preset.value}
                        checked={datePreset === preset.value}
                        onChange={() => {
                            onChange(preset.value, customDate);
                            if (preset.value !== "custom") setActiveInput(null);
                        }}
                        className="sr-only"
                    />
                    <span className="text-[13px] font-normal text-gray-900">{preset.label}</span>
                </label>
            ))}

            {datePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="relative date-input-wrap">
                        <input
                            type="text"
                            readOnly
                            value={customDate?.from ? formatDate(customDate.from) : ""}
                            onFocus={() => setActiveInput("from")}
                            placeholder="От"
                            className="w-full h-9 pl-3 pr-8 bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2563EB] transition-colors cursor-pointer"
                        />
                        <CalendarIcon
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>
                    <div className="relative date-input-wrap">
                        <input
                            type="text"
                            readOnly
                            value={customDate?.to ? formatDate(customDate.to) : ""}
                            onFocus={() => setActiveInput("to")}
                            placeholder="До"
                            className="w-full h-9 pl-3 pr-8 bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2563EB] transition-colors cursor-pointer"
                        />
                        <CalendarIcon
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                    </div>
                </div>
            )}

            {activeInput && datePreset === "custom" && (
                <div ref={calendarRef} className="relative z-50">
                    <div className="absolute top-2 left-0">
                        <Calendar
                            selected={
                                activeInput === "from"
                                    ? (customDate?.from ?? null)
                                    : (customDate?.to ?? null)
                            }
                            range={customDate ? { from: customDate.from, to: customDate.to } : null}
                            onSelect={handleCalendarSelect}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

type ResponsesFiltersProps = {
    open: boolean;
    onClose: () => void;
    state: ProfileFiltersState;
    onChange: (state: ProfileFiltersState) => void;
    onReset: () => void;
    authorOptions: { value: string; label: string }[];
    projectOptions: { value: string; label: string }[];
};

export function ResponsesFilters({
    open,
    onClose,
    state,
    onChange,
    onReset,
    authorOptions,
    projectOptions,
}: ResponsesFiltersProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }

        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, onClose]);

    if (!open) return null;

    const updateField = <K extends keyof ProfileFiltersState>(
        field: K,
        value: ProfileFiltersState[K],
    ) => {
        onChange({ ...state, [field]: value });
    };

    return (
        <div
            ref={ref}
            className="absolute top-full mt-2 right-0 z-[110] w-[320px] bg-app-surface border border-gray-200 rounded-[18px] shadow-[0_10px_15px_rgba(0,0,0,0.05),0_25px_50px_rgba(0,0,0,0.12)] p-2"
        >
            <div className="flex flex-col gap-1">
                <FilterSection
                    icon={
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
                                fill="#6B7280"
                            />
                            <path
                                d="M8 10C4.68629 10 2 12.6863 2 16H14C14 12.6863 11.3137 10 8 10Z"
                                fill="#6B7280"
                            />
                        </svg>
                    }
                    label="Имя"
                    count={state.authors.length}
                >
                    <MultiSelectFilter
                        options={authorOptions}
                        selected={state.authors}
                        onChange={(v) => updateField("authors", v)}
                    />
                </FilterSection>

                <FilterSection
                    icon={
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M2 3.5C2 2.67157 2.67157 2 3.5 2H12.5C13.3284 2 14 2.67157 14 3.5V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V3.5Z"
                                stroke="#6B7280"
                                strokeWidth="1.2"
                            />
                            <path
                                d="M5 6H11M5 9H9"
                                stroke="#6B7280"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                            />
                        </svg>
                    }
                    label="Проект"
                    count={state.projects.length}
                >
                    <MultiSelectFilter
                        options={projectOptions}
                        selected={state.projects}
                        onChange={(v) => updateField("projects", v)}
                    />
                </FilterSection>

                <FilterSection
                    icon={
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
                                fill="#6B7280"
                            />
                            <path
                                d="M8 10C4.68629 10 2 12.6863 2 16H14C14 12.6863 11.3137 10 8 10Z"
                                fill="#6B7280"
                            />
                        </svg>
                    }
                    label="Роль"
                    count={state.roles.length}
                >
                    <MultiSelectFilter
                        options={ROLE_OPTIONS}
                        selected={state.roles}
                        onChange={(v) => updateField("roles", v)}
                    />
                </FilterSection>

                <FilterSection
                    icon={
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect
                                x="2"
                                y="3"
                                width="12"
                                height="11"
                                rx="2"
                                stroke="#6B7280"
                                strokeWidth="1.2"
                            />
                            <path d="M2 7H14" stroke="#6B7280" strokeWidth="1.2" />
                            <path
                                d="M5 1V4M11 1V4"
                                stroke="#6B7280"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                            />
                        </svg>
                    }
                    label="Дата обновления"
                    count={state.datePreset !== "all" ? 1 : undefined}
                >
                    <DateFilterContent
                        datePreset={state.datePreset}
                        customDate={state.customDate}
                        onChange={(preset, custom) => {
                            onChange({ ...state, datePreset: preset, customDate: custom });
                        }}
                    />
                </FilterSection>
            </div>

            <button
                type="button"
                onClick={() => {
                    onReset();
                    onClose();
                }}
                className="flex items-center justify-center gap-1.5 w-full mt-1 py-2.5 text-[13px] font-medium text-[#EF4444] hover:text-[#DC2626] transition-colors rounded-[10px] hover:bg-[#FEF2F2] dark:hover:bg-[#3a1a1a]"
            >
                <RotateCcw size={14} />
                Сбросить фильтры
            </button>
        </div>
    );
}
