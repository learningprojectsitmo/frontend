import { useMemo, useState } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { Popover } from "@base-ui/react/popover";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
    Ellipsis,
    GripVertical,
    Link as LinkIcon,
    Pencil,
    Play,
    Share2,
    Square,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog/dialog";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { useExamWorkspaces } from "../use-exam-workspaces";
import {
    examApi,
    getExamErrorMessage,
    invalidateExam,
    useExam,
    useExamQueue,

} from "@/lib/exams";
import { useProjectsList } from "@/lib/projects";
import { useProjectTypes } from "@/lib/projects";
import { useExamClock } from "../use-exam-clock";
import { getExamProjectLeader, useExamProjects } from "../use-exam-projects";
import { paths } from "@/config/paths";
import { formatExamDate, formatExamTime, getExamStatus, isExamOver, statusMeta } from "../exam-display";
import type { QueueItem } from "@/types/exam";

function formatCreatedDate(value: string) {
    const date = new Date(value);
    const dayMonth = date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
    });
    return `${dayMonth}, ${date.getFullYear()}`;
}

function ParticipantsTooltip({ names }: { names: string[] }) {
    if (names.length === 0) return null;

    return (
        <Tooltip.Root>
            <Tooltip.Trigger aria-label="Участники команды" className="flex cursor-pointer items-center">
                {names.slice(0, 3).map((name, index) => (
                    <span
                        key={index}
                        className="flex size-7 items-center justify-center rounded-full border-2 border-app-surface bg-gray-200 text-[10px] font-semibold text-gray-700"
                        style={{ marginLeft: index > 0 ? -8 : 0 }}
                    >
                        {name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                    </span>
                ))}
                {names.length > 3 && (
                    <span className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-app-surface bg-gray-100 text-[10px] text-gray-600">
                        +{names.length - 3}
                    </span>
                )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Positioner positionMethod="fixed" sideOffset={8} collisionPadding={8} className="z-[500]">
                    <Tooltip.Popup className="max-h-[var(--available-height)] w-[220px] max-w-[var(--available-width)] overflow-auto break-words rounded-xl border border-gray-200 bg-app-surface p-3 text-[12px] leading-5 text-gray-700 shadow-lg">
                        {names.map((name, index) => <div key={index}>{name}</div>)}
                    </Tooltip.Popup>
                </Tooltip.Positioner>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

export function ExamDetail() {
    const [params] = useSearchParams();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const examId = Number(params.get("examId") || 0);
    const navigate = useNavigate();
    const access = useExamWorkspaces(workspaceId);
    const examQuery = useExam(workspaceId, examId);
    const queueQuery = useExamQueue(workspaceId, examId, !!examId);
    const queryClient = useQueryClient();
    const now = useExamClock();
    const projectsQuery = useProjectsList(String(workspaceId), { page: 1, limit: 100 });
    const projectTypesQuery = useProjectTypes(workspaceId);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "waiting" | "no_show">("all");
    const [editing, setEditing] = useState(false);
    const [attemptPending, setAttemptPending] = useState(false);
    const [registrationPending, setRegistrationPending] = useState(false);
    const [deleteRow, setDeleteRow] = useState<{ id: number; title: string } | null>(null);

    const exam = examQuery.data;
    const isManager = access.canManage && workspaceId > 0;

    const queueItems = useMemo(() => queueQuery.data?.items ?? [], [queueQuery.data]);
    const [orderedIds, setOrderedIds] = useState<number[] | null>(null);
    const waitingIds = queueItems.filter((item) => item.state === "waiting").map((item) => item.registration_id);
    const originalIds = useMemo(
        () => queueItems.map((item) => item.registration_id),
        [queueItems],
    );
    const visibleIds = orderedIds
        ? originalIds.map((id) => waitingIds.includes(id) ? orderedIds[waitingIds.indexOf(id)] ?? id : id)
        : originalIds;

    const queueByRegistration = useMemo(
        () => new Map(queueItems.map((item) => [item.registration_id, item])),
        [queueItems],
    );
    const projectById = useExamProjects(
        projectsQuery.data?.items ?? [],
        queueItems.map((item) => item.project_id),
        projectsQuery.isLoading,
    );

    const rows = visibleIds.flatMap((registrationId) => {
        const item = queueByRegistration.get(registrationId);
        if (!item) return [];
        const matchesFilter = (() => {
            const project = projectById.get(item.project_id);
            const matchesSearch =
                !search.trim() || project?.name.toLowerCase().includes(search.trim().toLowerCase());
            if (filter === "no_show") return item.state === "no_show" && matchesSearch;
            if (filter === "waiting") return item.state === "waiting" && matchesSearch;
            return matchesSearch;
        })();
        return matchesFilter ? [item] : [];
    });

    const workspace = access.spaces.find((item) => item.id === workspaceId);
    const activeAttempt = queueItems.find((item) => item.state === "running")?.attempt;
    const status = exam ? getExamStatus(exam, queueQuery.data, now) : "draft";
    const examOver = isExamOver(status);
    const nextTeam = queueItems.find((item) => item.state === "waiting" && item.position !== null);
    const otherTeamsRemain = queueItems.some((item) => item.state === "waiting" || item.state === "postponed");
    const canStart = isManager && !activeAttempt && Boolean(nextTeam) && (status === "waiting" || status === "running");
    const statusStyle = statusMeta[status];

    const moveRow = (fromId: number, toId: number) => {
        setOrderedIds((current) => {
            const ids = [...(current ?? waitingIds)];
            const from = ids.indexOf(fromId);
            const to = ids.indexOf(toId);
            if (from < 0 || to < 0) return ids;
            ids.splice(from, 1);
            ids.splice(to, 0, fromId);
            return ids;
        });
    };

    const [savingOrder, setSavingOrder] = useState(false);

    const saveOrder = async () => {
        if (!orderedIds || savingOrder || registrationPending) return;
        setSavingOrder(true);
        try {
            for (const [index, id] of orderedIds.entries()) {
                const result = await queueQuery.refetch({ throwOnError: true });
                const item = result.data?.items.find((row) => row.registration_id === id && row.state === "waiting");
                if (!item) throw new Error("Queue changed");
                if (item.position !== index + 1) {
                    await examApi.place(workspaceId, examId, id, item.registration_version, index + 1);
                }
            }
            toast.success("Порядок выступлений сохранён");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось сохранить весь порядок. Проверьте текущую очередь.");
        } finally {
            await queueQuery.refetch();
            setOrderedIds(null);
            setEditing(false);
            setSavingOrder(false);
        }
    };

    const share = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Ссылка скопирована");
        } catch {
            toast.error("Не удалось скопировать ссылку");
        }
    };

    const startExam = async () => {
        const first = nextTeam;
        if (attemptPending || !canStart) return;
        if (!exam || !first) {
            toast.error("В экзамене нет записанных команд");
            return;
        }
        setAttemptPending(true);
        try {
            await examApi.startAttempt(workspaceId, examId, first.registration_id, first.registration_version);
            await invalidateExam(queryClient, workspaceId, examId);
            toast.success(status === "running" ? "Выступление начато" : "Экзамен начат");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось начать экзамен");
        } finally {
            setAttemptPending(false);
        }
    };

    const finishExam = async () => {
        if (!activeAttempt || attemptPending) return;
        setAttemptPending(true);
        try {
            await examApi.commandAttempt(workspaceId, examId, activeAttempt.id, "finish", activeAttempt.version);
            await invalidateExam(queryClient, workspaceId, examId);
            toast.success(otherTeamsRemain ? "Выступление завершено" : "Экзамен завершён");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось завершить экзамен");
        } finally {
            setAttemptPending(false);
        }
    };

    const setNoShow = async (item: QueueItem) => {
        if (registrationPending || savingOrder) return;
        const restore = item.state === "no_show";
        setRegistrationPending(true);
        try {
            if (restore) {
                await examApi.place(workspaceId, examId, item.registration_id, item.registration_version);
            } else {
                await examApi.noShow(workspaceId, examId, item.registration_id, item.registration_version, "Неявка");
            }
            toast.success(restore ? "Команда возвращена в очередь" : "Неявка отмечена");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось изменить явку команды");
        } finally {
            await queueQuery.refetch();
            setRegistrationPending(false);
        }
    };

    const deleteRegistration = async () => {
        if (!deleteRow || registrationPending || savingOrder) return;
        const item = queueByRegistration.get(deleteRow.id);
        if (!item) return;
        setRegistrationPending(true);
        try {
            await examApi.cancelRegistration(
                workspaceId,
                examId,
                deleteRow.id,
                item.registration_version,
                "Удалено из порядка выступлений",
            );
            await invalidateExam(queryClient, workspaceId, examId);
            setDeleteRow(null);
            toast.success("Команда удалена из очереди");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось удалить команду");
            await queueQuery.refetch();
        } finally {
            setRegistrationPending(false);
        }
    };

    if (examQuery.isLoading) {
        return (
            <ContentLayout title="Экзамен">
                <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
            </ContentLayout>
        );
    }

    if (!exam) {
        return (
            <ContentLayout title="Экзамен не найден">
                <div className="p-8 text-app-muted">{examQuery.isError ? "Не удалось загрузить экзамен" : "Экзамен не найден"}</div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title={exam.configuration.title}>
            <div className="mx-auto max-w-7xl p-4 sm:p-8 flex flex-col gap-8">
                <Breadcrumb className="min-h-[34px] flex flex-wrap gap-y-1.5 items-center">
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink asChild><Link to="/app" className="text-[16px] font-medium text-app-muted">Все пространства</Link></BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbLink asChild><Link to="/app/exams" className="text-[16px] font-medium text-app-muted">Экзамены</Link></BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbPage className="text-[16px] font-medium">{exam.configuration.title}</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#4338CA] text-white">
                            <Icon name="exam" size={32} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-[26px] font-bold leading-[1.2] text-app-text sm:text-[40px]">
                                    {exam.configuration.title}
                                </h1>
                                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ${statusStyle.className}`}>
                                    {statusStyle.label}
                                </span>
                                {exam.status === "published" && (
                                    <span className="inline-flex h-6 items-center rounded-full bg-app-badge-blue px-2.5 text-[12px] font-medium text-app-blue dark:text-blue-300">
                                        {formatExamDate(exam.configuration.starts_at)}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-base font-medium leading-7 text-app-muted">
                                Экзамен для студентов дисциплины «{workspace?.title ?? "Управление проектами"}»
                            </p>
                            <p className="text-[13px] text-app-muted">
                                {workspace?.title ?? `Пространство ${workspaceId}`} · Создан: {formatCreatedDate(exam.created_at)}
                            </p>
                        </div>
                    </div>

                    {!examOver && (
                        <div className="flex items-center gap-2">
                            {canStart && (
                                <Button variant="outline" size="hug36" icon={<Play size={16} />} onClick={startExam} loading={attemptPending}>
                                    {status === "running" ? "Начать следующее выступление" : "Начать экзамен"}
                                </Button>
                            )}
                            {isManager && activeAttempt && (
                                <Button variant="outline" size="hug36" icon={<Square size={16} />} onClick={finishExam} loading={attemptPending}>
                                    {otherTeamsRemain ? "Завершить выступление" : "Завершить экзамен"}
                                </Button>
                            )}
                            {exam.configuration.connection_url && (
                                <Button
                                    variant="dark"
                                    size="hug36"
                                    icon={<LinkIcon size={16} />}
                                    onClick={() => window.open(String(exam.configuration.connection_url), "_blank", "noopener,noreferrer")}
                                >
                                    Подключиться
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" aria-label="Действия с экзаменом" className="h-9 w-9 cursor-pointer rounded-lg p-2 hover:bg-gray-100">
                                        <Ellipsis size={18} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal><DropdownMenuContent align="end" className="w-[220px]">
                                    <DropdownMenuItem className="gap-3" onSelect={share}><Share2 size={16} />Поделиться</DropdownMenuItem>
                                    {isManager && (
                                        <>
                                            <DropdownMenuItem className="gap-3" onSelect={() => navigate(paths.app.examEdit.getHref(workspaceId, examId))}>
                                                <Pencil size={16} />Редактировать экзамен
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent></DropdownMenuPortal>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <section>
                    <h2 className="text-[20px] font-bold text-app-text">Описание экзамена</h2>
                    <p className="mt-2.5 text-[17px] leading-7 text-app-muted">
                        {exam.configuration.description || "Описание не указано"}
                    </p>
                </section>

                {exam.configuration.project_type_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {exam.configuration.project_type_ids.map((typeId) => {
                            const projectType = projectTypesQuery.data?.find((item) => item.id === typeId);
                            return (
                                <span
                                    key={typeId}
                                    className="inline-flex h-7 items-center rounded-[8px] bg-gray-100 px-2.5 text-[12px] font-medium text-gray-900"
                                >
                                    {projectType?.name ?? `Тип проекта ${typeId}`}
                                </span>
                            );
                        })}
                    </div>
                )}

                <section>
                    <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <h2 className="text-[20px] font-bold text-app-text">Порядок выступлений</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Поиск команд"
                                aria-label="Поиск команд"
                                className="h-10 w-[240px] rounded-[12px] border border-gray-200 bg-app-surface px-3 text-[14px] outline-none placeholder:text-app-muted focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <select
                                aria-label="Статус команды"
                                value={filter}
                                onChange={(event) => setFilter(event.target.value as "all" | "waiting" | "no_show")}
                                className="h-10 rounded-[12px] border border-gray-200 bg-app-surface px-3 text-[13px]"
                            >
                                <option value="all">Все команды</option>
                                <option value="waiting">В очереди</option>
                                <option value="no_show">Неявка</option>
                            </select>
                            {editing && !examOver ? (
                                <>
                                    <Button variant="dark" size="hug36" onClick={saveOrder} loading={savingOrder} disabled={registrationPending}>Сохранить изменения</Button>
                                    <Button variant="outline" size="hug36" disabled={savingOrder} onClick={() => { setOrderedIds(null); setEditing(false); }}>Отменить изменения</Button>
                                </>
                            ) : isManager && !examOver ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button type="button" aria-label="Действия над списком" className="h-10 w-10 cursor-pointer rounded-[12px] border border-gray-200 p-2 hover:bg-gray-50">
                                            <Ellipsis size={18} />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuPortal><DropdownMenuContent align="end" className="w-[220px]">
                                        <DropdownMenuItem className="gap-3" onSelect={() => setEditing(true)}><Pencil size={16} />Редактировать</DropdownMenuItem>
                                    </DropdownMenuContent></DropdownMenuPortal>
                                </DropdownMenu>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-[20px] border border-gray-200">
                        <Tooltip.Provider delay={100}>
                        <table className="w-full border-collapse text-left">
                            <thead className="border-b border-gray-200 bg-gray-50 text-app-text">
                                <tr>
                                    {editing && <th className="h-14 w-10 px-3" />}
                                    <th className="h-14 px-6 text-[15px] font-semibold">№</th>
                                    <th className="h-14 px-6 text-[15px] font-semibold">Проект</th>
                                    <th className="h-14 px-6 text-[15px] font-semibold">Руководитель</th>
                                    <th className="h-14 px-6 text-[15px] font-semibold">Команда</th>
                                    <th className="h-14 px-6 text-[15px] font-semibold">Начало защиты</th>
                                    <th scope="col" aria-label="Действия" className="h-14 px-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((item, index) => {
                                    const project = projectById.get(item.project_id);
                                    const noShow = item.state === "no_show";
                                    return (
                                        <tr
                                            key={item.registration_id}
                                            draggable={editing && !savingOrder && item.state === "waiting" && !examOver}
                                            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(item.registration_id))}
                                            onDragOver={(event) => editing && event.preventDefault()}
                                            onDrop={(event) => {
                                                if (!editing || savingOrder || item.state !== "waiting" || examOver) return;
                                                moveRow(Number(event.dataTransfer.getData("text/plain")), item.registration_id);
                                            }}
                                            className={`group border-b border-gray-100 last:border-0 ${editing && item.state === "waiting" ? "cursor-grab active:cursor-grabbing" : ""} ${noShow ? "bg-[--error-bg] text-app-muted" : "hover:bg-gray-50"}`}
                                        >
                                            {editing && (
                                                <td className="px-3 py-4 text-app-muted">
                                                    {item.state === "waiting" && (
                                                        <button
                                                            type="button"
                                                            disabled={savingOrder}
                                                            className="cursor-grab active:cursor-grabbing"
                                                            aria-label="Переместить команду стрелками вверх и вниз"
                                                            onKeyDown={(event) => {
                                                                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                                                                event.preventDefault();
                                                                const ids = orderedIds ?? waitingIds;
                                                                const index = ids.indexOf(item.registration_id);
                                                                const target = ids[index + (event.key === "ArrowUp" ? -1 : 1)];
                                                                if (target) moveRow(item.registration_id, target);
                                                            }}
                                                        >
                                                            <GripVertical size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-[13px]">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                {project ? (
                                                    <Link
                                                        to={paths.app.project.getHref(project.id)}
                                                        className="cursor-pointer text-[13px] font-medium text-app-blue dark:text-blue-300 hover:underline"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-[13px] text-app-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                                                    <Icon name="profile" size={16} />
                                                    {getExamProjectLeader(project) ?? "Имя не указано"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ParticipantsTooltip
                                                    names={
                                                        project?.participants_preview.map(
                                                            (member) => member.full_name,
                                                        ) ?? []
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-[13px] text-gray-600">
                                                {item.planned_start_at ? formatExamTime(item.planned_start_at) : "—"}
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Popover.Root>
                                                            <Popover.Trigger className="cursor-pointer rounded-lg px-2 py-2 text-[13px] font-semibold text-app-blue dark:text-blue-300">
                                                                Оценка
                                                            </Popover.Trigger>
                                                            <Popover.Portal>
                                                            <Popover.Positioner positionMethod="fixed" align="end" sideOffset={8} collisionPadding={8} className="z-50">
                                                            <Popover.Popup aria-label="Оценка команды" className="flex w-[360px] max-w-[var(--available-width)] rounded-xl border border-gray-200 bg-app-surface p-4 shadow-lg">
                                                                {[
                                                                    { title: "Бакалавры", weight: exam.configuration.weights.member },
                                                                    { title: "Магистранты", weight: exam.configuration.weights.manager },
                                                                    { title: "Комиссия", weight: exam.configuration.weights.teacher },
                                                                ].map((grade, gradeIndex) => (
                                                                    <div
                                                                        key={grade.title}
                                                                        className={`flex-1 px-3 text-center ${gradeIndex > 0 ? "border-l border-gray-200" : ""}`}
                                                                    >
                                                                        <div className="text-[13px] font-bold text-app-blue dark:text-blue-300">—</div>
                                                                        <div className="mt-1 text-[12px] text-gray-700">{grade.title}</div>
                                                                        <div className="mt-0.5 text-[11px] text-app-muted">Вес {grade.weight}%</div>
                                                                    </div>
                                                                ))}
                                                            </Popover.Popup>
                                                            </Popover.Positioner>
                                                            </Popover.Portal>
                                                    </Popover.Root>
                                                    {isManager && !examOver && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button type="button" aria-label="Действия с командой" disabled={registrationPending || savingOrder} className="h-9 w-9 cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100"><Ellipsis size={16} /></button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuPortal><DropdownMenuContent align="end" className="w-[220px]">
                                                                {noShow && <DropdownMenuItem className="gap-3" onSelect={() => setNoShow(item)}>Отменить неявку</DropdownMenuItem>}
                                                                {item.state === "waiting" && <DropdownMenuItem className="gap-3" onSelect={() => setNoShow(item)}>Неявка</DropdownMenuItem>}
                                                                <DropdownMenuItem className="gap-3 text-red-600 dark:text-red-300" onSelect={() => setDeleteRow({ id: item.registration_id, title: project?.name ?? "Команда" })}><Trash2 size={16} />Удалить</DropdownMenuItem>
                                                            </DropdownMenuContent></DropdownMenuPortal>
                                                        </DropdownMenu>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {rows.length === 0 && (
                            <div className="py-12 text-center text-sm text-app-muted">{queueQuery.isLoading ? "Загружаем список команд…" : queueQuery.isError ? "Не удалось загрузить список команд" : "Команды не найдены"}</div>
                        )}
                        </Tooltip.Provider>
                    </div>
                </section>
            </div>

            <Dialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Удалить команду?</DialogTitle></DialogHeader>
                    <p className="text-sm text-app-muted">{deleteRow?.title}</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" size="hug36" onClick={() => setDeleteRow(null)}>Отмена</Button>
                        <Button variant="dark" size="hug36" className="!bg-red-700 !text-white hover:!bg-red-800" onClick={deleteRegistration} loading={registrationPending}>Удалить</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ContentLayout>
    );
}
