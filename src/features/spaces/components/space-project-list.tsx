import { useState } from "react";
import { Link } from "react-router";
import { Search, List } from "lucide-react";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ProjectCard } from "@/components/ui/card/project-card";
import { paths } from "@/config/paths";
import { type ProjectListItemResponse } from "@/types/api";
import { ProjectFilters } from "@/features/spaces/components/filters/project-filters";
import type {
    FiltersState,
    ProjectFilterOptions,
} from "@/features/spaces/components/filters/types";
import { Pagination } from "@/features/spaces/components/pagination";
import { SpaceProjectTable } from "@/features/spaces/components/space-project-table";

const statusLabels: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    archived: "Архив",
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
    const statusName = item.status?.name || "";
    const isArchived = statusName === "archived";

    return {
        id: item.id,
        tag: statusName,
        tagLabel: statusLabels[statusName] || "",
        title: item.name,
        description: item.description || "",
        progressValue: item.progress,
        dateText: item.deadline ? `Дедлайн: ${formatDate(item.deadline)}` : "",
        stageText: item.current_stage_name || "",
        tags: item.tags.map((t) => ({ text: t })),
        membersCount: item.participants_count,
        users: item.participants_preview.map((u) => ({ name: u.full_name })),
        archived: isArchived,
    };
}

type SpaceProjectListProps = {
    /** Страница проектов с сервера: уже отфильтрованная и обрезанная по limit. */
    projects: ProjectListItemResponse[];
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
    isError: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    filters: FiltersState;
    onFiltersChange: (filters: FiltersState) => void;
    onFiltersReset: () => void;
    filterOptions: ProjectFilterOptions;
};

export function SpaceProjectList({
    projects,
    total,
    page,
    totalPages,
    onPageChange,
    isLoading,
    isError,
    search,
    onSearchChange,
    filters,
    onFiltersChange,
    onFiltersReset,
    filterOptions,
}: SpaceProjectListProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const mappedProjects = projects.map(mapProjectListItem);
    const hasActiveFilters =
        Boolean(search) ||
        filters.statuses.length > 0 ||
        filters.tags.length > 0 ||
        filters.members.length > 0 ||
        filters.datePreset !== "all";

    return (
        <section>
            {/* Toolbar */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg font-semibold text-app-text">Проекты</h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Поиск проектов"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full min-w-[180px] sm:w-[240px] h-10 pl-9 pr-3 bg-app-surface border border-gray-200 rounded-[12px] text-[14px] text-app-text placeholder:text-gray-400 outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>

                    <ProjectFilters
                        state={filters}
                        onChange={onFiltersChange}
                        onReset={onFiltersReset}
                        options={filterOptions}
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
            ) : projects.length === 0 ? (
                <div className="text-center py-16 text-app-muted text-sm">
                    {hasActiveFilters
                        ? "Проекты не найдены"
                        : "В этом пространстве пока нет проектов"}
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))]">
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
                                stageText={project.stageText}
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
                    <SpaceProjectTable projects={projects} />
                </div>
            )}

            {total > 0 && (
                <div className="text-center mt-6 text-[13px] text-app-muted">
                    Показано {projects.length} из {total}
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </section>
    );
}
