import { Calendar } from "lucide-react";
import { Link } from "react-router";
import { type ProjectListItemResponse } from "@/types/api";
import { paths } from "@/config/paths";

const statusLabels: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    draft: "Черновик",
    archived: "Архив",
};

const statusStyles: Record<string, { bg: string; text: string }> = {
    in_progress: { bg: "#DBEAFE", text: "#2563EB" },
    review: { bg: "#FEF3C7", text: "#D97706" },
    planned: { bg: "#E5E7EB", text: "#6B7280" },
    completed: { bg: "#DCFCE7", text: "#16A34A" },
    draft: { bg: "#E5E7EB", text: "#6B7280" },
    archived: { bg: "#E5E7EB", text: "#6B7280" },
};

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

type SpaceProjectTableProps = {
    projects: ProjectListItemResponse[];
};

export function SpaceProjectTable({ projects }: SpaceProjectTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="text-app-text border-b border-[#E5E7EB] bg-[#FAFAFA]">
                    <tr>
                        <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                            Название
                        </th>
                        <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                            Теги
                        </th>
                        <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                            Участники
                        </th>
                        <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                            Дедлайн
                        </th>
                        <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                            Прогресс
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => {
                        const statusName = project.status?.name || "draft";
                        const style = statusStyles[statusName] || statusStyles.draft;
                        const label = statusLabels[statusName] || statusName;

                        const displayUsers = project.participants_preview.slice(0, 3);
                        const remainingCount = project.participants_count - 3;

                        return (
                            <tr
                                key={project.id}
                                className="group border-b border-[#F3F4F6] transition-colors hover:bg-[#F9FAFB]"
                            >
                                <td className="px-6 py-4">
                                    <Link
                                        to={paths.app.project.getHref(project.id)}
                                        className="flex items-center gap-3"
                                    >
                                        <span
                                            className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium leading-none shrink-0"
                                            style={{ backgroundColor: style.bg, color: style.text }}
                                        >
                                            {label}
                                        </span>
                                        <span className="text-[14px] font-medium text-[#111827] group-hover:text-[#2563EB] transition-colors">
                                            {project.name}
                                        </span>
                                    </Link>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.tags.length > 0 ? (
                                            project.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center h-6 px-2 rounded-[8px] bg-[#F3F4F6] text-[12px] font-medium text-[#111827] leading-none"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[13px] text-[#9CA3AF]">—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center">
                                            {displayUsers.length > 0 ? (
                                                displayUsers.map((user, i) => (
                                                    <div
                                                        key={user.id}
                                                        className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center border-2 border-white text-[11px] font-semibold text-[#111827]"
                                                        style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                                                        title={user.full_name}
                                                    >
                                                        {getInitials(user.full_name)}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-[#F3F4F6] flex items-center justify-center border-2 border-white text-[11px] font-semibold text-[#9CA3AF]">
                                                    ?
                                                </div>
                                            )}
                                            {remainingCount > 0 && (
                                                <div
                                                    className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center border-2 border-white text-[11px] font-semibold text-[#6B7280]"
                                                    style={{ marginLeft: "-8px" }}
                                                >
                                                    +{remainingCount}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[13px] text-[#6B7280]">
                                            {project.participants_count}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {project.deadline ? (
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                size={14}
                                                className="text-[#9CA3AF] shrink-0"
                                            />
                                            <span className="text-[13px] text-[#4B5563]">
                                                {formatDate(project.deadline)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[13px] text-[#9CA3AF]">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[100px] h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#111827] transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, project.progress))}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[12px] font-medium text-[#6B7280] w-8 text-right tabular-nums">
                                            {project.progress}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
