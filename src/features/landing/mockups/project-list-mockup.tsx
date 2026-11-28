import { useTranslation } from "react-i18next";
import { GraduationCap, LayoutGrid, List, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ui/card/project-card";
import { Icon } from "@/components/ui/icons";
import { FilterTrigger } from "@/features/spaces/components/filters/filter-trigger";

import { AppWindowMockup } from "./app-window-mockup";

type MockProject = {
    title: string;
    description: string;
    tag: string;
    status: string;
    progress: number;
    date: string;
    stage: string;
    tags: string[];
    members: number;
    people: string[];
};

type SpaceMock = {
    breadcrumb: string;
    title: string;
    description: string;
    projectsCount: string;
    membersCount: string;
    createProject: string;
    exams: string;
};

/**
 * Мокап страницы пространства: шапка пространства и список проектов. Карточки
 * и кнопка фильтров — настоящие компоненты приложения, а маппинг полей совпадает
 * с `space-project-list`: этап, дедлайн, теги, участники и аватары.
 */
export const ProjectListMockup = () => {
    const { t } = useTranslation();

    const space = t("landing.mockup.space", { returnObjects: true }) as unknown as SpaceMock;
    const projects = t("landing.mockup.projects", { returnObjects: true }) as MockProject[];

    return (
        <AppWindowMockup url="eduflow.app/app/space" label={t("landing.hero.mockupLabel")}>
            <div className="p-3 sm:p-5">
                <p className="text-[10px] text-gray-400">{space.breadcrumb}</p>

                {/* Шапка пространства */}
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-500 text-white">
                            <GraduationCap size={24} />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="truncate text-[18px] font-bold leading-tight text-gray-900">
                                    {space.title}
                                </p>
                                <Icon
                                    name="settings"
                                    size={16}
                                    className="shrink-0 text-gray-500"
                                />
                            </div>
                            <p className="text-[11px] text-gray-500">{space.description}</p>
                            <p className="mt-1 text-[10px] text-gray-400">
                                {space.projectsCount} · {space.membersCount}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="dark"
                            size="hug36"
                            icon={<Plus size={16} />}
                            className="!h-10 !rounded-[12px] !px-4 !text-[11px]"
                        >
                            {space.createProject}
                        </Button>
                        <Button
                            variant="outline"
                            size="hug36"
                            icon={<Icon name="exam" size={14} />}
                            className="!h-10 !rounded-[12px] !px-4 !text-[11px]"
                        >
                            {space.exams}
                        </Button>
                    </div>
                </div>

                {/* Тулбар списка проектов */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[13px] font-semibold text-gray-900">
                        {t("landing.mockup.projectsTitle")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[180px] flex-1 sm:w-[220px] sm:flex-none">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                readOnly
                                aria-label={t("landing.mockup.search")}
                                placeholder={t("landing.mockup.search")}
                                className="h-10 w-full rounded-[12px] border border-gray-200 bg-app-surface pl-8 pr-3 text-[12px] text-gray-900 outline-none placeholder:text-gray-400"
                            />
                        </div>
                        <FilterTrigger
                            activeCount={0}
                            open={false}
                            onClick={() => {}}
                            label={t("landing.mockup.filterLabel")}
                        />
                        <div className="flex h-10 items-center overflow-hidden rounded-[12px] border border-gray-200 bg-app-surface">
                            <span
                                aria-label={t("landing.mockup.gridLabel")}
                                className="grid h-full w-10 place-items-center bg-gray-900 text-white dark:bg-gray-100"
                            >
                                <LayoutGrid size={15} />
                            </span>
                            <span
                                aria-label={t("landing.mockup.listLabel")}
                                className="grid h-full w-10 place-items-center text-gray-500"
                            >
                                <List size={15} />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Карточки проектов — реальный компонент приложения */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.title}
                            tag={project.tag}
                            tagLabel={project.status}
                            title={project.title}
                            description={project.description}
                            progressValue={project.progress}
                            dateText={project.date}
                            stageText={project.stage}
                            tags={project.tags.map((text) => ({ text }))}
                            membersCount={project.members}
                            users={project.people.map((name) => ({ name }))}
                            progressLabel={t("landing.mockup.progressLabel")}
                            membersLabel={t("landing.mockup.membersLabel")}
                        />
                    ))}
                </div>
            </div>
        </AppWindowMockup>
    );
};
