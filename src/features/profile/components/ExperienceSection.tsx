import { useState } from "react";
import { calculateTotalDuration, formatPeriod } from "./experience-utils";
import { ExperienceItem } from "./ExperienceItem";
import { type ResumeExperience } from "@/types/api";

const DESCRIPTION_PLACEHOLDER = ["Нет описания"];

type Props = {
    experiences: ResumeExperience[];
};

export const ExperienceSection = ({ experiences }: Props) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const items = (experiences ?? []).map((exp) => ({
        id: exp.id,
        title: exp.company,
        role: exp.position,
        period: formatPeriod(exp.period_from, exp.period_to),
        duration: exp.duration ?? "",
        description:
            exp.responsibilities ?? (exp.description ? [exp.description] : DESCRIPTION_PLACEHOLDER),
    }));

    const totalDuration = calculateTotalDuration(items);

    const handleToggle = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#222]">Опыт работы</h2>
                {totalDuration && items.length > 0 && (
                    <span className="text-sm text-[#8A8A8A]">{totalDuration}</span>
                )}
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-[#8A8A8A]">Нет опыта работы</p>
            ) : (
                <div className="divide-y divide-[#EAEAEA]">
                    {items.map((exp) => (
                        <ExperienceItem
                            key={exp.id}
                            experience={exp}
                            isExpanded={expandedId === exp.id}
                            onToggle={() => handleToggle(exp.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
