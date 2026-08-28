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
    in_progress: { bg: "var(--status-inprogress-bg)", text: "var(--status-inprogress-text)" },
    review: { bg: "var(--status-review-bg)", text: "var(--status-review-text)" },
    planned: { bg: "var(--status-planned-bg)", text: "var(--status-planned-text)" },
    completed: { bg: "var(--status-completed-bg)", text: "var(--status-completed-text)" },
    draft: { bg: "var(--status-draft-bg)", text: "var(--status-draft-text)" },
    archived: { bg: "var(--status-draft-bg)", text: "var(--status-draft-text)" },
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
                <thead className="text-app-text border-b border-gray-200 bg-gray-50">
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
                                className="group border-b border-gray-100 transition-colors hover:bg-gray-50"
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
                                        <span className="text-[14px] font-medium text-gray-900 group-hover:text-[#2563EB] transition-colors">
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
                                                    className="inline-flex items-center h-6 px-2 rounded-[8px] bg-gray-100 text-[12px] font-medium text-gray-900 leading-none"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[13px] text-gray-400">—</span>
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
                                                        className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white text-[11px] font-semibold text-gray-900"
                                                        style={{ marginLeft: i > 0 ? "-8px" : "0" }}
                                                        title={user.full_name}
                                                    >
                                                        {getInitials(user.full_name)}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white text-[11px] font-semibold text-gray-400">
                                                    ?
                                                </div>
                                            )}
                                            {remainingCount > 0 && (
                                                <div
                                                    className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white text-[11px] font-semibold text-gray-500"
                                                    style={{ marginLeft: "-8px" }}
                                                >
                                                    +{remainingCount}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[13px] text-gray-500">
                                            {project.participants_count}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {project.deadline ? (
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                size={14}
                                                className="text-gray-400 shrink-0"
                                            />
                                            <span className="text-[13px] text-gray-600">
                                                {formatDate(project.deadline)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[13px] text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gray-900 transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, project.progress))}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[12px] font-medium text-gray-500 w-8 text-right tabular-nums">
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
