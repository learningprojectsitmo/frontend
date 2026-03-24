import { ContentLayout } from "@/components/layouts";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpacesCard } from "@/components/ui/card/spaces-card.tsx";
import { ProjectCard } from "@/components/ui/card/project-card.tsx";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useState, useMemo } from "react";
import { type IconName } from "@/components/ui/icons";
import { useSpacesList } from "@/lib/spaces";
import { useProjectsList } from "@/lib/projects";
import { Icon } from "@/components/ui/icons";

const SpaceRoute = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [activeView, setActiveView] = useState("grid");

    const { data: dataSpaces } = useSpacesList(); //, isLoading: isLoadingSpaces, error: errorSpaces
    const { data: dataProjects } = useProjectsList(); // isLoading: isLoadingProjects, error: errorProjects

    const [visibleCount, setVisibleCount] = useState(6);

    const visibleSpaces = useMemo(() => {
        return dataSpaces?.spaces.slice(0, visibleCount);
    }, [dataSpaces, visibleCount]);

    //const hasMore = visibleCount < (dataSpaces?.spaces || []).length;
    const hasMore = true;
    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 6);
    };

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
            description:
                "Практические проекты, направленные на командную работу и применение знаний",
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
            description:
                "Практические проекты, направленные на командную работу и применение знаний",
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
    ];

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
    ];

    const textTabs = [
        { value: "all", label: "Все проекты" },
        { value: "active", label: "Активные" },
        { value: "archived", label: "Архив" },
        { value: "templates", label: "Шаблоны" },
    ];

    const viewTabs = [
        { value: "grid", icon: "grid" as IconName },
        { value: "settings", icon: "settings" as IconName },
    ];

    return (
        <ContentLayout title="Все пространства">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="mb-1 text-2xl font-bold text-gray-900">Все пространства</h1>
                        <p className="text-sm text-gray-500">
                            Управляйте своими образовательными проектами и инициативами
                        </p>
                    </div>
                    {dataSpaces?.role !== "member" ? (
                        <Button variant="dark" size="hug36" icon={<Plus size={18} />}>
                            Создать проект
                        </Button>
                    ) : (
                        ""
                    )}
                </div>

                <section className="mb-12">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Ваши пространства</h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {(visibleSpaces || spaces).map((space) => (
                            <SpacesCard
                                key={space.id}
                                iconName="discipline"
                                iconColor={space.color}
                                tag={space.category}
                                title={space.title}
                                description={space.description}
                                firstMetricText={`${space.projectsCount} проектов`}
                                secondMetricText={`${space.membersCount} участника`}
                            />
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

                <section className="mb-8">
                    <Tabs
                        tabs={textTabs}
                        value={activeTab}
                        onValueChange={setActiveTab}
                        variant="text"
                        className="mb-6"
                    />

                    <div className="rounded-xl border border-[--color-black-10] bg-white p-6">
                        {activeTab === "all" && (
                            <div className="text-sm text-gray-500">
                                Показаны все проекты: активные, завершенные и архивные
                            </div>
                        )}
                        {activeTab === "active" && (
                            <div className="text-sm text-gray-500">
                                Проекты, которые находятся в активной разработке
                            </div>
                        )}
                        {activeTab === "archived" && (
                            <div className="text-sm text-gray-500">
                                Завершенные проекты и проекты в архиве
                            </div>
                        )}
                        {activeTab === "templates" && (
                            <div className="text-sm text-gray-500">
                                Используйте шаблоны для быстрого создания новых проектов
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Недавние проекты</h2>

                        <Tabs
                            tabs={viewTabs}
                            value={activeView}
                            onValueChange={setActiveView}
                            variant="icon"
                            className="w-auto"
                        />
                    </div>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {(dataProjects || projects).map((project) => (
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
                        ))}
                    </div>
                </section>
            </div>
        </ContentLayout>
    );
};

export default SpaceRoute;
