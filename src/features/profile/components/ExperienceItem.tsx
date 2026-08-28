import { Pencil, Folder, Building2, ChevronDown, ChevronUp } from "lucide-react";

const INITIAL_VISIBLE = 3;

const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("стажировка") || lower.includes("intern")) {
        return Building2;
    }
    return Folder;
};

type Props = {
    experience: {
        id: number;
        title: string;
        role: string;
        period: string;
        duration: string;
        description: string[];
    };
    isExpanded: boolean;
    onToggle: () => void;
};

export const ExperienceItem = ({ experience, isExpanded, onToggle }: Props) => {
    const { title, role, period, duration, description } = experience;
    const IconComponent = getIcon(title);
    const visibleItems = isExpanded ? description : description.slice(0, INITIAL_VISIBLE);
    const isTruncated = description.length > INITIAL_VISIBLE;

    return (
        <div className="py-5 first:pt-0 last:pb-0 group">
            <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                    <IconComponent className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate leading-snug">
                            {title}
                        </h3>

                        <button
                            className="shrink-0 text-gray-500 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Редактировать"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                        {period}
                        {duration ? <span> ({duration})</span> : null}
                    </p>

                    <p className="text-[15px] font-bold text-gray-900 mt-1.5">{role}</p>

                    {visibleItems.length > 0 && (
                        <ul className="mt-2.5 space-y-1">
                            {visibleItems.map((item, i) => (
                                <li
                                    key={i}
                                    className="text-sm text-gray-900 leading-relaxed flex items-start gap-1.5"
                                >
                                    <span className="text-gray-400 shrink-0 select-none">—</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}

                    {isTruncated && (
                        <button
                            onClick={onToggle}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#4F6BFF] hover:text-blue-700 transition-colors"
                        >
                            {isExpanded ? (
                                <>
                                    Свернуть <ChevronUp className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Развернуть <ChevronDown className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
