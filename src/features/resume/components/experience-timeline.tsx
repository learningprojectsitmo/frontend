import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { type ResumeExperience } from "@/types/api";
import { useCreateResumeExperience, useUpdateResumeExperience, useDeleteResumeExperience } from "@/lib/resume";
import { ExperienceEditCard } from "./ExperienceEditCard";

const INITIAL_VISIBLE = 3;

const formatDuration = (items: { duration: string | null }[]): string => {
    const totalMonths = items.reduce((acc, item) => {
        const m = item.duration?.match(/(?:(\d+)\s*год)?\s*(?:(\d+)\s*месяц)?/);
        const y = m?.[1] ? Number.parseInt(m[1]) : 0;
        const mo = m?.[2] ? Number.parseInt(m[2]) : 0;
        return acc + y * 12 + mo;
    }, 0);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts: string[] = [];
    if (years) parts.push(`${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`);
    if (months) parts.push(`${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`);
    return parts.join(" ") || "0 месяцев";
};

type Props = {
    experiences: ResumeExperience[];
    isEditing?: boolean;
    resumeId: number;
    hasExperience?: boolean;
    noExperienceDescription?: string;
    onHasExperienceChange?: (value: boolean) => void;
    onNoExperienceDescriptionChange?: (value: string) => void;
};

export const ExperienceTimeline = ({
    experiences,
    isEditing,
    resumeId,
    hasExperience,
    noExperienceDescription,
    onHasExperienceChange,
    onNoExperienceDescriptionChange,
}: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newCards, setNewCards] = useState<number[]>([]);

    const totalDuration = formatDuration(experiences);
    const visibleExperiences = isExpanded ? experiences : experiences.slice(0, INITIAL_VISIBLE);
    const isTruncated = experiences.length > INITIAL_VISIBLE;

    const createMutation = useCreateResumeExperience(resumeId);
    const updateMutation = useUpdateResumeExperience(resumeId);
    const deleteMutation = useDeleteResumeExperience(resumeId);

    const handleAddNew = () => {
        setNewCards((prev) => [...prev, Date.now()]);
    };

    const handleSaveNew = (cardId: number) => (data: {
        company: string;
        position: string;
        experience_type: string | null;
        period_from: string | null;
        period_to: string | null;
        description: string | null;
    }) => {
        createMutation.mutate(
            { resumeId, data },
            { onSuccess: () => setNewCards((prev) => prev.filter((id) => id !== cardId)) },
        );
    };

    const handleCancelNew = (cardId: number) => () => {
        setNewCards((prev) => prev.filter((id) => id !== cardId));
    };

    const handleSave = (exp: ResumeExperience) => (data: {
        company: string;
        position: string;
        experience_type: string | null;
        period_from: string | null;
        period_to: string | null;
        description: string | null;
    }) => {
        updateMutation.mutate({ expId: exp.id, data });
    };

    const handleDelete = (exp: ResumeExperience) => () => {
        deleteMutation.mutate(exp.id);
    };

    if (isEditing) {
        return (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm divide-y divide-gray-100">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold tracking-tight text-[#222]">Опыт работы</h3>
                        {totalDuration && (
                            <span className="text-sm text-[#8A8A8A]">{totalDuration}</span>
                        )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!hasExperience}
                            onChange={(e) => onHasExperienceChange?.(!e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Нет опыта</span>
                    </label>
                </div>

                {!hasExperience ? (
                    <div className="p-6">
                        <p className="text-xs text-gray-500 mb-2">
                            Опишите, почему у вас нет опыта (например, вы студент, меняете сферу деятельности и т.д.)
                        </p>
                        <textarea
                            value={noExperienceDescription ?? ""}
                            onChange={(e) => onNoExperienceDescriptionChange?.(e.target.value)}
                            rows={3}
                            placeholder="Расскажите о вашей ситуации..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 resize-y"
                        />
                    </div>
                ) : (
                    <>
                        {(experiences.length > 0 ? visibleExperiences : []).map((exp) => (
                            <div key={exp.id} className="p-6">
                                <ExperienceEditCard
                                    experience={exp}
                                    onSave={handleSave(exp)}
                                    onDelete={handleDelete(exp)}
                                    onCancel={() => {}}
                                />
                            </div>
                        ))}
                        {newCards.map((id) => (
                            <div key={id} className="p-6">
                                <ExperienceEditCard
                                    experience={{ id, company: "", position: "", experience_type: "project", period_from: null, period_to: null, description: null }}
                                    isNew
                                    onSave={handleSaveNew(id)}
                                    onDelete={() => setNewCards((prev) => prev.filter((c) => c !== id))}
                                    onCancel={handleCancelNew(id)}
                                />
                            </div>
                        ))}
                        <div className="p-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAddNew}
                                    className="text-sm font-medium text-[#4F6BFF] hover:text-blue-700 transition-colors"
                                >
                                    + Добавить опыт
                                </button>
                                {isTruncated && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-[#4F6BFF] hover:text-blue-700 transition-colors"
                                    >
                                        {isExpanded ? "Свернуть" : "Развернуть"}
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return null;
};
