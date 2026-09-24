import { useState, useEffect, useRef } from "react";
import { Folder, Building2, Pencil, CalendarIcon } from "lucide-react";
import { Calendar } from "@/features/spaces/components/filters/calendar";
import { isValidPeriod, LIMITS } from "@/features/resume/validation";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";

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

    const periodError =
        periodFrom && periodTo && !isValidPeriod(periodFrom, periodTo)
            ? "Дата окончания не может быть раньше даты начала"
            : null;

    const handleDateSelect = (date: Date) => {
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (activeField === "from") setPeriodFrom(value);
        else setPeriodTo(value);
        setActiveField(null);
    };

    const handleSave = () => {
        if (!company.trim() || !position.trim() || periodError) return;
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
                    <IconComponent className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        {isNew ? (
                            <input
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Название проекта или компании"
                                maxLength={LIMITS.companyPosition}
                                className="w-full text-base font-semibold text-app-text bg-transparent border-b border-app-border px-0 py-0.5 outline-none focus:border-app-blue"
                            />
                        ) : (
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                {company || "Новый опыт"}
                            </h3>
                        )}
                        {!isNew && <Pencil className="w-4 h-4 text-gray-500 shrink-0" />}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Тип</label>
                    <Select value={experienceType} onValueChange={setExperienceType}>
                        <SelectTrigger className="w-full rounded-lg bg-app-surface">
                            <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[320px] overflow-y-auto">
                            <SelectGroup>
                                <SelectLabel>Типы занятости</SelectLabel>
                                <SelectItem value="project">Проект</SelectItem>
                                <SelectItem value="internship">Стажировка</SelectItem>
                                <SelectItem value="work">Работа</SelectItem>
                                <SelectItem value="freelance">Фриланс</SelectItem>
                                <SelectItem value="volunteering">Волонтёрство</SelectItem>
                                <SelectItem value="temporary_contract">
                                    Временный контракт
                                </SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>IT-направления</SelectLabel>
                                <SelectItem value="development">Разработка</SelectItem>
                                <SelectItem value="ml_data">ML/Data</SelectItem>
                                <SelectItem value="devops">DevOps</SelectItem>
                                <SelectItem value="testing">Тестирование</SelectItem>
                                <SelectItem value="design">Дизайн</SelectItem>
                                <SelectItem value="analytics">Аналитика</SelectItem>
                                <SelectItem value="management">Менеджмент</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Форматы деятельности</SelectLabel>
                                <SelectItem value="pet_project">Пет-проект</SelectItem>
                                <SelectItem value="open_source">Open Source</SelectItem>
                                <SelectItem value="hackathon">Хакатон</SelectItem>
                                <SelectItem value="education_course">Курсы/обучение</SelectItem>
                                <SelectItem value="olympiad">Олимпиада</SelectItem>
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel>Академическое</SelectLabel>
                                <SelectItem value="study_practice">Учебная практика</SelectItem>
                                <SelectItem value="coursework">Курсовой проект</SelectItem>
                                <SelectItem value="research">Научная работа</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Дата начала</label>
                            <button
                                type="button"
                                onClick={() => setActiveField("from")}
                                className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-left flex items-center justify-between text-app-text outline-none focus:border-app-blue"
                            >
                                <span>{periodFrom ? formatMonthDisplay(periodFrom) : ""}</span>
                                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            </button>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                                Дата окончания
                            </label>
                            <button
                                type="button"
                                onClick={() => setActiveField("to")}
                                className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-left flex items-center justify-between text-app-text outline-none focus:border-app-blue"
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

                {periodError && <p className="text-xs text-red-500">{periodError}</p>}

                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Роль</label>
                    <input
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="UX/UI-дизайнер"
                        maxLength={LIMITS.companyPosition}
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-blue"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                        Описание{" "}
                        {description.length > 0 && (
                            <span className="text-gray-300">
                                {description.length} / {LIMITS.experienceDescription}
                            </span>
                        )}
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="— проведение исследований&#10;— разработка сценариев&#10;— создание пользовательских потоков"
                        rows={5}
                        maxLength={LIMITS.experienceDescription}
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-blue resize-y"
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
                        disabled={!company.trim() || !position.trim() || !!periodError}
                        className="px-4 py-2 rounded-lg bg-[#4F6BFF] text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};
