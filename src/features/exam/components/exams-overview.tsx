import { shareExamQueue } from "@/features/exam/exam-queue-snapshot";
import { ExamErrorState } from "@/features/exam/components/exam-error-state";
import { queryKeys } from "@/lib/query-keys";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { queryOptions, useQueries } from "@tanstack/react-query";
import { Ellipsis, List, MoreHorizontal, Plus, Search } from "lucide-react";

import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { paths } from "@/config/paths";
import { useExamWorkspaces } from "../use-exam-workspaces";
import { useExamClock } from "../use-exam-clock";
import { examApi } from "@/lib/exams";
import type { Exam } from "@/types/exam";

import { formatExamDate, getExamStatus, isExamOver, sortExamsByRelevance, statusMeta, type ExamStatus } from "../exam-display";

export function ExamHeader({
    disciplineCount,
    examCount,
    canCreate,
    canManage,
    onCreate,
    manageWorkspaceId,
    workspaceFilter,
}: {
    disciplineCount: number;
    examCount: number;
    canCreate: boolean;
    canManage: boolean;
    onCreate: () => void;
    manageWorkspaceId: number;
    workspaceFilter: ReactNode;
}) {
    return (
        <div className="self-stretch flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex justify-start items-start gap-3 sm:gap-5">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#4338CA] rounded-2xl flex justify-center items-center">
                    <Icon name="exam" size={32} className="text-[#FFFFFF]" />
                </div>
                <div className="inline-flex flex-col justify-start items-start gap-0.5">
                    <div className="text-app-text text-[26px] sm:text-[40px] font-bold leading-[1.2]">
                        Экзамены
                    </div>
                    <div className="text-app-muted text-base font-medium leading-7">
                        Экзамены проектов по вашим дисциплинам
                    </div>
                    <div className="inline-flex items-center gap-3 text-[13px] text-app-muted">
                        <span>{disciplineCount} дисциплин</span>
                        <span className="size-1.5 rounded-full bg-gray-400 dark:bg-app-muted" />
                        <span>{examCount} экзаменов</span>
                    </div>
                </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
                {workspaceFilter}
                {canCreate && (
                    <Button
                        variant="darkTransparent"
                        size="hug36"
                        icon={<Plus size={18} />}
                        onClick={onCreate}
                        className="font-sans text-[13px] font-semibold gap-2 !h-11 !rounded-[12px] !px-[18px]"
                    >
                        Создать экзамен
                    </Button>
                )}
                {canManage && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="Дополнительные действия"
                            className="w-9 h-9 cursor-pointer p-2 rounded-lg flex justify-center items-center hover:bg-gray-100 dark:hover:bg-app-ghost transition-colors"
                        >
                            <MoreHorizontal size={18} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuPortal><DropdownMenuContent align="end" className="w-[220px]">
                        {canManage && (
                            <DropdownMenuItem asChild>
                                <Link to={paths.app.examManage.getHref(manageWorkspaceId)}>Управление экзаменами</Link>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent></DropdownMenuPortal>
                </DropdownMenu>}
            </div>
        </div>
    );
}

function ExamCard({
    workspaceId,
    exam,
    status,
    projectsCount,
    teamsCount,
}: {
    workspaceId: number;
    exam: Exam;
    status: ExamStatus;
    projectsCount: number;
    teamsCount: number;
}) {
    const meta = statusMeta[status];

    return (
        <Link
            to={paths.app.examView.getHref(workspaceId, exam.id)}
            className="block h-full"
        >
            <article className="h-full rounded-2xl border border-app-border bg-app-surface p-6 flex flex-col">
                <div className="flex justify-between items-start gap-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
                        {meta.label}
                    </span>
                    <span className="shrink-0 rounded-lg border border-app-border px-1 py-2 text-[11px] font-bold text-app-text">
                        {formatExamDate(exam.configuration.starts_at)}
                    </span>
                </div>

                <div className="mt-6">
                    <h3 title={exam.configuration.title} className="line-clamp-2 text-[17px] font-bold leading-6 text-app-text [overflow-wrap:anywhere]">
                        {exam.configuration.title}
                    </h3>
                    {exam.configuration.description && (
                        <p title={exam.configuration.description} className="mt-2 line-clamp-2 text-[13px] leading-5 text-app-muted [overflow-wrap:anywhere]">
                            {exam.configuration.description}
                        </p>
                    )}
                </div>

                <div className="mt-auto pt-8 flex items-center gap-4 text-[13px] text-app-muted">
                    <span className="flex items-center gap-2">
                        <Icon name="project" size={16} />
                        {projectsCount} проектов
                    </span>
                    <span className="flex items-center gap-2">
                        <Icon name="members" size={16} />
                        Команд: {teamsCount}
                    </span>
                </div>
            </article>
        </Link>
    );
}

function ExamTable({
    workspaceId,
    disciplineName,
    exams,
    statusByExam,
    registrationByExam,
}: {
    workspaceId: number;
    disciplineName: string;
    exams: Exam[];
    statusByExam: ReadonlyMap<number, ExamStatus>;
    registrationByExam: Map<number, { projects: number; teams: number }>;
}) {
    return (
        <div className="overflow-x-auto rounded-[20px] border border-gray-200 dark:border-app-border">
            <table className="w-full border-collapse text-left">
                <thead className="border-b border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost text-app-text">
                    <tr>
                        <th className="h-14 whitespace-nowrap px-6 text-[15px] font-sans font-semibold">Статус</th>
                        <th className="h-14 whitespace-nowrap px-6 text-[15px] font-sans font-semibold">Название</th>
                        <th className="h-14 whitespace-nowrap px-6 text-[15px] font-sans font-semibold">Дисциплина</th>
                        <th className="h-14 whitespace-nowrap px-6 text-[15px] font-sans font-semibold">Дата/время</th>
                        <th className="h-14 whitespace-nowrap px-6 text-[15px] font-sans font-semibold">Проекты</th>
                        <th className="h-14 whitespace-nowrap px-6 text-[15px] font-sans font-semibold">Команды</th>
                        <th className="h-14 w-14 px-3" />
                    </tr>
                </thead>
                <tbody>
                    {exams.map((exam) => {
                        const status = statusMeta[statusByExam.get(exam.id) ?? "draft"];
                        const counts = registrationByExam.get(exam.id) ?? { projects: 0, teams: 0 };
                        return (
                            <tr key={exam.id} className="group border-b border-gray-100 dark:border-app-border transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-app-ghost">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium leading-none ${status.className}`}>
                                        {status.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        to={paths.app.examView.getHref(workspaceId, exam.id)}
                                        title={exam.configuration.title}
                                        className="block max-w-64 cursor-pointer truncate text-[14px] font-medium text-app-blue transition-colors hover:underline dark:text-blue-300"
                                    >
                                        {exam.configuration.title}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-app-muted"><span title={disciplineName} className="block max-w-52 truncate">{disciplineName}</span></td>
                                <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-app-muted">{formatExamDate(exam.configuration.starts_at)}</td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-app-muted">
                                        <Icon name="project" size={14} />
                                        {counts.projects}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-app-muted">
                                        <Icon name="members" size={14} />
                                        {counts.teams}
                                    </span>
                                </td>
                                <td className="px-3 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button type="button" aria-label="Действия с экзаменом" className="cursor-pointer rounded-lg p-2 text-gray-500 dark:text-app-muted hover:bg-gray-100 dark:hover:bg-app-ghost">
                                                <Ellipsis size={16} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuPortal><DropdownMenuContent align="end" className="w-[220px]">
                                            <DropdownMenuItem asChild>
                                                <Link to={paths.app.examView.getHref(workspaceId, exam.id)}>Открыть экзамен</Link>
                                            </DropdownMenuItem>
                                            
                                        </DropdownMenuContent></DropdownMenuPortal>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function DisciplineExamList({
    workspaceId,
    title,
    exams,
    statusByExam,
    registrationByExam,
}: {
    workspaceId: number;
    title: string;
    exams: Exam[];
    statusByExam: ReadonlyMap<number, ExamStatus>;
    registrationByExam: Map<number, { projects: number; teams: number }>;
}) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<"all" | ExamStatus>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filtered = sortExamsByRelevance(
        exams.filter((exam) => exam.status === "published")
        .filter((exam) => {
            const matchesSearch = exam.configuration.title.toLowerCase().includes(search.trim().toLowerCase());
            const matchesStatus = status === "all" || statusByExam.get(exam.id) === status;
            return matchesSearch && matchesStatus;
        }),
        statusByExam,
    );

    return (
        <section>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg font-semibold text-app-text">{title}</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                        <input
                            type="text"
                            aria-label="Поиск экзаменов" placeholder="Поиск экзаменов"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-10 w-[240px] pl-9 pr-3 bg-app-surface border border-gray-200 dark:border-app-border rounded-[12px] text-[14px] outline-none placeholder:text-app-muted focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as "all" | ExamStatus)}
                        className="h-10 rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface px-3 text-[13px]"
                    >
                        <option value="all">Все статусы</option>
                        <option value="soon">Скоро</option>
                        <option value="waiting">Ожидается начало</option>
                        <option value="running">Идёт</option>
                        <option value="finished">Завершён</option>
                        <option value="planned">Запланирован</option>
                        <option value="passed">Экзамен прошёл</option>
                    </select>
                    <div className="flex h-10 items-center overflow-hidden rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            aria-label="Карточки" aria-pressed={viewMode === "grid"}
                            className={`h-full cursor-pointer px-3 ${viewMode === "grid" ? "bg-app-text text-app-background" : "text-gray-500 dark:text-app-muted"}`}
                        >
                            <Icon name="grid" size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            aria-label="Таблица" aria-pressed={viewMode === "list"}
                            className={`h-full cursor-pointer px-3 ${viewMode === "list" ? "bg-app-text text-app-background" : "text-gray-500 dark:text-app-muted"}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-app-muted">Экзамены не найдены</div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))]">
                    {filtered.map((exam) => {
                        const counts = registrationByExam.get(exam.id) ?? { projects: 0, teams: 0 };
                        return (
                            <ExamCard
                                key={exam.id}
                                workspaceId={workspaceId}
                                exam={exam}
                                status={statusByExam.get(exam.id) ?? "draft"}
                                projectsCount={counts.projects}
                                teamsCount={counts.teams}
                            />
                        );
                    })}
                </div>
            ) : (
                <ExamTable
                    workspaceId={workspaceId}
                    disciplineName={title}
                    exams={filtered}
                    statusByExam={statusByExam}
                    registrationByExam={registrationByExam}
                />
            )}
        </section>
    );
}

export function ExamsOverview({
    workspaceId,
    onWorkspaceChange,
}: {
    workspaceId: number;
    onWorkspaceChange: (workspaceId: number) => void;
}) {
    const navigate = useNavigate();
    const access = useExamWorkspaces(workspaceId);
    const spaces = access.readable;

    const examQueries = useQueries({
        queries: spaces.map((space) => ({
            queryKey: queryKeys.exams.list(space.id, "published"),
            queryFn: () => examApi.list(space.id, "published"),
            staleTime: 60 * 1000,
        })),
    });

    const examsByWorkspace = new Map(
        spaces.map((space, index) => [space.id, examQueries[index]?.data?.items ?? []]),
    );

    const now = useExamClock();
    const visibleExams = Array.from(examsByWorkspace.values()).flat();
    const queueQueries = useQueries({
        queries: visibleExams.map((exam) => queryOptions({
            queryKey: queryKeys.exams.queue(exam.workspace_id, exam.id),
            queryFn: () => examApi.queue(exam.workspace_id, exam.id),
            structuralSharing: shareExamQueue,
            refetchInterval: ({ state }) => {
                const currentTime = Date.now();
                if (isExamOver(getExamStatus(exam, state.data, currentTime, state.dataUpdatedAt))) return false;
                return Date.parse(exam.configuration.starts_at) > currentTime ? 30_000 : 5_000;
            },
        })),
    });
    const statusByExam = new Map(
        visibleExams.map((exam, index) => [exam.id, getExamStatus(exam, queueQueries[index]?.data, now, queueQueries[index]?.dataUpdatedAt)]),
    );

    const registrationRequests = access.manageable.flatMap((space) =>
        (examsByWorkspace.get(space.id) ?? []).map((exam) => ({ workspaceId: space.id, exam })),
    );
    const registrationQueries = useQueries({
        queries: registrationRequests.map(({ workspaceId, exam }) => ({
            queryKey: queryKeys.exams.registrations(workspaceId, exam.id),
            queryFn: () => examApi.registrations(workspaceId, exam.id),
            staleTime: 60 * 1000,
        })),
    });

    const registrationByExam = (() => {
        const result = new Map(visibleExams.map((exam, index) => {
            const items = queueQueries[index]?.data?.items ?? [];
            return [exam.id, { projects: new Set(items.map((item) => item.project_id)).size, teams: items.length }] as const;
        }));
        registrationRequests.forEach(({ exam }, index) => {
            const items = registrationQueries[index]?.data?.items;
            if (!items) return;
            result.set(exam.id, {
                projects: new Set(items.map((item) => item.project_id)).size,
                teams: items.filter((item) => item.status === "active").length,
            });
        });
        return result;
    })();

    const visibleDisciplineCount = spaces.filter(
        (space) => (examsByWorkspace.get(space.id)?.length ?? 0) > 0,
    ).length;
    const createWorkspace = access.manageable[0];
    const handleCreate = () => {
        if (createWorkspace) navigate(paths.app.examNew.getHref(createWorkspace.id));
    };

    if (access.isLoading) {
        return (
            <ContentLayout title="Экзамены">
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Экзамены">
            <div className="mx-auto max-w-7xl p-4 sm:p-8 flex flex-col gap-6 sm:gap-8">
                <Breadcrumb className="min-h-[34px] flex flex-wrap gap-y-1.5 items-center">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app" className="font-sans font-medium text-[16px] text-app-muted">
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                Экзамены
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <ExamHeader
                    disciplineCount={visibleDisciplineCount}
                    examCount={visibleExams.length}
                    canCreate={Boolean(createWorkspace)}
                    canManage={access.canManage}
                    onCreate={handleCreate}
                    manageWorkspaceId={workspaceId}
                    workspaceFilter={
                        <Select
                            value={String(workspaceId)}
                            onValueChange={(value) => onWorkspaceChange(Number(value))}
                        >
                            <SelectTrigger
                                aria-label="Фильтр по пространству"
                                className="h-11 w-fit min-w-44 max-w-full cursor-pointer gap-2 rounded-xl border-gray-200 dark:border-app-border px-3.5 text-[13px] font-medium text-app-text sm:max-w-64 [&>span]:truncate [&>svg]:shrink-0"
                            >
                                <SelectValue placeholder="Выберите пространство" />
                            </SelectTrigger>
                            <SelectContent align="start" className="rounded-xl">
                                <SelectItem value="0" className="cursor-pointer">
                                    Все пространства
                                </SelectItem>
                                {access.spaces.map((space) => (
                                    <SelectItem key={space.id} value={String(space.id)} className="cursor-pointer">
                                        {space.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    }
                />

                {workspaceId > 0 && spaces.length === 0 && (
                    <p className="text-sm text-app-muted">Пространство недоступно.</p>
                )}

                {spaces.map((space, index) => {
                    const query = examQueries[index];
                    if (query?.isError && !query.data) return (
                        <ExamErrorState key={space.id} message={`Не удалось загрузить экзамены пространства «${space.title}».`}
                            retry={() => void query.refetch()} pending={query.isFetching} />
                    );
                    if (query?.isLoading) return <div key={space.id} className="flex justify-center py-6"><Spinner /></div>;
                    return <DisciplineExamList
                        key={space.id}
                        workspaceId={space.id}
                        title={space.title}
                        exams={examsByWorkspace.get(space.id) ?? []}
                        statusByExam={statusByExam}
                        registrationByExam={registrationByExam}
                    />;
                })}
            </div>
        </ContentLayout>
    );
}
