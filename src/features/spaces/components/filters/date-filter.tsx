import { useRef, useState, useEffect, useCallback } from "react";
import { CalendarIcon } from "lucide-react";
import type { DatePreset, FiltersState } from "./types";
import { Calendar } from "./calendar";

const PRESETS: { value: DatePreset; label: string }[] = [
    { value: "all", label: "За всё время" },
    { value: "today", label: "Сегодня" },
    { value: "7days", label: "Последние 7 дней" },
    { value: "30days", label: "Последние 30 дней" },
    { value: "custom", label: "Произвольный" },
];

type DateFilterProps = {
    state: FiltersState;
    onChange: (patch: Partial<FiltersState>) => void;
};

function formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

function formatDateValue(date: Date | undefined): string {
    if (!date) return "";
    return formatDate(date);
}

export function DateFilter({ state, onChange }: DateFilterProps) {
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

    const handlePreset = useCallback(
        (value: DatePreset) => {
            onChange({ datePreset: value });
            if (value !== "custom") {
                setActiveInput(null);
            }
        },
        [onChange],
    );

    const handleCalendarSelect = useCallback(
        (date: Date) => {
            if (activeInput === "from") {
                onChange({
                    datePreset: "custom",
                    customDate: {
                        from: date,
                        to: state.customDate?.to ?? date,
                    },
                });
            } else {
                onChange({
                    datePreset: "custom",
                    customDate: {
                        from: state.customDate?.from ?? date,
                        to: date,
                    },
                });
            }
        },
        [activeInput, state.customDate, onChange],
    );

    return (
        <div className="flex flex-col gap-3">
            {PRESETS.map((preset) => (
                <label key={preset.value} className="flex items-center gap-2.5 h-7 cursor-pointer">
                    <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                            state.datePreset === preset.value
                                ? "border-[5px] border-[#2563EB]"
                                : "border-[1.5px] border-gray-300"
                        }`}
                    />
                    <input
                        type="radio"
                        name="date-preset"
                        value={preset.value}
                        checked={state.datePreset === preset.value}
                        onChange={() => handlePreset(preset.value)}
                        className="sr-only"
                    />
                    <span className="text-[13px] font-normal text-gray-900">{preset.label}</span>
                </label>
            ))}

            {state.datePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="relative date-input-wrap">
                        <input
                            type="text"
                            readOnly
                            value={formatDateValue(state.customDate?.from)}
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
                            value={formatDateValue(state.customDate?.to)}
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

            {activeInput && state.datePreset === "custom" && (
                <div ref={calendarRef} className="relative z-50">
                    <div className="absolute top-2 left-0">
                        <Calendar
                            selected={
                                activeInput === "from"
                                    ? (state.customDate?.from ?? null)
                                    : (state.customDate?.to ?? null)
                            }
                            range={
                                state.customDate
                                    ? { from: state.customDate.from, to: state.customDate.to }
                                    : null
                            }
                            onSelect={handleCalendarSelect}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
