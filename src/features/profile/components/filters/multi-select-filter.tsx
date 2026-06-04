import { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type MultiSelectOption = {
    value: string;
    label: string;
};

type MultiSelectFilterProps = {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
};

export function MultiSelectFilter({
    options,
    selected,
    onChange,
    placeholder = "Поиск",
}: MultiSelectFilterProps) {
    const [search, setSearch] = useState("");

    const filteredOptions = useMemo(
        () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
        [options, search],
    );

    const allSelected = selected.length === options.length && options.length > 0;

    const toggleAll = () => {
        if (allSelected) {
            onChange([]);
        } else {
            onChange(options.map((o) => o.value));
        }
    };

    const toggleOption = (value: string) => {
        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
        onChange(next);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2.5">
                <button
                    type="button"
                    onClick={toggleAll}
                    className="text-[12px] font-medium text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                >
                    {allSelected ? "Сбросить" : "Выбрать все"}
                </button>
            </div>

            <div className="relative mb-2">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
                />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-[34px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[13px] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-colors"
                />
            </div>

            <div
                className="max-h-[180px] overflow-y-auto"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#D1D5DB transparent" }}
            >
                {filteredOptions.length === 0 ? (
                    <p className="text-[13px] text-[#6B7280] text-center py-4">Не найдено</p>
                ) : (
                    <div className="flex flex-col">
                        {filteredOptions.map((opt) => (
                            <label
                                key={opt.value}
                                className={cn(
                                    "flex items-center gap-2.5 h-9 px-2 rounded-lg cursor-pointer transition-colors",
                                    "hover:bg-[#F9FAFB]",
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-4 h-4 rounded-[5px] border-2 flex items-center justify-center transition-colors shrink-0",
                                        selected.includes(opt.value)
                                            ? "bg-[#2563EB] border-[#2563EB]"
                                            : "border-[#D1D5DB] bg-white",
                                    )}
                                >
                                    {selected.includes(opt.value) && (
                                        <Check size={12} className="text-white stroke-[3]" />
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selected.includes(opt.value)}
                                    onChange={() => toggleOption(opt.value)}
                                    className="sr-only"
                                />
                                <span className="text-[13px] font-normal text-[#111827] truncate">
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
