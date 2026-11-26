import { ExamErrorState } from "@/features/exam/components/exam-error-state";
import { queryKeys } from "@/lib/query-keys";
import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { Ellipsis, List, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import { Tabs } from "@/components/ui/tabs/tabs";
import { paths } from "@/config/paths";
import { useUser } from "@/lib/auth";
import { examApi, useExams } from "@/lib/exams";
import type { Exam } from "@/types/exam";

import { formatExamDate } from "../exam-display";
import { ExamRemovalDialog, examRemovalLabel } from "./exam-removal-dialog";

export function ExamManagementList({
    workspaceId,
    workspaces = [],
    removableWorkspaceIds = [],
}: {
    workspaceId: number;
    removableWorkspaceIds?: number[];
    workspaces?: Array<{ id: number; title: string }>;
}) {
    const navigate = useNavigate();
    const { data: user } = useUser();
    const [params, setParams] = useSearchParams();
    const filter = params.get("status");
    const status =
        filter === "archived" || filter === "draft" || filter === "published" ? filter : "all";
    const archive = status === "archived" ? status : undefined;
    const selectedQuery = useExams(workspaceId, archive);
    const allQueries = useQueries({
        queries:
            workspaceId > 0
                ? []
                : workspaces.map((workspace) => ({
                      queryKey: queryKeys.exams.list(workspace.id, archive),
                      queryFn: () => examApi.list(workspace.id, archive),
                  })),
    });
    const examsItems =
        workspaceId > 0
            ? (selectedQuery.data?.items ?? [])
            : allQueries.flatMap((query) => query.data?.items ?? []);
    const isLoading =
        workspaceId > 0 ? selectedQuery.isLoading : allQueries.some((query) => query.isLoading);
    const hasLoadError =
        workspaceId > 0 ? selectedQuery.isError : allQueries.some((query) => query.isError);
    const [tab, setTab] = useState<"all" | "mine">("all");
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const [removalTarget, setRemovalTarget] = useState<Exam | null>(null);
    const removeAction = (exam: Exam) =>
        !exam.archived_at && removableWorkspaceIds.includes(exam.workspace_id) ? (
            <ExamRemovalMenu exam={exam} onSelect={() => setRemovalTarget(exam)} />
        ) : null;
    const filtered = examsItems
        .filter((exam) => tab !== "mine" || exam.created_by === user?.id)
        .filter((exam) => status === "all" || status === "archived" || exam.status === status)
        .filter((exam) =>
            exam.configuration.title.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .sort(
            (a, b) =>
                new Date(a.configuration.starts_at).getTime() -
                new Date(b.configuration.starts_at).getTime(),
        );

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <Tabs
                    className="w-full sm:w-[260px]"
                    value={tab}
                    onValueChange={(value) => setTab(value as "all" | "mine")}
                    tabs={[
                        { value: "all", label: "Управление" },
                        { value: "mine", label: "Мои" },
                    ]}
                />
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Поиск экзаменов"
                            placeholder="Поиск экзаменов"
                            className="h-10 w-[240px] rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface pl-9 pr-3 text-[14px] outline-none placeholder:text-app-muted focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <select
                        aria-label="Статус экзамена"
                        className="h-10 cursor-pointer rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface px-3 text-[13px]"
                        value={status}
                        onChange={(event) => {
                            const next = new URLSearchParams(params);
                            if (event.target.value === "all") next.delete("status");
                            else next.set("status", event.target.value);
                            setParams(next, { replace: true });
                        }}
                    >
                        <option value="all">Все статусы</option>
                        <option value="draft">Черновики</option>
                        <option value="published">Опубликованные</option>
                        <option value="archived">Архив</option>
                    </select>
                    <div className="flex h-10 items-center overflow-hidden rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface">
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            aria-label="Карточки"
                            aria-pressed={viewMode === "grid"}
                            className={`h-full cursor-pointer px-3 ${viewMode === "grid" ? "bg-app-text text-app-background" : "text-gray-500 dark:text-app-muted"}`}
                        >
                            <Icon name="grid" size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            aria-label="Таблица"
                            aria-pressed={viewMode === "list"}
                            className={`h-full cursor-pointer px-3 ${viewMode === "list" ? "bg-app-text text-app-background" : "text-gray-500 dark:text-app-muted"}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <Button
                        variant="dark"
                        size="hug36"
                        icon={<Plus size={16} />}
                        onClick={() => navigate(paths.app.examNew.getHref(workspaceId))}
                    >
                        Создать экзамен
                    </Button>
                </div>
            </div>

            {hasLoadError && (
                <ExamErrorState
                    message="Не удалось загрузить все экзамены."
                    retry={() => {
                        if (workspaceId > 0) void selectedQuery.refetch();
                        else
                            allQueries
                                .filter((query) => query.isError)
                                .forEach((query) => void query.refetch());
                    }}
                    pending={
                        workspaceId > 0
                            ? selectedQuery.isFetching
                            : allQueries.some((query) => query.isFetching)
                    }
                />
            )}
            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Spinner />
                </div>
            ) : filtered.length === 0 ? (
                hasLoadError ? null : (
                    <div className="rounded-[20px] border border-dashed border-gray-300 dark:border-app-border py-16 text-center">
                        <p className="text-[14px] font-medium text-app-text">
                            {tab === "mine" ? "У вас пока нет экзаменов" : "Экзамены не найдены"}
                        </p>
                        <p className="mt-1 text-[13px] text-app-muted">
                            {tab === "mine"
                                ? "Создайте первый экзамен для своей дисциплины."
                                : "Измените поиск или создайте новый экзамен."}
                        </p>
                    </div>
                )
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))]">
                    {filtered.map((exam) => (
                        <ExamManagementCard
                            key={`${exam.workspace_id}-${exam.id}`}
                            workspaceId={exam.workspace_id}
                            exam={exam}
                            removalMenu={removeAction(exam)}
                            workspaceName={
                                workspaces.find((workspace) => workspace.id === exam.workspace_id)
                                    ?.title
                            }
                        />
                    ))}
                </div>
            ) : (
                <ExamManagementTable
                    workspaces={workspaces}
                    exams={filtered}
                    removeAction={removeAction}
                />
            )}
            {removalTarget && (
                <ExamRemovalDialog exam={removalTarget} onClose={() => setRemovalTarget(null)} />
            )}
        </div>
    );
}

function ExamManagementCard({
    workspaceId,
    exam,
    workspaceName,
    removalMenu,
}: {
    workspaceId: number;
    exam: Exam;
    workspaceName?: string;
    removalMenu: ReactNode;
}) {
    return (
        <article className="relative rounded-2xl border border-app-border bg-app-surface p-6 transition hover:border-gray-300 dark:hover:border-slate-500">
            <div className="flex justify-between gap-3">
                <span className="rounded-full bg-gray-100 dark:bg-app-ghost px-2.5 py-1 text-[12px] font-medium text-gray-600 dark:text-app-muted">
                    {examStatusLabel(exam)}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-app-text">
                        {formatExamDate(exam.configuration.starts_at)}
                    </span>
                    {removalMenu}
                </div>
            </div>
            <h3
                title={exam.configuration.title}
                className="mt-5 line-clamp-2 text-[17px] font-bold text-app-text [overflow-wrap:anywhere]"
            >
                <Link to={examManagementHref(exam)} className="after:absolute after:inset-0">
                    {exam.configuration.title}
                </Link>
            </h3>
            {workspaceName && (
                <p
                    title={workspaceName}
                    className="mt-2 truncate text-[12px] font-medium text-app-blue dark:text-blue-300"
                >
                    {workspaceName}
                </p>
            )}
            {exam.configuration.description && (
                <p
                    title={exam.configuration.description}
                    className="mt-2 line-clamp-2 text-[13px] text-app-muted [overflow-wrap:anywhere]"
                >
                    {exam.configuration.description}
                </p>
            )}
            {exam.status === "published" && !exam.archived_at && (
                <Link
                    to={paths.app.examView.getHref(workspaceId, exam.id)}
                    className="relative z-10 mt-4 inline-flex rounded-lg border border-app-border px-3 py-1.5 text-xs font-medium text-app-blue hover:bg-app-ghost dark:text-blue-300"
                >
                    Перейти на страницу экзамена
                </Link>
            )}
        </article>
    );
}

function ExamManagementTable({
    workspaces,
    exams,
    removeAction,
}: {
    workspaces: Array<{ id: number; title: string }>;
    exams: Exam[];
    removeAction: (exam: Exam) => ReactNode;
}) {
    return (
        <div className="overflow-x-auto rounded-[20px] border border-gray-200 dark:border-app-border">
            <table className="w-full border-collapse text-left">
                <thead className="border-b border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost text-app-text">
                    <tr>
                        <th className="h-14 px-6 text-[15px] font-semibold">Название</th>
                        <th className="h-14 px-6 text-[15px] font-semibold">Пространство</th>
                        <th className="h-14 px-6 text-[15px] font-semibold">Статус</th>
                        <th className="h-14 px-6 text-[15px] font-semibold">Дата</th>
                        <th className="h-14 w-14 px-3" />
                    </tr>
                </thead>
                <tbody>
                    {exams.map((exam) => (
                        <tr
                            key={exam.id}
                            className="group border-b border-gray-100 dark:border-app-border last:border-0 hover:bg-gray-50 dark:hover:bg-app-ghost"
                        >
                            <td className="px-6 py-4">
                                <Link
                                    to={examManagementHref(exam)}
                                    title={exam.configuration.title}
                                    className="block max-w-64 truncate text-[14px] font-medium text-app-blue hover:underline dark:text-blue-300"
                                >
                                    {exam.configuration.title}
                                </Link>
                            </td>
                            <td className="px-6 py-4">
                                <Link
                                    to={`/app/space?id=${exam.workspace_id}`}
                                    title={
                                        workspaces.find(
                                            (workspace) => workspace.id === exam.workspace_id,
                                        )?.title
                                    }
                                    className="block max-w-52 truncate text-[13px] font-medium text-app-blue hover:underline dark:text-blue-300"
                                >
                                    {workspaces.find(
                                        (workspace) => workspace.id === exam.workspace_id,
                                    )?.title ?? `Пространство ${exam.workspace_id}`}
                                </Link>
                            </td>
                            <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-app-muted">
                                {examStatusLabel(exam)}
                            </td>
                            <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-app-muted">
                                {formatExamDate(exam.configuration.starts_at)}
                            </td>
                            <td className="px-3 py-4 text-right">
                                {exam.status === "published" && !exam.archived_at && (
                                    <Link
                                        to={paths.app.examView.getHref(exam.workspace_id, exam.id)}
                                        className="mr-2 inline-flex whitespace-nowrap rounded-lg border border-app-border px-3 py-1.5 text-xs font-medium text-app-blue hover:bg-app-ghost dark:text-blue-300"
                                    >
                                        Перейти на страницу экзамена
                                    </Link>
                                )}
                                {!exam.archived_at && (
                                    <Link
                                        to={examManagementHref(exam)}
                                        aria-label="Редактировать экзамен"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-app-muted hover:bg-gray-100 dark:hover:bg-app-ghost"
                                    >
                                        <Icon name="pen" size={16} />
                                    </Link>
                                )}
                                {removeAction(exam)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function examManagementHref(exam: Exam) {
    return exam.archived_at
        ? paths.app.examView.getHref(exam.workspace_id, exam.id)
        : paths.app.examEdit.getHref(exam.workspace_id, exam.id);
}

function examStatusLabel(exam: Exam) {
    if (exam.archived_at) return "Архив";
    return exam.status === "published" ? "Опубликован" : "Черновик";
}

function ExamRemovalMenu({ exam, onSelect }: { exam: Exam; onSelect: () => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Действия с экзаменом"
                    className="relative z-10 inline-grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-app-muted hover:bg-app-ghost"
                >
                    <Ellipsis size={16} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuItem className="gap-3" onSelect={onSelect}>
                        <Trash2 size={16} />
                        {examRemovalLabel(exam)}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}
