import { useState, useEffect, useRef } from "react";
import { Folder, Building2, Pencil, CalendarIcon } from "lucide-react";
import { Calendar } from "@/features/spaces/components/filters/calendar";

const MONTHS_RU = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
];

function formatMonthDisplay(value: string): string {
    if (!value) return "";
    const [year, month] = value.split("-");
    if (!year || !month) return value;
    return `${MONTHS_RU[Number.parseInt(month) - 1] ?? ""} ${year}`;
}

type Props = {
    experience: {
        id: number;
        company: string;
        position: string;
        experience_type: string | null;
        period_from: string | null;
        period_to: string | null;
        description: string | null;
        responsibilities: string[] | null;
    };
    isNew?: boolean;
    onSave: (data: {
        company: string;
        position: string;
        experience_type: string | null;
        period_from: string | null;
        period_to: string | null;
        description: string | null;
        responsibilities: string[] | null;
    }) => void;
    onDelete: () => void;
    onCancel: () => void;
};

export const ExperienceEditCard = ({ experience, isNew, onSave, onDelete, onCancel }: Props) => {
    const [company, setCompany] = useState("");
    const [position, setPosition] = useState("");
    const [experienceType, setExperienceType] = useState("project");
    const [periodFrom, setPeriodFrom] = useState("");
    const [periodTo, setPeriodTo] = useState("");
    const [description, setDescription] = useState("");
    const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCompany(experience.company ?? "");
        setPosition(experience.position ?? "");
        setExperienceType(experience.experience_type ?? "project");
        setPeriodFrom(experience.period_from?.slice(0, 7) ?? "");
        setPeriodTo(experience.period_to?.slice(0, 7) ?? "");
        const desc = experience.description ?? experience.responsibilities?.join("\n") ?? "";
        setDescription(desc);
    }, [experience]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setActiveField(null);
            }
        };
        if (activeField) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeField]);

    const IconComponent = experienceType === "internship" ? Building2 : Folder;

    const handleDateSelect = (date: Date) => {
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (activeField === "from") setPeriodFrom(value);
        else setPeriodTo(value);
        setActiveField(null);
    };

    const handleSave = () => {
        if (!company.trim() || !position.trim()) return;
        const responsibilitiesArr = description
            ? description
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : null;
        onSave({
            company: company.trim(),
            position: position.trim(),
            experience_type: experienceType,
            period_from: periodFrom ? periodFrom + "-01" : null,
            period_to: periodTo ? periodTo + "-01" : null,
            description: description || null,
            responsibilities: responsibilitiesArr,
        });
    };

    return (
        <div>
            <div className="flex items-start gap-3 mb-5">
                <div className="shrink-0 mt-0.5">
                    <IconComponent className="w-5 h-5 text-[#666]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        {isNew ? (
                            <input
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Название проекта или компании"
                                className="w-full text-base font-semibold text-[#222] bg-transparent border-b border-gray-200 px-0 py-0.5 outline-none focus:border-gray-400"
                            />
                        ) : (
                            <h3 className="text-base font-semibold text-[#222] truncate">
                                {company || "Новый опыт"}
                            </h3>
                        )}
                        {!isNew && <Pencil className="w-4 h-4 text-[#8A8A8A] shrink-0" />}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-[#8A8A8A] mb-1 block">Тип</label>
                    <select
                        value={experienceType}
                        onChange={(e) => setExperienceType(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat"
                    >
                        <option value="project">Проект</option>
                        <option value="internship">Стажировка</option>
                    </select>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[#8A8A8A] mb-1 block">Дата начала</label>
                            <button
                                type="button"
                                onClick={() => setActiveField("from")}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-left flex items-center justify-between text-gray-700 outline-none focus:border-gray-400"
                            >
                                <span>{periodFrom ? formatMonthDisplay(periodFrom) : ""}</span>
                                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            </button>
                        </div>
                        <div>
                            <label className="text-xs text-[#8A8A8A] mb-1 block">
                                Дата окончания
                            </label>
                            <button
                                type="button"
                                onClick={() => setActiveField("to")}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-left flex items-center justify-between text-gray-700 outline-none focus:border-gray-400"
                            >
                                <span>{periodTo ? formatMonthDisplay(periodTo) : ""}</span>
                                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            </button>
                        </div>
                    </div>
                    {activeField && (
                        <div
                            ref={popoverRef}
                            className="absolute left-1/2 -translate-x-1/2 z-50 mt-2"
                        >
                            <Calendar
                                selected={
                                    activeField === "from" && periodFrom
                                        ? new Date(
                                              Number(periodFrom.split("-")[0]),
                                              Number(periodFrom.split("-")[1]) - 1,
                                              1,
                                          )
                                        : activeField === "to" && periodTo
                                          ? new Date(
                                                Number(periodTo.split("-")[0]),
                                                Number(periodTo.split("-")[1]) - 1,
                                                1,
                                            )
                                          : null
                                }
                                onSelect={handleDateSelect}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs text-[#8A8A8A] mb-1 block">Роль</label>
                    <input
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="UX/UI-дизайнер"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
                    />
                </div>

                <div>
                    <label className="text-xs text-[#8A8A8A] mb-1 block">Описание</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="— проведение исследований&#10;— разработка сценариев&#10;— создание пользовательских потоков"
                        rows={5}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 resize-y"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <button
                    onClick={onDelete}
                    className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                    Удалить
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!company.trim() || !position.trim()}
                        className="px-4 py-2 rounded-lg bg-[#4F6BFF] text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};
