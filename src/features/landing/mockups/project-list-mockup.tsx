import { useTranslation } from "react-i18next";

import { ProjectCard } from "@/components/ui/card/project-card";
import { Icon } from "@/components/ui/icons";

/**
 * Иллюстрация единого списка проектов — того самого, о чём говорит заголовок
 * hero. Карточки здесь не нарисованы: это настоящий `ProjectCard` из
 * приложения с теми же пропсами, что получает `space-project-list`. Благодаря
 * этому мокап физически не может разойтись с реальным интерфейсом: новая карточка
 * или правка существующей автоматически попадают и на лендинг.
 *
 * `ProjectCard` — презентационный компонент без query/router-контекста, поэтому
 * его можно отрендерить вне приложения.
 */
export const ProjectListMockup = () => {
    const { t } = useTranslation();

    const projects = t("landing.mockup.projects", { returnObjects: true }) as Array<{
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
    }>;

    const filters = t("landing.mockup.filters", { returnObjects: true }) as string[];

    return (
        <div
            role="img"
            aria-label={t("landing.hero.mockupLabel")}
            className="pointer-events-none w-full select-none overflow-hidden rounded-2xl border border-gray-200 bg-app-surface shadow-2xl shadow-gray-900/5"
        >
            {/* Шапка «браузера» */}
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
                <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5">
                    <Icon name="magnifier" size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">{t("landing.mockup.search")}</span>
                </div>
            </div>

            {/* Панель фильтров — те, что реально есть в списке проектов */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3">
                {filters.map((filter) => (
                    <span
                        key={filter}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                        {filter}
                        <Icon name="arrow-down" size={10} className="text-gray-400" />
                    </span>
                ))}
                <span className="ml-auto text-xs text-gray-400">
                    {t("landing.mockup.totalProjects", { count: projects.length })}
                </span>
            </div>

            {/* Карточки проектов — реальный компонент приложения */}
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
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
                        membersLabel={t("landing.mockup.membersLabel", {
                            count: project.members,
                        })}
                    />
                ))}
            </div>
        </div>
    );
};
