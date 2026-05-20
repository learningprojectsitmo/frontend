import { ContentLayout } from "@/components/layouts";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/card/project-card.tsx";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useState, useMemo } from "react";
import { type IconName } from "@/components/ui/icons";
import { useSpacesList } from "@/lib/spaces";
import { useProjectsList } from "@/lib/projects";
import { Icon } from "@/components/ui/icons";
import { useSearchParams } from "react-router";
import { GraduationCapIcon } from "lucide-react";
import { paths } from "@/config/paths";
import { SearchBar } from "@/components/ui/search-bar";
import { Spinner } from "@/components/ui/spinner/spinner";

import { Link } from "react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
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

    const tagVariant = isArchived ? "disabled"
        : statusName === "in_progress" ? "info"
        : statusName === "completed" ? "success"
        : statusName === "review" ? "warning"
        : statusName === "planned" ? "default"
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

const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataSpaces, isLoading: isSpacesLoading } = useSpacesList();
    const { data: dataProjects, isLoading: isProjectsLoading } = useProjectsList(urlId);

    const [activeView, setActiveView] = useState("grid");
    const [search, setSearch] = useState("");

    const spaceData = dataSpaces?.spaces.find((space) => String(space.id) === urlId);

    const mappedProjects = useMemo(() => {
        return (dataProjects?.items || []).map(mapProjectListItem);
    }, [dataProjects]);

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

    const [visibleCount, setVisibleCount] = useState(9);

    const visibleProjects = useMemo(() => {
        return filteredProjects.slice(0, visibleCount);
    }, [filteredProjects, visibleCount]);

    const hasMore = visibleCount < (dataProjects?.total || 0);
    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 6);
    };

    const viewTabs = [
        { value: "grid", icon: "grid" as IconName },
        { value: "settings", icon: "settings" as IconName },
    ];

    if (!spaceData) {
        if (isSpacesLoading) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <Spinner size="lg" />
                </div>
            );
        }
        return (
            <ContentLayout title="Пространство не найдено">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">Пространство не найдено</p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title={spaceData.title}>
            <div className="mx-auto max-w-7xl flex flex-col gap-6">
                <Breadcrumb className="h-[34px] flex align-center">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app" className="font-sans font-medium text-[16px]">
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                {spaceData.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="self-stretch inline-flex justify-between items-start">
                    <div className="flex justify-start items-start gap-5">
                        <div className="pt-1 flex justify-start items-center gap-2">
                            <div className="w-16 h-16 bg-color-azure-60 rounded-2xl flex justify-center items-center">
                                <div
                                    className={`${spaceData.color} rounded-lg  text-white h-16 w-16 flex items-center justify-center`}
                                >
                                    <GraduationCapIcon size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="inline-flex flex-col justify-start items-start gap-0.5">
                            <div className="self-stretch inline-flex justify-start items-center gap-3">
                                <div className="justify-center text-color-grey-4 text-3xl font-semibold font-sans leading-9">
                                    {spaceData.title}
                                </div>
                                <div
                                    data-have-badge="False"
                                    data-icon-alignment="Default"
                                    data-size="Default"
                                    data-state="Default"
                                    data-type="Main"
                                    className="w-9 min-w-9 min-h-9 p-2 rounded-lg flex justify-center items-center"
                                >
                                    <Icon name="settings" size={20} className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start">
                                <div className="justify-center text-[#4A5565] text-base font-medium font-sans leading-7">
                                    {spaceData.description}
                                </div>
                            </div>
                            <div className="inline-flex justify-start items-center gap-3">
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <div className="justify-center text-[#4A5565] text-[13px] font-normal font-sans leading-5 tracking-tight">
                                            {spaceData.projectsCount} проектов
                                        </div>
                                    </div>
                                </div>
                                <div data-svg-wrapper className="relative">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="1.5"
                                            fill="var(--color-azure-46, #6A7282)"
                                        />
                                    </svg>
                                </div>
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <div className="justify-center text-[#4A5565] text-[13px] font-normal font-sans leading-5 tracking-tight">
                                            {spaceData.membersCount} участника
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {dataSpaces?.role !== "member" ? (
                        <Button
                            variant="dark"
                            size="hug36"
                            icon={<Plus size={18} />}
                            className="font-sans text-[13px] font-semibold gap-2"
                        >
                            Создать проект
                        </Button>
                    ) : (
                        ""
                    )}
                </div>

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

                    {isProjectsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner size="lg" />
                        </div>
                    ) : visibleProjects.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            {search ? "Проекты не найдены" : "В этом пространстве пока нет проектов"}
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {visibleProjects.map((project) => (
                                <Link to={paths.app.project.getHref(project.id)}>
                                    <ProjectCard
                                        key={project.id}
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
            </div>
        </ContentLayout>
    );
};

export default SpaceRoute;
