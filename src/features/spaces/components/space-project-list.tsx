import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, List } from "lucide-react";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ProjectCard } from "@/components/ui/card/project-card";
import { paths } from "@/config/paths";
import { type ProjectListItemResponse } from "@/types/api";
import {
    ProjectFilters,
    defaultFiltersState,
    type FiltersState,
} from "@/features/spaces/components/filters";
import { SpaceProjectTable } from "@/features/spaces/components/space-project-table";

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

export function SpaceProjectList({
    projects,
    total: _total,
    isLoading,
    isError,
}: SpaceProjectListProps) {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<FiltersState>(defaultFiltersState);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [visibleCount, setVisibleCount] = useState(9);

    const filteredRaw = useMemo(() => {
        let result = projects;

        if (filters.statuses.length > 0) {
            result = result.filter((p) => {
                const statusName = p.status?.name || "draft";
                return filters.statuses.includes(statusName);
            });
        }

        if (filters.tags.length > 0) {
            result = result.filter((p) => p.tags.some((t) => filters.tags.includes(t)));
        }

        if (filters.members.length > 0) {
            result = result.filter((p) =>
                p.participants_preview.some((m) => filters.members.includes(m.id)),
            );
        }

        if (filters.datePreset !== "all") {
            result = result.filter((p) => {
                if (!p.deadline) return false;
                const d = new Date(p.deadline);
                const now = new Date();
                switch (filters.datePreset) {
                    case "today":
                        return (
                            d.getFullYear() === now.getFullYear() &&
                            d.getMonth() === now.getMonth() &&
                            d.getDate() === now.getDate()
                        );
                    case "7days": {
                        const diff = now.getTime() - d.getTime();
                        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
                    }
                    case "30days": {
                        const diff = now.getTime() - d.getTime();
                        return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
                    }
                    case "custom":
                        if (!filters.customDate) return true;
                        return d >= filters.customDate.from && d <= filters.customDate.to;
                    default:
                        return true;
                }
            });
        }

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.description || "").toLowerCase().includes(q),
            );
        }

        return result;
    }, [projects, search, filters]);

    const visibleRaw = useMemo(() => {
        return filteredRaw.slice(0, visibleCount);
    }, [filteredRaw, visibleCount]);

    const mappedProjects = useMemo(() => {
        return visibleRaw.map(mapProjectListItem);
    }, [visibleRaw]);

    const hasMore = visibleCount < filteredRaw.length;
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
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Поиск проектов"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[240px] h-10 pl-9 pr-3 bg-app-surface border border-gray-200 rounded-[12px] text-[14px] text-app-text placeholder:text-gray-400 outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>

                    <ProjectFilters
                        state={filters}
                        onChange={setFilters}
                        onReset={() => setFilters(defaultFiltersState)}
                        projects={projects}
                    />

                    {/* Grid/List toggle */}
                    <div className="flex items-center h-10 bg-app-surface border border-gray-200 rounded-[12px] overflow-hidden">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`px-3 h-full flex items-center transition-colors ${
                                viewMode === "grid"
                                    ? "bg-gray-900 text-white dark:bg-gray-100"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            <Icon name="grid" size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 h-full flex items-center transition-colors ${
                                viewMode === "list"
                                    ? "bg-gray-900 text-white dark:bg-gray-100"
                                    : "text-gray-500 hover:bg-gray-50"
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
            ) : filteredRaw.length === 0 ? (
                <div className="text-center py-16 text-app-muted text-sm">
                    {search ||
                    filters.statuses.length > 0 ||
                    filters.tags.length > 0 ||
                    filters.members.length > 0 ||
                    filters.datePreset !== "all"
                        ? "Проекты не найдены"
                        : "В этом пространстве пока нет проектов"}
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                    {mappedProjects.map((project) => (
                        <Link
                            key={project.id}
                            to={paths.app.project.getHref(project.id)}
                            className="block h-full"
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
                <div className="bg-app-surface rounded-[20px] border border-gray-200 overflow-hidden">
                    <SpaceProjectTable projects={visibleRaw} />
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
