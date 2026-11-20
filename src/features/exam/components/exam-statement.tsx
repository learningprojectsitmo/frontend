import { shareExamQueue } from "@/features/exam/exam-queue-snapshot";
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";

import { ContentLayout } from "@/components/layouts";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import { paths } from "@/config/paths";
import { examGradingApi, gradingKey } from "@/lib/exam-grading";
import { examApi, isExamAccessDenied } from "@/lib/exams";
import { queryKeys } from "@/lib/query-keys";
import type { Exam } from "@/types/exam";
import { formatExamDate, getExamStatus, statusMeta } from "../exam-display";
import { useExamClock } from "../use-exam-clock";
import { useExamWorkspaces } from "../use-exam-workspaces";
import { ExamResultsRegistry } from "./exam-results";

function StatementExam({ exam, spaceTitle, now }: { exam: Exam; spaceTitle: string; now: number }) {
    const [open, setOpen] = useState(false);
    const { workspace_id: workspaceId, id: examId, configuration } = exam;
    const registry = useQuery({
        queryKey: [...gradingKey(workspaceId, examId), "registry"],
        queryFn: () => examGradingApi.registry(workspaceId, examId),
        retry: false,
    });
    const queue = useQuery({
        queryKey: queryKeys.exams.queue(workspaceId, examId),
        queryFn: () => examApi.queue(workspaceId, examId),
        structuralSharing: shareExamQueue,
        retry: false,
    });

    const denied = isExamAccessDenied(registry.error);
    const status =
        exam.status === "published" && !queue.isSuccess
            ? { label: "Опубликован", className: statusMeta.planned.className }
            : statusMeta[getExamStatus(exam, queue.data, now, queue.dataUpdatedAt)];
    const teams =
        queue.isSuccess && !denied
            ? new Set(queue.data.items.map((item) => item.project_id)).size
            : "—";
    const rows = registry.isSuccess && !denied ? registry.data : undefined;
    const completedTeams = rows && new Set(rows.map((item) => item.project_id)).size;
    const accepted = rows?.filter((item) => item.current !== null).length;

    return (
        <details
            className="min-w-0 rounded-[20px] border border-app-border bg-app-surface"
            onToggle={(event) => setOpen(event.currentTarget.open)}
        >
            <summary className="cursor-pointer rounded-[20px] px-4 py-4 text-app-text sm:px-6">
                <span className="inline font-semibold break-words">{configuration.title}</span>
                <span
                    className={`ml-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                >
                    {status.label}
                </span>
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-app-muted">
                    <span>
                        <Icon name="discipline" size={14} className="mr-1 inline-block" />
                        {spaceTitle}
                    </span>
                    <time dateTime={configuration.starts_at}>
                        {formatExamDate(configuration.starts_at)}
                    </time>
                    <span>Команд: {teams}</span>
                    <span>Команд в реестре: {completedTeams ?? "—"}</span>
                    <span>Утверждено итогов: {accepted ?? "—"}</span>
                </span>
            </summary>
            {open && (
                <div className="border-t border-app-border px-4 pb-4 sm:px-6">
                    {denied ? (
                        <p role="alert" className="pt-4 text-sm text-app-muted">
                            Ведомость этого экзамена вам недоступна.
                        </p>
                    ) : registry.isError ? (
                        <div className="flex flex-wrap items-center gap-3 pt-4">
                            <p role="alert" className="text-sm text-app-muted">
                                Не удалось загрузить итоги экзамена.
                            </p>
                            <Button
                                variant="outline"
                                size="hug36"
                                onClick={() => void registry.refetch()}
                            >
                                Повторить
                            </Button>
                        </div>
                    ) : rows ? (
                        <>
                            {queue.isError && (
                                <div className="flex flex-wrap items-center gap-3 pt-4">
                                    <p role="alert" className="text-sm text-app-muted">
                                        Не удалось загрузить список команд.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="hug36"
                                        onClick={() => void queue.refetch()}
                                    >
                                        Повторить
                                    </Button>
                                </div>
                            )}
                            <ExamResultsRegistry
                                workspaceId={workspaceId}
                                examId={examId}
                                items={rows}
                                canDownload
                            />
                        </>
                    ) : (
                        <p role="status" className="pt-4 text-sm text-app-muted">
                            Загружаем итоги экзамена…
                        </p>
                    )}
                </div>
            )}
        </details>
    );
}

export function ExamStatement({ workspaceId }: { workspaceId: number }) {
    const [params, setParams] = useSearchParams();
    const validScope = Number.isSafeInteger(workspaceId) && workspaceId >= 0;
    const access = useExamWorkspaces(workspaceId, validScope, false, true);
    const spaces = access.resultSpaces;
    const examQueries = useQueries({
        queries: spaces.map((space) => ({
            queryKey: queryKeys.exams.list(space.id),
            queryFn: () => examApi.list(space.id),
            retry: false,
        })),
    });

    const now = useExamClock();
    const search = params.get("q") ?? "";
    const requestedStatus = params.get("status");
    const status =
        requestedStatus === "draft" || requestedStatus === "published" ? requestedStatus : "";
    const searchText = search.trim().toLocaleLowerCase("ru-RU");
    const visible = spaces
        .flatMap((space, index) => {
            const query = examQueries[index];
            if (!query?.isSuccess) return [];
            return query.data.items
                .filter(
                    (exam) =>
                        (!status || exam.status === status) &&
                        [exam.configuration.title, space.title].some((value) =>
                            value.toLocaleLowerCase("ru-RU").includes(searchText),
                        ),
                )
                .map((exam) => ({ exam, spaceTitle: space.title }));
        })
        .sort(
            (a, b) =>
                Date.parse(b.exam.configuration.starts_at) -
                Date.parse(a.exam.configuration.starts_at),
        );

    const loading = access.isLoading || examQueries.some((query) => query.isLoading);
    const errors = examQueries.filter((query) => query.isError);
    const managementHref = paths.app.examManage.getHref(workspaceId);
    const updateFilter = (key: string, value: string) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        setParams(next, { replace: true });
    };

    return (
        <ContentLayout title="Ведомость">
            <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-6 p-4 sm:p-8">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app">Все пространства</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to={managementHref}>Управление экзаменами</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Ведомость</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-[26px] font-bold text-app-text sm:text-[40px]">
                        Ведомость
                    </h1>
                    <Button asChild hasIconAsChild variant="outline" size="hug36">
                        <Link to={managementHref}>
                            <Icon name="arrow-left" size={16} />
                            Назад
                        </Link>
                    </Button>
                </div>

                {loading ? (
                    <div
                        role="status"
                        aria-label="Загружаем экзамены"
                        className="flex justify-center py-12"
                    >
                        <Spinner />
                    </div>
                ) : !spaces.length ? (
                    <p role="status" className="text-sm text-app-muted">
                        {access.resultAccessError
                            ? "Не удалось проверить доступ к ведомости. Обновите страницу и попробуйте ещё раз."
                            : "Ведомость доступна преподавателям и администраторам, которые состоят в пространстве."}
                    </p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative max-w-full">
                                <Icon
                                    name="magnifier"
                                    size={16}
                                    className="absolute left-3 top-3 text-app-muted"
                                />
                                <input
                                    type="search"
                                    aria-label="Поиск экзаменов"
                                    placeholder="Поиск экзаменов"
                                    value={search}
                                    onChange={(event) => updateFilter("q", event.target.value)}
                                    className="h-10 w-60 max-w-full rounded-xl border border-app-border bg-app-surface pl-9 pr-3 text-sm text-app-text focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                            <select
                                aria-label="Статус экзамена"
                                value={status}
                                onChange={(event) => updateFilter("status", event.target.value)}
                                className="h-10 rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text"
                            >
                                <option value="">Все статусы</option>
                                <option value="published">Опубликованные</option>
                                <option value="draft">Черновики</option>
                            </select>
                        </div>
                        <p className="text-sm text-app-muted">
                            CSV можно скачать отдельно для каждого экзамена. Общая выгрузка пока
                            недоступна.
                        </p>
                        {access.resultAccessError && (
                            <p role="status" className="text-sm text-app-muted">
                                Не удалось проверить доступ к некоторым пространствам.
                            </p>
                        )}
                        {errors.length > 0 && (
                            <div className="flex flex-wrap items-center gap-3">
                                <p role="alert" className="text-sm text-app-muted">
                                    {errors.every((query) => isExamAccessDenied(query.error))
                                        ? "Список экзаменов недоступен для вашей роли."
                                        : "Не удалось загрузить экзамены из некоторых пространств."}
                                </p>
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    onClick={() => errors.forEach((query) => void query.refetch())}
                                >
                                    Повторить
                                </Button>
                            </div>
                        )}
                        {visible.length === 0 && errors.length === 0 && (
                            <p className="py-8 text-center text-sm text-app-muted">
                                {searchText || status
                                    ? "Экзамены по этим фильтрам не найдены."
                                    : "В доступных пространствах пока нет экзаменов."}
                            </p>
                        )}
                        <div className="flex min-w-0 flex-col gap-3">
                            {visible.map(({ exam, spaceTitle }) => (
                                <StatementExam
                                    key={`${exam.workspace_id}:${exam.id}`}
                                    exam={exam}
                                    spaceTitle={spaceTitle}
                                    now={now}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </ContentLayout>
    );
}
