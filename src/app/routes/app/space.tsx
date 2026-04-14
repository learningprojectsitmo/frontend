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

import { Link } from "react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";

const projects = [
    {
        id: 1,
        tag: "In Progress",
        tagVariant: "info" as const,
        title: "AI Learning Platform",
        description: "Разработка цифровой платформы с ИИ",
        progressValue: 75,
        dateText: "Дедлайн: 31 мая 2024",
        tags: [{ text: "Frontend" }, { text: "AI/ML" }, { text: "Design" }],
        membersCount: 8,
        users: [
            { name: "Анна С." },
            { name: "Михаил К." },
            { name: "Елена В." },
            { name: "Дмитрий П." },
        ],
        archived: false,
    },
    {
        id: 2,
        tag: "In Progress",
        tagVariant: "info" as const,
        title: "Мобильное приложение",
        description: "Разработка iOS и Android приложений",
        progressValue: 45,
        dateText: "Дедлайн: 15 июня 2024",
        tags: [{ text: "Mobile" }, { text: "iOS" }, { text: "Android" }],
        membersCount: 6,
        users: [{ name: "Иван П." }, { name: "Мария С." }, { name: "Алексей К." }],
        archived: false,
    },
    {
        id: 3,
        tag: "Archive",
        tagVariant: "disabled" as const,
        title: "Редизайн сайта",
        description: "Обновление дизайна корпоративного сайта",
        progressValue: 100,
        dateText: "Завершен: 10 апреля 2024",
        tags: [{ text: "Design" }, { text: "UI/UX" }],
        membersCount: 4,
        users: [{ name: "Ольга Н." }, { name: "Павел Р." }],
        archived: true,
    },
    {
        id: 1,
        tag: "In Progress",
        tagVariant: "info" as const,
        title: "AI Learning Platform",
        description: "Разработка цифровой платформы с ИИ",
        progressValue: 75,
        dateText: "Дедлайн: 31 мая 2024",
        tags: [{ text: "Frontend" }, { text: "AI/ML" }, { text: "Design" }],
        membersCount: 8,
        users: [
            { name: "Анна С." },
            { name: "Михаил К." },
            { name: "Елена В." },
            { name: "Дмитрий П." },
        ],
        archived: false,
    },
    {
        id: 2,
        tag: "In Progress",
        tagVariant: "info" as const,
        title: "Мобильное приложение",
        description: "Разработка iOS и Android приложений",
        progressValue: 45,
        dateText: "Дедлайн: 15 июня 2024",
        tags: [{ text: "Mobile" }, { text: "iOS" }, { text: "Android" }],
        membersCount: 6,
        users: [{ name: "Иван П." }, { name: "Мария С." }, { name: "Алексей К." }],
        archived: false,
    },
    {
        id: 3,
        tag: "Archive",
        tagVariant: "disabled" as const,
        title: "Редизайн сайта",
        description: "Обновление дизайна корпоративного сайта",
        progressValue: 100,
        dateText: "Завершен: 10 апреля 2024",
        tags: [{ text: "Design" }, { text: "UI/UX" }],
        membersCount: 4,
        users: [{ name: "Ольга Н." }, { name: "Павел Р." }],
        archived: true,
    },
];

const spaces = [
    {
        id: 1,
        title: "Управление проектами",
        projectsCount: 8,
        membersCount: 24,
        color: "bg-blue-500",
        category: "Дисциплина",
        description: "Проекты по планированию, организации и контролю проектной работы",
    },
    {
        id: 2,
        title: "Проектная деятельность",
        projectsCount: 5,
        membersCount: 12,
        color: "bg-indigo-500",
        category: "Дисциплина",
        description: "Практические проекты, направленные на командную работу и применение знаний",
    },
    {
        id: 3,
        title: "Управление процессами",
        projectsCount: 12,
        membersCount: 128,
        color: "bg-red-500",
        category: "Дисциплина",
        description: "Проекты для знакомства с профессией и основами профессиональной работы",
    },
    {
        id: 4,
        title: "Управление проектами",
        projectsCount: 8,
        membersCount: 24,
        color: "bg-blue-500",
        category: "Дисциплина",
        description: "Проекты по планированию, организации и контролю проектной работы",
    },
    {
        id: 5,
        title: "Проектная деятельность",
        projectsCount: 5,
        membersCount: 12,
        color: "bg-indigo-500",
        category: "Дисциплина",
        description: "Практические проекты, направленные на командную работу и применение знаний",
    },
    {
        id: 6,
        title: "Управление процессами",
        projectsCount: 12,
        membersCount: 128,
        color: "bg-red-500",
        category: "Дисциплина",
        description: "Проекты для знакомства с профессией и основами профессиональной работы",
    },
];

const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataSpaces } = useSpacesList();
    const { data: dataProjects } = useProjectsList(urlId);

    const [activeView, setActiveView] = useState("grid");

    const [search, setSearch] = useState("");
    const titles = (dataProjects || projects).map((project) => project.title) || [];
    const descriptions = (dataProjects || projects).map((project) => project.description) || [];

    const suggestions = [...titles, ...descriptions];

    const spaceData = (dataSpaces?.spaces || spaces).find((space) => String(space.id) === urlId);

    const filteredProjects = useMemo(() => {
        if (!search) return dataProjects || projects;
        return (dataProjects || projects).filter(
            (project) =>
                project.title.toLowerCase().includes(search.toLowerCase()) ||
                project.description.toLowerCase().includes(search.toLowerCase()),
        );
    }, [dataProjects, search]);

    const [visibleCount, setVisibleCount] = useState(9);

    const visibleProjects = useMemo(() => {
        return filteredProjects.slice(0, visibleCount);
    }, [filteredProjects, visibleCount]);

    //const hasMore = visibleCount < (dataSpaces?.spaces || []).length;
    const hasMore = true;
    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 6);
    };

    const viewTabs = [
        { value: "grid", icon: "grid" as IconName },
        { value: "settings", icon: "settings" as IconName },
    ];

    if (!spaceData) {
        return <div>Пространство не найдено</div>;
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
