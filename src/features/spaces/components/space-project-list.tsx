import { useState, useMemo } from "react";
import { Link } from "react-router";
import { SearchBar } from "@/components/ui/search-bar";
import { Tabs } from "@/components/ui/tabs/tabs";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ProjectCard } from "@/components/ui/card/project-card";
import { Icon, type IconName } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { type ProjectListItemResponse } from "@/types/api";

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

    const tagVariant = isArchived
        ? "disabled"
        : statusName === "in_progress"
          ? "info"
          : statusName === "completed"
            ? "success"
            : statusName === "review"
              ? "warning"
              : statusName === "planned"
                ? "default"
                : "default";

    return {
        id: item.id,
        tag: statusName,
        tagVariant: tagVariant as "disabled" | "info" | "success" | "warning" | "default",
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

export function SpaceProjectList({ projects, total, isLoading, isError }: SpaceProjectListProps) {
    const [activeView, setActiveView] = useState("grid");
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(9);

    const mappedProjects = useMemo(() => projects.map(mapProjectListItem), [projects]);

    const titles = mappedProjects.map((p) => p.title);
    const descriptions = mappedProjects.map((p) => p.description);
    const suggestions = [...titles, ...descriptions];

    const filteredProjects = useMemo(() => {
        if (!search) return mappedProjects;
        return mappedProjects.filter(
            (project) =>
                project.title.toLowerCase().includes(search.toLowerCase()) ||
                project.description.toLowerCase().includes(search.toLowerCase()),
        );
    }, [mappedProjects, search]);

    const visibleProjects = useMemo(() => {
        return filteredProjects.slice(0, visibleCount);
    }, [filteredProjects, visibleCount]);

    const hasMore = visibleCount < total;
    const handleLoadMore = () => setVisibleCount((prev) => prev + 6);

    const viewTabs = [{ value: "grid", icon: "grid" as IconName }];

    return (
        <section className="pt-4">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Проекты</h2>

                <div className="flex flex-row items-center gap-3">
                    <SearchBar
                        placeholder="Ищите проекты"
                        onChange={setSearch}
                        suggestions={suggestions}
                        value={search}
                        className="w-[300px]"
                    />
                    <Tabs
                        tabs={viewTabs}
                        value={activeView}
                        onValueChange={setActiveView}
                        variant="icon"
                        className="w-auto"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : isError ? (
                <div className="text-center py-16 text-red-400 text-sm">
                    Не удалось загрузить проекты. Попробуйте обновить страницу.
                </div>
            ) : visibleProjects.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">
                    {search ? "Проекты не найдены" : "В этом пространстве пока нет проектов"}
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                    {visibleProjects.map((project) => (
                        <Link
                            key={project.id}
                            to={paths.app.project.getHref(project.id)}
                            className="block"
                        >
                            <ProjectCard
                                tag={project.tag}
                                tagVariant={project.tagVariant}
                                title={project.title}
                                description={project.description}
                                progressValue={project.progressValue}
                                dateText={project.dateText}
                                tags={project.tags}
                                membersCount={project.membersCount}
                                users={project.users}
                                archived={project.archived}
                                onKebabClick={() => alert(`Menu opened for ${project.title}`)}
                            />
                        </Link>
                    ))}
                </div>
            )}

            <div className="w-full flex justify-center">
                {hasMore && (
                    <button
                        onClick={handleLoadMore}
                        className="mt-4 px-4 py-2 font-sans text-[13px] font-semibold text-blue-600 rounded flex align-items gap-1"
                    >
                        <Icon name="arrow-down" width={16} height={16} />
                        Загрузить ещё
                    </button>
                )}
            </div>
        </section>
    );
}
