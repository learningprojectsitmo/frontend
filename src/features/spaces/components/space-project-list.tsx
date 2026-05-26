import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Columns, List } from "lucide-react";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ProjectCard } from "@/components/ui/card/project-card";
import { paths } from "@/config/paths";
import { type ProjectListItemResponse } from "@/types/api";

const statusLabels: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    draft: "Черновик",
};

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function mapProjectListItem(item: ProjectListItemResponse) {
    const statusName = item.status?.name || "draft";
    const isArchived = statusName === "archived";

    return {
        id: item.id,
        tag: isArchived ? "draft" : statusName,
        tagLabel: statusLabels[statusName] || statusName,
        title: item.name,
        description: item.description || "",
        progressValue: item.progress,
        dateText: item.deadline ? `Дедлайн: ${formatDate(item.deadline)}` : "",
        tags: item.tags.map((t) => ({ text: t })),
        membersCount: item.participants_count,
        users: item.participants_preview.map((u) => ({ name: u.full_name })),
        archived: isArchived,
    };
}

type SpaceProjectListProps = {
    projects: ProjectListItemResponse[];
    total: number;
    isLoading: boolean;
    isError: boolean;
};

type StatusFilter = "all" | "active" | "archived";

export function SpaceProjectList({ projects, total, isLoading, isError }: SpaceProjectListProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [visibleCount, setVisibleCount] = useState(9);

    const mappedProjects = useMemo(() => projects.map(mapProjectListItem), [projects]);

    const filteredProjects = useMemo(() => {
        let result = mappedProjects;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
            );
        }

        if (statusFilter === "active") {
            result = result.filter((p) => !p.archived);
        } else if (statusFilter === "archived") {
            result = result.filter((p) => p.archived);
        }

        return result;
    }, [mappedProjects, search, statusFilter]);

    const visibleProjects = useMemo(() => {
        return filteredProjects.slice(0, visibleCount);
    }, [filteredProjects, visibleCount]);

    const hasMore = visibleCount < total;
    const handleLoadMore = () => setVisibleCount((prev) => prev + 6);

    return (
        <section>
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-app-text">Проекты</h2>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                        />
                        <input
                            type="text"
                            placeholder="Поиск проектов"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[240px] h-10 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[14px] text-app-text placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center h-10 bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                        {(["all", "active", "archived"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-3 h-full text-[13px] font-medium transition-colors ${
                                    statusFilter === f
                                        ? "bg-[#111827] text-white"
                                        : "text-[#6B7280] hover:bg-gray-50"
                                }`}
                            >
                                {f === "all" ? "Все" : f === "active" ? "Активные" : "Архив"}
                            </button>
                        ))}
                    </div>

                    {/* Grid/List toggle */}
                    <div className="flex items-center h-10 bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`px-3 h-full flex items-center transition-colors ${
                                viewMode === "grid"
                                    ? "bg-[#111827] text-white"
                                    : "text-[#6B7280] hover:bg-gray-50"
                            }`}
                        >
                            <Columns size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 h-full flex items-center transition-colors ${
                                viewMode === "list"
                                    ? "bg-[#111827] text-white"
                                    : "text-[#6B7280] hover:bg-gray-50"
                            }`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : isError ? (
                <div className="text-center py-16 text-red-400 text-sm">
                    Не удалось загрузить проекты. Попробуйте обновить страницу.
                </div>
            ) : visibleProjects.length === 0 ? (
                <div className="text-center py-16 text-app-muted text-sm">
                    {search || statusFilter !== "all"
                        ? "Проекты не найдены"
                        : "В этом пространстве пока нет проектов"}
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-6">
                    {visibleProjects.map((project) => (
                        <Link
                            key={project.id}
                            to={paths.app.project.getHref(project.id)}
                            className="block"
                        >
                            <ProjectCard
                                tag={project.tag}
                                tagLabel={project.tagLabel}
                                title={project.title}
                                description={project.description}
                                progressValue={project.progressValue}
                                dateText={project.dateText}
                                tags={project.tags}
                                membersCount={project.membersCount}
                                users={project.users}
                                archived={project.archived}
                            />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6">
                    <p className="text-app-muted text-sm">List view coming soon</p>
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <div className="w-full flex justify-center mt-8">
                    <button
                        onClick={handleLoadMore}
                        className="text-[14px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                    >
                        Загрузить ещё
                    </button>
                </div>
            )}
        </section>
    );
}
