import { useState, useMemo } from "react";
import { useProfileProjects } from "@/features/profile/api/use-profile-data";
import { ProjectCard } from "@/components/ui/card/project-card";
import { ListToolbar } from "./list-toolbar";
import { Link } from "react-router";
import { paths } from "@/config/paths";

const statusToTag: Record<string, { tag: string; label: string }> = {
    in_progress: { tag: "in_progress", label: "В процессе" },
    paused: { tag: "paused", label: "На паузе" },
    completed: { tag: "completed", label: "Завершен" },
    not_started: { tag: "not_started", label: "Не завершен" },
};

export function ProjectsSection() {
    const { data: projects, isLoading } = useProfileProjects();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const items = useMemo(() => projects ?? [], [projects]);

    const filteredItems = useMemo(() => {
        if (!search) return items;
        const q = search.toLowerCase();
        return items.filter(
            (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
        );
    }, [items, search]);

    if (isLoading) {
        return (
            <div>
                <ListToolbar
                    title="Мои проекты"
                    searchPlaceholder="Поиск проектов..."
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={0}
                    onOpenFilters={() => {}}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div>
                <ListToolbar
                    title="Мои проекты"
                    searchPlaceholder="Поиск проектов..."
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={0}
                    onOpenFilters={() => {}}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />
                <div className="text-center py-16 text-[14px] text-[#6B7280]">
                    У вас пока нет проектов
                </div>
            </div>
        );
    }

    return (
        <div>
            <ListToolbar
                title="Мои проекты"
                searchPlaceholder="Поиск проектов..."
                searchValue={search}
                onSearch={setSearch}
                filtersCount={0}
                onOpenFilters={() => {}}
                viewMode={viewMode}
                onChangeView={setViewMode}
            />

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-[14px] text-[#6B7280]">
                    Проекты не найдены
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                    {filteredItems.map((project) => {
                        const tagInfo = statusToTag[project.status] || statusToTag.not_started;
                        return (
                            <Link
                                key={project.id}
                                to={paths.app.project.getHref(project.id)}
                                className="block h-full"
                            >
                                <ProjectCard
                                    tag={tagInfo.tag}
                                    tagLabel={tagInfo.label}
                                    title={project.title}
                                    description={project.description}
                                    progressValue={project.progress}
                                    dateText={
                                        project.startDate ? `Старт: ${project.startDate}` : ""
                                    }
                                    tags={project.roles.map((r) => ({ text: r }))}
                                    membersCount={project.membersCount}
                                    users={[]}
                                />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Название</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Статус</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Прогресс</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Участники</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">
                                    Дата старта
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((project) => {
                                const tagInfo =
                                    statusToTag[project.status] || statusToTag.not_started;
                                return (
                                    <tr
                                        key={project.id}
                                        className="border-b border-[#F3F4F6] cursor-pointer hover:bg-[#F9FAFB]"
                                        onClick={() => {}}
                                    >
                                        <td className="py-3 px-4 font-medium text-[#111827]">
                                            {project.title}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium"
                                                style={{
                                                    backgroundColor: "#DBEAFE",
                                                    color: "#2563EB",
                                                }}
                                            >
                                                {tagInfo.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-[#6B7280]">
                                            {project.progress}%
                                        </td>
                                        <td className="py-3 px-4 text-[#6B7280]">
                                            {project.membersCount}
                                        </td>
                                        <td className="py-3 px-4 text-[#6B7280]">
                                            {project.startDate}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
