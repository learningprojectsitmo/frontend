import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { SpacesCard } from "@/components/ui/card/spaces-card.tsx";
import { ProjectCard } from "@/components/ui/card/project-card.tsx";
import { useState, useMemo, useEffect } from "react";

import { useSpacesList } from "@/lib/spaces";
import { useProjectsByIds } from "@/lib/projects";
import { useRecentlyViewed } from "@/features/spaces/hooks/use-recently-viewed";
import { Icon } from "@/components/ui/icons";
import { Link } from "react-router";
import { paths } from "@/config/paths";
import { SearchBar } from "@/components/ui/search-bar/search-bar";
import { FilterTrigger } from "@/features/spaces/components/filters/filter-trigger";
import { FilterDropdown } from "@/features/spaces/components/filters/filter-dropdown";
import { FilterSection } from "@/features/spaces/components/filters/filter-section";
import { CheckboxGroup } from "@/features/spaces/components/filters/checkbox-group";
import { DateFilter } from "@/features/spaces/components/filters/date-filter";
import type { FiltersState } from "@/features/spaces/components/filters/types";
import { Archive, CircleDot, Calendar, LayoutGrid, List } from "lucide-react";
const STATUS_LABELS: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    draft: "Черновик",
    archived: "Архив",
};

const SpacesRoute = () => {
    const [activeView, setActiveView] = useState("grid");

    const { data: dataSpaces, isLoading: isLoadingSpaces } = useSpacesList();
    const { getViewedProjectIds } = useRecentlyViewed();
    const viewedIds = useMemo(() => getViewedProjectIds(), [getViewedProjectIds]);
    const { data: dataRecentProjects } = useProjectsByIds(viewedIds);

    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filterState, setFilterState] = useState<FiltersState>({
        statuses: [],
        tags: [],
        members: [],
        datePreset: "all",
    });

    const statusStyles: Record<string, { bg: string; text: string }> = {
        in_progress: { bg: "var(--status-inprogress-bg)", text: "var(--status-inprogress-text)" },
        review: { bg: "var(--status-review-bg)", text: "var(--status-review-text)" },
        planned: { bg: "var(--status-planned-bg)", text: "var(--status-planned-text)" },
        completed: { bg: "var(--status-completed-bg)", text: "var(--status-completed-text)" },
        draft: { bg: "var(--status-draft-bg)", text: "var(--status-draft-text)" },
        archived: { bg: "var(--status-draft-bg)", text: "var(--status-draft-text)" },
    };

    const statusOptions = useMemo(() => {
        const seen = new Set<string>();
        return (dataRecentProjects?.items ?? [])
            .map((p) => p.status)
            .filter((s) => {
                if (seen.has(s)) return false;
                seen.add(s);
                return true;
            })
            .map((s) => ({ value: s, label: STATUS_LABELS[s] || s }));
    }, [dataRecentProjects]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filterState.statuses.length > 0) count++;
        if (filterState.datePreset !== "all") count++;
        return count;
    }, [filterState]);

    const handleResetFilters = () => {
        setFilterState({ statuses: [], tags: [], members: [], datePreset: "all" });
        setFiltersOpen(false);
    };

    const [visibleCount, setVisibleCount] = useState(6);
    const [projectsVisibleCount, setProjectsVisibleCount] = useState(6);

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
            description:
                "Практические проекты, направленные на командную работу и применение знаний",
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

    const filteredRawItems = useMemo(() => {
        let items = dataRecentProjects?.items ?? [];

        // Preserve recency order from localStorage (most recent first)
        const idOrder = new Map(viewedIds.map((id, idx) => [id, idx]));
        items = [...items].sort((a, b) => {
            const ai = idOrder.get(a.id) ?? Infinity;
            const bi = idOrder.get(b.id) ?? Infinity;
            return ai - bi;
        });

        if (filterState.statuses.length > 0) {
            items = items.filter((p) => filterState.statuses.includes(p.status));
        }

        if (filterState.datePreset !== "all") {
            items = items.filter((p) => {
                if (!p.start_date) return false;
                const d = new Date(p.start_date);
                const now = new Date();
                const diff = now.getTime() - d.getTime();
                const withinDays = (days: number) =>
                    diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
                const isSameDay = () =>
                    d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth() &&
                    d.getDate() === now.getDate();
                switch (filterState.datePreset) {
                    case "today":
                        return isSameDay();
                    case "7days":
                        return withinDays(7);
                    case "30days":
                        return withinDays(30);
                    case "custom":
                        if (!filterState.customDate) return true;
                        return d >= filterState.customDate.from && d <= filterState.customDate.to;
                    default:
                        return true;
                }
            });
        }

        if (search) {
            const q = search.toLowerCase();
            items = items.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    (p.description ?? "").toLowerCase().includes(q),
            );
        }

        return items;
    }, [dataRecentProjects, filterState, search, viewedIds]);

    const projects = useMemo(() => {
        return filteredRawItems.map((p) => ({
            id: p.id,
            tag: p.status,
            title: p.title,
            description: p.description ?? "",
            progressValue: p.progress,
            dateText: p.start_date
                ? `Начало: ${new Date(p.start_date).toLocaleDateString("ru-RU")}`
                : "",
            tags: p.roles.map((r: string) => ({ text: r })),
            membersCount: p.members_count,
            users: [] as Array<{ name: string }>,
            archived: p.status === "completed" || p.status === "archived",
        }));
    }, [filteredRawItems]);

    useEffect(() => {
        setProjectsVisibleCount(6);
    }, [search, filterState]);

    const projectsHasMore = projectsVisibleCount < filteredRawItems.length;
    const handleProjectsLoadMore = () => setProjectsVisibleCount((prev) => prev + 6);

    const visibleFilteredRawItems = useMemo(
        () => filteredRawItems.slice(0, projectsVisibleCount),
        [filteredRawItems, projectsVisibleCount],
    );

    const visibleProjects = useMemo(
        () => projects.slice(0, projectsVisibleCount),
        [projects, projectsVisibleCount],
    );

    const isEmpty = !isLoadingSpaces && dataSpaces && dataSpaces.spaces.length === 0;

    if (isEmpty) {
        return (
            <ContentLayout title="Все пространства">
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-6">
                    <h1 className="mb-3 text-2xl font-bold text-gray-900">Все пространства</h1>
                    <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
                        Вы ещё не создали ни одного проекта. Проекты помогают организовать
                        студенческие проекты, команды и дисциплины в одном месте.
                    </p>
                    <Button
                        variant="dark"
                        size="hug36"
                        icon={<Icon name="magnifier" size={18} />}
                        className="font-sans text-[13px] font-semibold gap-2"
                    >
                        Найти проект
                    </Button>
                </div>
            </ContentLayout>
        );
    }

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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            icon={<Archive size={18} />}
                            className="font-sans text-[13px] font-semibold gap-2"
                        >
                            Архив
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <section>
                        <h2 className="mb-4 text-lg font-semibold text-gray-800">Пространства</h2>
                        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                            {(visibleSpaces || spaces).map((space) => (
                                <Link
                                    key={space.id}
                                    to={paths.app.space.getHref(space.id)}
                                    className="block h-full"
                                >
                                    <SpacesCard
                                        iconName="discipline"
                                        iconColor={space.color}
                                        tag={space.category}
                                        title={space.title}
                                        description={space.description}
                                        firstMetricText={`${space.projectsCount} проектов`}
                                        secondMetricText={`${space.membersCount} участника`}
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

                    <section>
                        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                            <h2 className="text-lg font-semibold text-gray-800 whitespace-nowrap">
                                Недавние проекты
                            </h2>
                            <div className="flex items-center gap-3">
                                <SearchBar
                                    placeholder="Поиск проектов..."
                                    value={search}
                                    onChange={setSearch}
                                    className="w-[240px]"
                                />
                                <div className="relative">
                                    <FilterTrigger
                                        activeCount={activeFilterCount}
                                        open={filtersOpen}
                                        onClick={() => setFiltersOpen((v) => !v)}
                                    />
                                    <FilterDropdown
                                        open={filtersOpen}
                                        onClose={() => setFiltersOpen(false)}
                                        onReset={handleResetFilters}
                                    >
                                        <FilterSection
                                            icon={<CircleDot size={16} />}
                                            label="Статус"
                                            count={filterState.statuses.length}
                                        >
                                            <CheckboxGroup
                                                options={statusOptions}
                                                selected={filterState.statuses}
                                                onChange={(v) =>
                                                    setFilterState((s) => ({ ...s, statuses: v }))
                                                }
                                            />
                                        </FilterSection>
                                        <FilterSection icon={<Calendar size={16} />} label="Дата">
                                            <DateFilter
                                                state={filterState}
                                                onChange={(patch) =>
                                                    setFilterState((s) => ({ ...s, ...patch }))
                                                }
                                            />
                                        </FilterSection>
                                    </FilterDropdown>
                                </div>
                                <div className="flex items-center h-10 bg-app-surface border border-gray-200 rounded-[12px] overflow-hidden shrink-0">
                                    <button
                                        onClick={() => setActiveView("grid")}
                                        className={`flex items-center justify-center w-10 h-full transition-colors ${
                                            activeView === "grid"
                                                ? "bg-gray-900 text-white dark:bg-gray-100"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setActiveView("list")}
                                        className={`flex items-center justify-center w-10 h-full transition-colors ${
                                            activeView === "list"
                                                ? "bg-gray-900 text-white dark:bg-gray-100"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {projects.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-app-surface p-12 text-center">
                                <p className="text-[15px] text-gray-500">
                                    Вы ещё не открыли ни одного проекта.
                                </p>
                                <p className="mt-1 text-[13px] text-gray-400">
                                    Создайте или присоединитесь к проекту, и он появится здесь.
                                </p>
                            </div>
                        ) : activeView === "list" ? (
                            <div className="bg-app-surface rounded-[20px] border border-gray-200 overflow-hidden">
                                <table className="w-full border-collapse">
                                    <thead className="text-app-text border-b border-gray-200 bg-gray-50">
                                        <tr>
                                            <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                                                Название
                                            </th>
                                            <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                                                Роли
                                            </th>
                                            <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                                                Участники
                                            </th>
                                            <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                                                Дата старта
                                            </th>
                                            <th className="text-left text-[15px] font-sans font-semibold px-6 h-14 whitespace-nowrap">
                                                Прогресс
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleFilteredRawItems.map((raw) => {
                                            const style =
                                                statusStyles[raw.status] || statusStyles.draft;
                                            const label = STATUS_LABELS[raw.status] || raw.status;
                                            return (
                                                <tr
                                                    key={raw.id}
                                                    className="group border-b border-gray-100 transition-colors hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            to={paths.app.project.getHref(raw.id)}
                                                            className="flex items-center gap-3"
                                                        >
                                                            <span
                                                                className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium leading-none shrink-0"
                                                                style={{
                                                                    backgroundColor: style.bg,
                                                                    color: style.text,
                                                                }}
                                                            >
                                                                {label}
                                                            </span>
                                                            <span className="text-[14px] font-medium text-gray-900 group-hover:text-[#2563EB] transition-colors">
                                                                {raw.title}
                                                            </span>
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {raw.roles.length > 0 ? (
                                                                raw.roles.map((r, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="inline-flex items-center h-6 px-2 rounded-[8px] bg-gray-100 text-[12px] font-medium text-gray-900 leading-none"
                                                                    >
                                                                        {r}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[13px] text-gray-400">
                                                                    —
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[13px] text-gray-500">
                                                            {raw.members_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {raw.start_date ? (
                                                            <span className="text-[13px] text-gray-600">
                                                                {new Date(
                                                                    raw.start_date,
                                                                ).toLocaleDateString("ru-RU", {
                                                                    day: "numeric",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[13px] text-gray-400">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-gray-900 transition-all duration-300"
                                                                    style={{
                                                                        width: `${Math.min(100, Math.max(0, raw.progress))}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-[12px] font-medium text-gray-500 w-8 text-right tabular-nums">
                                                                {raw.progress}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
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
                                            title={project.title}
                                            description={project.description}
                                            progressValue={project.progressValue}
                                            dateText={project.dateText}
                                            tags={project.tags}
                                            membersCount={project.membersCount}
                                            users={project.users}
                                            archived={project.archived}
                                            onKebabClick={() =>
                                                alert(`Menu opened for ${project.title}`)
                                            }
                                        />
                                    </Link>
                                ))}
                            </div>
                        )}

                        {projectsHasMore && (
                            <div className="w-full flex justify-center mt-8">
                                <button
                                    onClick={handleProjectsLoadMore}
                                    className="flex items-center gap-1 px-4 py-2 text-[14px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                                >
                                    <Icon name="arrow-down" width={16} height={16} />
                                    Загрузить ещё
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </ContentLayout>
    );
};

export default SpacesRoute;
