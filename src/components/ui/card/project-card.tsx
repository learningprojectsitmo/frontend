import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";

export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
    tag: string;
    tagLabel?: string;
    title: string;
    description: string;
    progressValue: number;
    dateText: string;
    tags: Array<{ text: string }>;
    membersCount: number;
    users: Array<{ src?: string; name: string }>;
    archived?: boolean;
    className?: string;
    onKebabClick?: () => void;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
    in_progress: { bg: "#DBEAFE", text: "#2563EB" },
    review: { bg: "#FEF3C7", text: "#D97706" },
    planned: { bg: "#E5E7EB", text: "#6B7280" },
    completed: { bg: "#DCFCE7", text: "#16A34A" },
    draft: { bg: "#E5E7EB", text: "#6B7280" },
};

const statusLabels: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    draft: "Черновик",
};

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
    (
        {
            tag,
            tagLabel,
            title,
            description,
            progressValue,
            dateText,
            tags,
            membersCount,
            users,
            archived = false,
            onKebabClick,
            className,
            ...props
        },
        ref,
    ) => {
        const statusKey = archived ? "draft" : tag;
        const statusStyle = statusStyles[statusKey] || statusStyles.draft;
        const label = tagLabel || statusLabels[statusKey] || statusKey;

        const displayUsers = users.slice(0, 3);
        const remainingCount = users.length - 3;

        return (
            <div
                ref={ref}
                className={cn(
                    "bg-white border border-[#E5E7EB] rounded-[20px] transition-all duration-200",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]",
                    "hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
                    "min-w-[320px] h-full flex flex-col",
                    archived && "opacity-90",
                    className,
                )}
                {...props}
            >
                <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Card Header: Status badge + kebab */}
                    <div className="flex items-start justify-between">
                        <span
                            className="inline-flex items-center h-7 px-2.5 rounded-full text-[13px] font-medium leading-none"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                            {label}
                        </span>
                        {onKebabClick && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onKebabClick();
                                }}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-[#6B7280]"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                                    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                                    <circle cx="10" cy="15" r="1.5" fill="currentColor" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[24px] font-bold text-[#111827] leading-[1.3] line-clamp-2">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-[14px] leading-[1.6] text-app-muted line-clamp-3">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Progress Section */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[12px] text-[#9CA3AF]">Прогресс</span>
                        <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[#111827] transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
                            />
                        </div>
                    </div>

                    {/* Deadline Row */}
                    {dateText && (
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#6B7280] shrink-0" />
                            <span className="text-[13px] text-[#4B5563]">{dateText}</span>
                        </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((t, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center h-6 px-2 rounded-[8px] bg-[#F3F4F6] text-[12px] font-medium text-app-text leading-none"
                                >
                                    {t.text}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Card Footer */}
                <div className="px-5 pt-4 pb-5 border-t border-[#F1F1F1]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-[#6B7280] shrink-0" />
                            <span className="text-[13px] text-[#4B5563]">
                                {membersCount} участника
                            </span>
                        </div>

                        {/* Avatars */}
                        <div className="flex items-center">
                            {displayUsers.map((user, index) => (
                                <div
                                    key={index}
                                    className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center border-2 border-white text-[11px] font-semibold text-[#111827]"
                                    style={{ marginLeft: index > 0 ? "-8px" : "0" }}
                                    title={user.name}
                                >
                                    {user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>
                            ))}
                            {remainingCount > 0 && (
                                <div
                                    className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center border-2 border-white text-[11px] font-semibold text-[#6B7280]"
                                    style={{ marginLeft: "-8px" }}
                                >
                                    +{remainingCount}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
