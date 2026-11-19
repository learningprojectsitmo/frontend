import { useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
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
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    useExamSlots,
} from "@/lib/exams";
import { useProjectsList } from "@/lib/projects";
import { useProjectTypes } from "@/lib/projects";
import { useExamSlotBooking } from "../use-exam-slot-booking";
import { useExamClock } from "../use-exam-clock";
import { getExamProjectLeader, useExamProjects } from "../use-exam-projects";
import { paths } from "@/config/paths";
import { formatExamDate, formatExamTime, getExamStatus, getQueueTime, isAssessmentOpen, isExamOver, statusMeta } from "../exam-display";
import type { ExamSlot, QueueItem, Registration } from "@/types/exam";
import { ApproximateDefenseTime, ExamTimeHint, beforeStartEtaMessage, liveEtaMessage } from "./approximate-defense-time";
import { defaultTimerDurations, getExamTimer, timerDuration, type TimerDurations } from "../exam-timer";
import { applyWaitingOrder, getWaitingIds, reconcileExamOrder } from "../exam-queue-order";
import { ExamAssessment } from "./exam-assessment";
import { ExamPresentation } from "./exam-presentation";
import { planSlotCompaction } from "../exam-schedule";

function ConfirmExamAction({ label, icon, pending, disabled, description, confirmLabel, onConfirm }: {
    label: string;
    icon: ReactNode;
    pending: boolean;
    disabled?: boolean;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="hug36" icon={icon} loading={pending} disabled={disabled}>
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="grid w-[calc(100%-2rem)] max-w-[440px] gap-5">
                <DialogHeader>
                    <DialogTitle>{label}?</DialogTitle>
                </DialogHeader>
                <p className="text-[13px] text-app-muted">{description ?? "Вы уверены?"}</p>
                <div className="flex flex-wrap justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" size="hug36">Отмена</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button variant="blue" size="hug36" disabled={disabled || pending} onClick={() => void onConfirm()}>
                            {confirmLabel ?? label}
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}

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
    return <ExamDetailView key={`${workspaceId}:${examId}`} workspaceId={workspaceId} examId={examId} />;
}

function queueDropKey(row: QueueItem | ExamSlot) {
    return "registration_id" in row ? `team-${row.registration_id}` : `slot-${row.id}`;
}

function ExamDetailView({ workspaceId, examId }: { workspaceId: number; examId: number }) {
    const navigate = useNavigate();
    const access = useExamWorkspaces(workspaceId, true, true);
    const examQuery = useExam(workspaceId, examId);
    const queueQuery = useExamQueue(workspaceId, examId, !!examId);
    const queryClient = useQueryClient();
    const now = useExamClock();
    const projectsQuery = useProjectsList(String(workspaceId), { page: 1, limit: 100 });
    const projectTypesQuery = useProjectTypes(workspaceId);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "waiting" | "no_show">("all");
    const [editing, setEditing] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [draggedTeam, setDraggedTeam] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const queueBody = useRef<HTMLTableSectionElement>(null);
    const previousRowOffsets = useRef(new Map<string, number>());
    const [attemptPending, setAttemptPending] = useState(false);
    const [registrationPending, setRegistrationPending] = useState(false);
    const [deleteRow, setDeleteRow] = useState<{ id: number; title: string } | null>(null);

    const exam = examQuery.data;
    const isManager = access.canManage && workspaceId > 0;
    const showBooking = access.canSelfRegister && !isManager && exam?.status === "published";
    const booking = useExamSlotBooking(workspaceId, examId, exam, now, showBooking);
    const bookingAction = booking.action;
    const freeSlotCount = booking.available.filter((slot) => slot.is_available).length;

    const queueItems = useMemo(() => queueQuery.data?.items ?? [], [queueQuery.data]);
    const hasStarted = queueItems.some((item) => item.attempt || item.started_at);
    const showSchedule = Boolean(queueQuery.data) && !hasStarted;
    const slotsQuery = useExamSlots(workspaceId, examId, showSchedule && Boolean(exam));
    const etaByRegistration = new Map(queueQuery.data?.eta.items.map((item) => [item.registration_id, item]));
    const etaMessage = showSchedule ? beforeStartEtaMessage : liveEtaMessage;
    const queueBySlot = new Map(queueItems.flatMap((item) =>
        item.slot_id === null ? [] : [[item.slot_id, item] as const],
    ));
    const [orderedIds, setOrderedIds] = useState<number[] | null>(null);
    const orderStorageKey = `exam-presentation-order:${workspaceId}:${examId}`;
    const [savedOrder, setSavedOrder] = useState<number[]>(() => {
        try {
            const value: unknown = JSON.parse(sessionStorage.getItem(orderStorageKey) ?? "[]");
            return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isSafeInteger(id)))] : [];
        } catch {
            return [];
        }
    });
    const stableIds = useMemo(() => reconcileExamOrder(savedOrder, queueItems), [savedOrder, queueItems]);
    useEffect(() => {
        if (!queueQuery.data) return;
        if (savedOrder.length === stableIds.length && savedOrder.every((id, index) => id === stableIds[index])) return;
        setSavedOrder(stableIds);
        try {
            sessionStorage.setItem(orderStorageKey, JSON.stringify(stableIds));
        } catch {
            // Keep the order in memory if storage is unavailable.
        }
    }, [orderStorageKey, queueQuery.data, savedOrder, stableIds]);

    const waitingIds = getWaitingIds(queueItems);
    const waitingSet = new Set(waitingIds);
    const draftIsCurrent = orderedIds?.length === waitingIds.length && orderedIds.every((id) => waitingSet.has(id));
    const draft = draftIsCurrent ? orderedIds : null;
    const hasOrderChanges = draft?.some((id, index) => id !== waitingIds[index]) ?? false;
    const visibleIds = draft ? applyWaitingOrder(stableIds, draft) : stableIds;
    const numbers = new Map(visibleIds.map((id, index) => [id, index + 1]));

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

    const visibleTeams = new Set(rows.map((item) => item.registration_id));
    const scheduledSlots = showSchedule
        ? [...(slotsQuery.data?.items ?? [])].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
        : [];
    const orderedTeams = visibleIds.flatMap((id) => {
        const item = queueByRegistration.get(id);
        return item ? [item] : [];
    });
    // Empty slots keep their places in the schedule while team rows follow the queue.
    let teamIndex = 0;
    const scheduleRows = scheduledSlots.map((slot) => queueBySlot.has(slot.id) ? orderedTeams[teamIndex++] ?? slot : slot);
    const allTableRows = [...scheduleRows, ...orderedTeams.slice(teamIndex)];
    const tableRows = allTableRows
        .map((row, index) => ({ row, number: index + 1 }))
        .filter(({ row }) => !("registration_id" in row) || visibleTeams.has(row.registration_id));

    useLayoutEffect(() => {
        const rows = queueBody.current?.querySelectorAll<HTMLTableRowElement>("[data-queue-row]");
        if (!rows) return;
        const offsets = new Map<string, number>();
        const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        for (const row of rows) {
            const key = row.dataset.queueRow;
            if (!key) continue;
            const offset = row.offsetTop;
            const previous = previousRowOffsets.current.get(key);
            offsets.set(key, offset);
            if (animate && previous !== undefined && previous !== offset) {
                row.animate(
                    [{ transform: `translateY(${previous - offset}px)` }, { transform: "translateY(0)" }],
                    { duration: 180, easing: "ease-out" },
                );
            }
        }
        previousRowOffsets.current = offsets;
    });

    const workspace = access.spaces.find((item) => item.id === workspaceId);
    const currentTeam = queueItems.find((item) => item.state === "running");
    const activeAttempt = currentTeam?.attempt;
    const timerStorageKey = `exam-timer:${workspaceId}:${examId}`;
    const [teamDurations, setTeamDurations] = useState<Record<number, TimerDurations>>(() => {
        try {
            return JSON.parse(sessionStorage.getItem(timerStorageKey) ?? "{}") ?? {};
        } catch {
            return {};
        }
    });
    const firstPauseStorageKey = `${timerStorageKey}:first-pause`;
    const [firstPause, setFirstPause] = useState<{ attemptId: number; phaseStartedAt: string; delayMs: number } | null>(() => {
        try {
            return JSON.parse(sessionStorage.getItem(firstPauseStorageKey) ?? "null");
        } catch {
            return null;
        }
    });
    const [preparingFirst, setPreparingFirst] = useState(false);
    const [forwardIds, setForwardIds] = useState<number[]>([]);
    const postponedTeams = queueItems.filter((item) => item.state === "postponed" && item.attempt?.status === "postponed");
    const forwardTeam = postponedTeams.find((item) => item.registration_id === forwardIds[0]);
    const status = exam ? getExamStatus(exam, queueQuery.data, now, queueQuery.dataUpdatedAt) : "draft";
    const examOver = isExamOver(status);
    const serverNow = getQueueTime(queueQuery.data, now, queueQuery.dataUpdatedAt);
    const nextTeam = queueItems.find((item) => item.state === "waiting" && item.position !== null);
    const followingTeam = forwardTeam ?? nextTeam ?? queueItems.find((item) => item.state === "postponed");
    const remainingTeams = queueItems.filter((item) => item.state === "waiting" || item.state === "postponed");
    const canStart = isManager && exam?.status === "published" && !examOver && status !== "running" && !activeAttempt && Boolean(followingTeam);
    const currentIndex = currentTeam ? stableIds.indexOf(currentTeam.registration_id) : -1;
    const earlierTeams = currentIndex > 0
        ? stableIds.slice(0, currentIndex).reverse().map((id) => queueByRegistration.get(id))
        : [];
    const previousTeam = earlierTeams.find((item) => item?.state === "postponed" && item.attempt?.status === "postponed");
    const previousUnavailable = examOver ? "экзамен завершён."
        : exam?.status !== "published" || !currentTeam ? "нет текущего выступления."
        : currentIndex <= 0 ? "сейчас выступает первая команда."
        : previousTeam ? undefined
        : earlierTeams.some((item) => item?.state === "finished") ? "завершённые выступления нельзя возобновить."
        : "среди предыдущих команд нет отложенных выступлений.";
    const canFinishExam = isManager && Boolean(activeAttempt) && remainingTeams.length === 0;
    const statusStyle = statusMeta[status];

    const moveRow = (fromId: number, toId: number) => {
        setOrderedIds(() => {
            const ids = [...(draft ?? waitingIds)];
            const from = ids.indexOf(fromId);
            const to = ids.indexOf(toId);
            if (from < 0 || to < 0) return ids;
            ids.splice(from, 1);
            ids.splice(to, 0, fromId);
            return ids;
        });
    };

    const canReorder = isManager && editing && !examOver && !savingOrder && !registrationPending && !attemptPending;

    function canDropOn(sourceId: number, row: QueueItem | ExamSlot) {
        if (!canReorder || !waitingSet.has(sourceId)) return false;
        return "registration_id" in row
            ? sourceId !== row.registration_id && waitingSet.has(row.registration_id)
            : showSchedule && queueByRegistration.get(sourceId)?.slot_id != null && !queueBySlot.has(row.id);
    }

    const moveToSlot = async (source: QueueItem, slot: ExamSlot) => {
        if (source.slot_id === null) return;
        const oldSlotId = source.slot_id;
        const teamsAhead = allTableRows.slice(0, allTableRows.indexOf(slot)).filter(
            (row) => "registration_id" in row && row.registration_id !== source.registration_id && row.position !== null,
        );
        const position = teamsAhead.length + 1;
        let moved: Registration | undefined;
        setRegistrationPending(true);
        try {
            const result = await examApi.moveRegistration(workspaceId, examId, {
                id: source.registration_id, version: source.registration_version,
            }, slot.id);
            moved = result.target;
            if (source.position !== position) {
                await examApi.place(workspaceId, examId, moved.id, moved.version, position);
            }
            if (draft) {
                const ids = draft.filter((id) => id !== source.registration_id);
                ids.splice(teamsAhead.filter((row) => "registration_id" in row && waitingSet.has(row.registration_id)).length, 0, source.registration_id);
                setOrderedIds(ids);
            }
            toast.success(`Команда перенесена на ${formatExamTime(slot.starts_at)}`);
        } catch (error) {
            const detail = getExamErrorMessage(error);
            let message = "Не удалось перенести команду.";
            if (moved) {
                try {
                    await examApi.moveRegistration(workspaceId, examId, moved, oldSlotId);
                    message = "Не удалось изменить порядок. Команда возвращена в исходный слот.";
                } catch {
                    message = "Не удалось подтвердить перенос или вернуть исходный слот. Проверьте обновлённую очередь.";
                }
            }
            toast.error(detail ? `${message} ${detail}` : message);
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            setRegistrationPending(false);
        }
    };

    function dropTeam(sourceId: number, row: QueueItem | ExamSlot) {
        if (!canDropOn(sourceId, row)) return;
        if ("registration_id" in row) {
            moveRow(sourceId, row.registration_id);
        } else {
            const source = queueByRegistration.get(sourceId);
            if (source) void moveToSlot(source, row);
        }
    }

    function clearDrag() {
        setDraggedTeam(null);
        setDropTarget(null);
    }

    function dropEvents(row: QueueItem | ExamSlot) {
        return {
            onDragOver: (event: DragEvent<HTMLTableRowElement>) => {
                if (draggedTeam === null) return;
                const allowed = canDropOn(draggedTeam, row);
                event.dataTransfer.dropEffect = allowed ? "move" : "none";
                if (allowed) event.preventDefault();
                setDropTarget(allowed ? queueDropKey(row) : null);
            },
            onDragLeave: (event: DragEvent<HTMLTableRowElement>) => {
                if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
                setDropTarget((target) => target === queueDropKey(row) ? null : target);
            },
            onDrop: (event: DragEvent<HTMLTableRowElement>) => {
                if (draggedTeam === null) return;
                event.preventDefault();
                dropTeam(draggedTeam, row);
                clearDrag();
            },
        };
    }

    function dragStyle(row: QueueItem | ExamSlot) {
        if (draggedTeam === null) return "";
        if ("registration_id" in row && draggedTeam === row.registration_id) {
            return "relative cursor-grabbing opacity-60 shadow-lg";
        }
        if (!canDropOn(draggedTeam, row)) return "cursor-not-allowed";
        if (dropTarget !== queueDropKey(row)) return "";
        const ids = draft ?? waitingIds;
        const after = "registration_id" in row && ids.indexOf(draggedTeam) < ids.indexOf(row.registration_id);
        return after
            ? "[&>td]:bg-[#155DFC12] [&>td]:shadow-[inset_0_-2px_#155DFC]"
            : "[&>td]:bg-[#155DFC12] [&>td]:shadow-[inset_0_2px_#155DFC]";
    }

    const saveOrder = async () => {
        if (savingOrder || registrationPending || attemptPending) return;
        if (orderedIds && !draft) {
            setOrderedIds(null);
            toast.error("Состав очереди изменился. Проверьте порядок и повторите перестановку.");
            return;
        }
        if (!draft || !hasOrderChanges) return;
        setSavingOrder(true);
        try {
            for (const [index, id] of draft.entries()) {
                const result = await queueQuery.refetch({ throwOnError: true });
                const items = result.data?.items ?? [];
                const liveWaiting = getWaitingIds(items);
                if (liveWaiting.length !== waitingSet.size || liveWaiting.some((waitingId) => !waitingSet.has(waitingId))) {
                    throw new Error("Queue changed");
                }
                const item = items.find((row) => row.registration_id === id);
                const position = items.find((row) => row.registration_id === liveWaiting[index])?.position;
                if (!item || position == null) throw new Error("Queue changed");
                if (item.position !== position) {
                    await examApi.place(workspaceId, examId, id, item.registration_version, position);
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

    const finishExam = async () => {
        if (!isManager || !activeAttempt || attemptPending || registrationPending || savingOrder) return;
        setAttemptPending(true);
        try {
            const latest = await queueQuery.refetch({ throwOnError: true });
            const items = latest.data?.items ?? [];
            const current = items.find((item) => item.state === "running")?.attempt;
            if (current?.id !== activeAttempt.id) {
                toast.error("Текущая команда изменилась. Проверьте очередь выступлений.");
                return;
            }
            if (items.some((item) => item.state === "waiting" || item.state === "postponed")) {
                toast.error("Очередь изменилась. Проверьте, все ли команды выступили.");
                return;
            }
            await examApi.commandAttempt(workspaceId, examId, current.id, "finish", current.version);
            toast.success("Выступление завершено. Оценивание открыто.");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось завершить выступление");
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            setAttemptPending(false);
        }
    };

    const toggleTimer = async () => {
        if (!isManager || !activeAttempt || attemptPending) return;
        setAttemptPending(true);
        try {
            await examApi.commandAttempt(workspaceId, examId, activeAttempt.id, activeAttempt.paused_at ? "resume" : "pause", activeAttempt.version);
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось изменить состояние таймера");
        } finally {
            await queueQuery.refetch();
            setAttemptPending(false);
        }
    };

    const switchTeam = async (target: QueueItem | undefined, action: "first" | "previous" | "next") => {
        if (!target || !isManager || exam?.status !== "published" || examOver || attemptPending || savingOrder || registrationPending) return;
        if (action === "first" && editing) return;
        if (action === "previous" && (previousUnavailable || target !== previousTeam)) return;
        setAttemptPending(true);
        if (action === "first") setPreparingFirst(true);
        let finishedCurrent = false;
        let firstStarted = false;
        let compacting = false;
        let movedSlots = 0;
        try {
            if (activeAttempt) {
                if (action === "previous") {
                    await examApi.commandAttempt(workspaceId, examId, activeAttempt.id, "postpone", activeAttempt.version, "Возврат к предыдущей команде");
                } else {
                    await examApi.commandAttempt(workspaceId, examId, activeAttempt.id, "finish", activeAttempt.version);
                    finishedCurrent = true;
                }
            }
            const refreshed = await queueQuery.refetch({ throwOnError: true });
            let items = refreshed.data?.items ?? [];
            if (action === "first") {
                if (items.some((item) => item.attempt || item.started_at)) {
                    toast.error("Экзамен уже начался. Проверьте текущую очередь.");
                    return;
                }
                compacting = true;
                const [slots, registrations] = await Promise.all([
                    examApi.slots(workspaceId, examId),
                    examApi.registrations(workspaceId, examId),
                ]);
                // Organizers can move teams into earlier slots even after the scheduled start.
                for (const { registration, to } of planSlotCompaction(slots.items, registrations.items)) {
                    await examApi.moveRegistration(workspaceId, examId, registration, to.id);
                    movedSlots += 1;
                }
                items = (await queueQuery.refetch({ throwOnError: true })).data?.items ?? [];
                compacting = false;
                if (items.some((item) => item.attempt || item.started_at)) {
                    toast.error("Экзамен уже начался. Проверьте текущую очередь.");
                    return;
                }
            }
            let next = action === "first"
                ? items.find((item) => item.state === "waiting" && item.position !== null)
                    ?? items.find((item) => item.state === "postponed")
                : items.find((item) => item.registration_id === target.registration_id);
            if (next?.state === "postponed" && !next.attempt) {
                await examApi.place(workspaceId, examId, next.registration_id, next.registration_version, 1);
                const placed = await queueQuery.refetch({ throwOnError: true });
                next = placed.data?.items.find((item) => item.registration_id === next?.registration_id);
            }
            if (next?.state !== "waiting" && next?.state !== "postponed") {
                throw new Error("Team is no longer available");
            }
            const attempt = next.attempt?.status === "postponed"
                ? await examApi.commandAttempt(workspaceId, examId, next.attempt.id, "restart", next.attempt.version)
                : await examApi.startAttempt(workspaceId, examId, next.registration_id, next.registration_version);

            if (action === "first") {
                firstStarted = true;
                const paused = await examApi.commandAttempt(workspaceId, examId, attempt.id, "pause", attempt.version, "Ожидание запуска таймера");
                if (paused.paused_at) {
                    const initial = {
                        attemptId: paused.id,
                        phaseStartedAt: paused.phase_started_at,
                        delayMs: Math.max(0, Date.parse(paused.paused_at) - Date.parse(paused.phase_started_at)),
                    };
                    setFirstPause(initial);
                    try {
                        sessionStorage.setItem(firstPauseStorageKey, JSON.stringify(initial));
                    } catch {
                        // The current page can still account for the initial delay.
                    }
                }
                toast.success("Экзамен начат. Нажмите Play, чтобы запустить таймер.");
            }
            if (action === "previous" && currentTeam) {
                setForwardIds((ids) => [currentTeam.registration_id, ...ids]);
            } else {
                setForwardIds((ids) => ids.filter((id) => id !== target.registration_id));
            }
        } catch (error) {
            const message = getExamErrorMessage(error) ?? "Не удалось начать выступление выбранной команды.";
            if (compacting) {
                const detail = getExamErrorMessage(error);
                const progress = movedSlots ? ` Перенесено команд: ${movedSlots}.` : "";
                toast.error(`Не удалось уплотнить очередь. Экзамен не запущен.${progress}${detail ? ` ${detail}` : ""}`);
            } else if (firstStarted) {
                toast.error("Экзамен начат, но сервер не подтвердил паузу. Проверьте таймер.");
            } else {
                toast.error(finishedCurrent ? `Текущее выступление завершено. ${message}` : message);
            }
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            setPreparingFirst(false);
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

    const defaults = defaultTimerDurations(exam.configuration);
    const settingsTeam = currentTeam ?? followingTeam;
    const durationsFor = (id: number) => teamDurations[id] ?? defaults;
    const durations = settingsTeam ? durationsFor(settingsTeam.registration_id) : defaults;
    const initialDelayMs = firstPause && activeAttempt?.id === firstPause.attemptId
        && activeAttempt.phase_started_at === firstPause.phaseStartedAt ? firstPause.delayMs : 0;
    const timer = getExamTimer(preparingFirst ? null : activeAttempt, durations, defaults, queueQuery.dataUpdatedAt, now, initialDelayMs);
    const currentEndsAt = activeAttempt ? now + Math.max(0, timer.remaining) * 1000 : undefined;
    const queueStartsAt = currentEndsAt ?? Math.max(now, Date.parse(exam.configuration.starts_at));
    const queueEndsAt = activeAttempt || remainingTeams.length
        ? queueStartsAt + remainingTeams.reduce((sum, item) => sum + timerDuration(durationsFor(item.registration_id)) * 1000, 0)
        : undefined;

    const saveTimerDurations = (value: TimerDurations) => {
        if (!settingsTeam || !isManager || attemptPending || (activeAttempt && !activeAttempt.paused_at)) return;
        const updated = { ...teamDurations, [settingsTeam.registration_id]: value };
        setTeamDurations(updated);
        try {
            sessionStorage.setItem(timerStorageKey, JSON.stringify(updated));
        } catch {
            // Keep the settings in memory when browser storage is unavailable.
        }
    };

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
                                <ConfirmExamAction
                                    key={followingTeam?.registration_id}
                                    label="Начать экзамен"
                                    confirmLabel="Начать"
                                    disabled={editing || savingOrder || registrationPending}
                                    description={scheduledSlots.length ? "При старте команды займут более ранние свободные слоты, а пустые строки исчезнут из таблицы." : undefined}
                                    icon={<Play size={16} />}
                                    pending={attemptPending}
                                    onConfirm={() => switchTeam(followingTeam, "first")}
                                />
                            )}
                            {canFinishExam && activeAttempt && (
                                <ConfirmExamAction
                                    key={activeAttempt.id}
                                    label="Завершить экзамен"
                                    icon={<Square size={16} />}
                                    pending={attemptPending}
                                    onConfirm={finishExam}
                                />
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

                <ExamPresentation
                    current={currentTeam}
                    project={currentTeam && projectById.get(currentTeam.project_id)}
                    number={currentTeam ? numbers.get(currentTeam.registration_id) : undefined}
                    attempt={activeAttempt}
                    timer={timer}
                    durations={durations}
                    settingsTeamId={settingsTeam?.registration_id}
                    onSaveDurations={saveTimerDurations}
                    canManage={isManager}
                    pending={attemptPending || registrationPending || savingOrder}
                    previousUnavailable={previousUnavailable}
                    canGoForward={exam.status === "published" && !examOver && !canStart && Boolean(followingTeam)}
                    onToggle={() => void toggleTimer()}
                    onPrevious={() => void switchTeam(previousTeam, "previous")}
                    onNext={() => void switchTeam(followingTeam, "next")}
                />

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
                        {booking.inMode ? (
                            <Button variant="outline" size="hug36" disabled={booking.pending} onClick={() => booking.setSelecting(false)}>
                                Выйти из режима записи
                            </Button>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                {booking.canBook && (
                                    <Button variant="dark" size="hug36" onClick={() => booking.setSelecting(true)}>
                                        Записаться на защиту
                                    </Button>
                                )}
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
                                        <Button variant="dark" size="hug36" onClick={saveOrder} loading={savingOrder} disabled={!hasOrderChanges || registrationPending || attemptPending}>Сохранить изменения</Button>
                                        <Button variant="outline" size="hug36" disabled={savingOrder} onClick={() => { setOrderedIds(null); setEditing(false); }}>
                                            {hasOrderChanges ? "Отменить изменения" : "Готово"}
                                        </Button>
                                    </>
                                ) : isManager && !examOver ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button type="button" aria-label="Действия над списком" className="h-10 w-10 cursor-pointer rounded-[12px] border border-gray-200 p-2 hover:bg-gray-50">
                                                <Ellipsis size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuPortal><DropdownMenuContent align="end" className="w-[220px]">
                                            <DropdownMenuItem className="gap-3" disabled={attemptPending} onSelect={() => setEditing(true)}><Pencil size={16} />Редактировать</DropdownMenuItem>
                                        </DropdownMenuContent></DropdownMenuPortal>
                                    </DropdownMenu>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {showSchedule && scheduledSlots.length > 0 && exam.status === "published" && (
                        <p className="mb-4 text-sm text-app-muted">
                            При старте экзамена команды переместятся на более ранние свободные слоты. В таблице останутся только команды.
                        </p>
                    )}

                    {showBooking && (
                        <div className="mb-4 space-y-3 text-sm text-app-muted" aria-live="polite">
                            {booking.active.map((registration) => {
                                const slot = booking.available.find((item) => item.id === registration.slot_id);
                                const plannedStart = queueByRegistration.get(registration.id)?.planned_start_at;
                                const time = plannedStart ?? slot?.starts_at;
                                const eta = etaByRegistration.get(registration.id);
                                return (
                                    <div key={registration.id} className="flex flex-wrap items-center gap-3">
                                        {time ? (
                                            <Tooltip.Provider delay={100}>
                                                <span>Вы записаны на слот в <ApproximateDefenseTime value={time} /></span>
                                            </Tooltip.Provider>
                                        ) : <span>Вы записаны на защиту</span>}
                                        {eta && <span>Прогноз начала: {eta.certainty === "lower_bound" && "не раньше "}<ApproximateDefenseTime value={eta.eta_at} message={etaMessage} /></span>}
                                        {booking.canCancel(registration) ? (
                                            <Button variant="outline" size="hug36" disabled={booking.pending} onClick={() => booking.selectCancellation(registration)}>
                                                Отменить запись
                                            </Button>
                                        ) : registration.started_at ? (
                                            <span>Защита уже началась. Отмена записи недоступна.</span>
                                        ) : !booking.isOpen ? (
                                            <span>Отменить запись можно до закрытия записи на экзамен.</span>
                                        ) : !booking.loading && !booking.error ? (
                                            <span>Для этого проекта отмена записи недоступна.</span>
                                        ) : null}
                                    </div>
                                );
                            })}
                            {booking.error ? (
                                <p>Не удалось загрузить данные для записи на защиту. Попробуйте обновить страницу.</p>
                            ) : booking.loading ? (
                                <p>Проверяем возможность записи…</p>
                            ) : !booking.active.length && !booking.isOpen ? (
                                <p>Запись сейчас недоступна. Она закрывается за час до начала экзамена или раньше, если установлен другой срок.</p>
                            ) : !booking.active.length && !booking.eligible.length ? (
                                <p>У вас нет своего проекта подходящего типа в этом пространстве.</p>
                            ) : null}
                            {booking.canBook && (
                                <p>
                                    Свободно {freeSlotCount} слотов из {booking.available.length}
                                </p>
                            )}
                            {booking.canBook && freeSlotCount === 0 && <p>Свободных слотов нет</p>}
                            {booking.inMode && freeSlotCount > 0 && (
                                <p>Выберите свободный слот и нажмите «Занять место».</p>
                            )}
                            {booking.inMode && booking.eligible.length > 1 && (
                                <label className="flex flex-wrap items-center gap-2">
                                    Проект
                                    <select
                                        className="min-w-0 max-w-full rounded-lg border border-gray-200 bg-app-surface px-3 py-2 text-app-text"
                                        value={booking.selected?.id}
                                        disabled={booking.pending}
                                        onChange={(event) => booking.setProjectId(Number(event.target.value))}
                                    >
                                        {booking.eligible.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                                    </select>
                                </label>
                            )}
                        </div>
                    )}

                    {isManager && (currentEndsAt !== undefined || queueEndsAt !== undefined) && (
                        <section aria-labelledby="exam-forecast-title" className="mb-5 overflow-hidden rounded-[22px] border border-[#DCE6FA] bg-[#F5F8FF] dark:border-[#293B5A] dark:bg-[#121D30]">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-7">
                                <div className="flex items-center gap-2.5">
                                    <Icon name="clock" size={18} className="text-[#155DFC] dark:text-[#90B8FF]" />
                                    <h3 id="exam-forecast-title" className="text-[15px] font-semibold text-[#182844] dark:text-[#E8EFFF]">
                                        Прогноз окончания
                                    </h3>
                                    <ExamTimeHint message={etaMessage} />
                                </div>
                                {activeAttempt?.paused_at && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-app-badge-amber px-2.5 py-1 text-xs font-medium text-app-badge-amber-fg">
                                        <Icon name="pause" size={14} />
                                        Если продолжить сейчас
                                    </span>
                                )}
                            </div>
                            <dl className="grid grid-cols-1 px-5 pb-5 pt-4 min-[420px]:grid-cols-2 sm:px-7 sm:pb-6">
                                {([
                                    { label: "Окончание команды", timestamp: currentEndsAt, last: false },
                                    { label: "Окончание очереди", timestamp: queueEndsAt, last: true },
                                ] as const).map(({ label, timestamp, last }) => {
                                    const time = timestamp === undefined ? null : new Date(timestamp).toISOString();
                                    return (
                                        <div key={label} className="relative min-w-0 border-l border-[#BDCEF0] pb-4 pl-5 last:border-l-transparent last:pb-0 min-[420px]:border-l-0 min-[420px]:pb-0 min-[420px]:pl-0 dark:border-[#4B648F]">
                                            <div aria-hidden="true" className="absolute -left-[5px] top-[7px] flex items-center min-[420px]:static min-[420px]:mb-3 min-[420px]:h-3">
                                                <span className={`size-[9px] shrink-0 rounded-full border-2 border-[#155DFC] dark:border-[#90B8FF] ${last ? "bg-[#155DFC] dark:bg-[#90B8FF]" : "bg-[#F5F8FF] dark:bg-[#121D30]"}`} />
                                                {!last && <span className="hidden h-px flex-1 bg-gradient-to-r from-[#155DFC] to-[#BDCEF0] min-[420px]:block dark:from-[#90B8FF] dark:to-[#4B648F]" />}
                                            </div>
                                            <dt className="text-[13px] font-medium text-[#4B5D7D] dark:text-[#ACBCDA]">{label}</dt>
                                            <dd className={`mt-1 flex items-baseline gap-1.5 text-[clamp(30px,5vw,46px)] font-semibold leading-none tracking-tight tabular-nums ${last ? "text-[#155DFC] dark:text-[#90B8FF]" : "text-[#182844] dark:text-[#E8EFFF]"}`}>
                                                {time ? (
                                                    <>
                                                        <span className="text-xl font-normal opacity-70">≈</span>
                                                        <time dateTime={time}>{formatExamTime(time)}</time>
                                                    </>
                                                ) : "—"}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </section>
                    )}

                    {canReorder && (
                        <p id="exam-reorder-help" className="mb-3 text-sm text-app-muted">
                            Перетащите команду или переместите её стрелками на ручке. Перенос в свободный слот сохраняется сразу. Перестановку команд подтвердите кнопкой «Сохранить изменения».
                        </p>
                    )}

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
                            <tbody ref={queueBody}>
                                {booking.inMode ? booking.available.map((slot, index) => {
                                    const item = queueBySlot.get(slot.id);
                                    const project = item && projectById.get(item.project_id);
                                    return (
                                        <tr
                                            key={slot.id}
                                            className={`border-b border-gray-100 last:border-0 ${item?.state === "running" ? "bg-[#155DFC12]" : item?.state === "finished" ? "bg-[#ECFDF3] dark:bg-emerald-950/35" : slot.is_available ? "bg-green-50 dark:bg-green-950/40" : "text-app-muted"}`}
                                        >
                                            <td className="px-6 py-4 text-[13px]">{index + 1}</td>
                                            <td className="px-6 py-4 text-[13px]">
                                                {slot.is_available ? (
                                                    <span className="rounded-full bg-green-100 px-2 py-1 font-medium text-green-900 dark:bg-green-900 dark:text-green-100">
                                                        Свободно
                                                    </span>
                                                ) : project ? `${project.name} · Занято` : "Занято"}
                                            </td>
                                            <td className="px-6 py-4 text-[13px]">{getExamProjectLeader(project) ?? "—"}</td>
                                            <td className="px-6 py-4">
                                                <ParticipantsTooltip names={project?.participants_preview.map((member) => member.full_name) ?? []} />
                                            </td>
                                            <td className="px-6 py-4 text-[13px]"><ApproximateDefenseTime value={slot.starts_at} /></td>
                                            <td className="px-3 py-4 text-right">
                                                {slot.is_available && (
                                                    <Button
                                                        variant="dark"
                                                        size="hug36"
                                                        className="cursor-pointer motion-reduce:transition-none"
                                                        disabled={booking.pending}
                                                        aria-label={`Занять место в ${formatExamTime(slot.starts_at)}`}
                                                        onClick={() => booking.selectSlot(slot)}
                                                    >
                                                        Занять место
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }) : tableRows.map(({ row, number }) => {
                                    if (!("registration_id" in row)) {
                                        return (
                                            <tr key={queueDropKey(row)} data-queue-row={queueDropKey(row)} {...dropEvents(row)}
                                                className={`border-b border-gray-100 bg-[#F5F6F8] text-app-muted last:border-0 dark:border-gray-700 dark:bg-white/5 [&>td]:transition-colors motion-reduce:[&>td]:transition-none ${dragStyle(row)}`}>
                                                {editing && <td />}
                                                <td className="px-6 py-4 text-[13px]">{number}</td>
                                                <td className="px-6 py-4">—</td>
                                                <td className="px-6 py-4">—</td>
                                                <td className="px-6 py-4">—</td>
                                                <td className="px-6 py-4 text-[13px] text-app-text">{formatExamTime(row.starts_at)}</td>
                                                <td />
                                            </tr>
                                        );
                                    }
                                    const item = row;
                                    const eta = etaByRegistration.get(item.registration_id);
                                    const project = projectById.get(item.project_id);
                                    const noShow = item.state === "no_show";
                                    const assessmentWindow = item.attempt?.assessment_window;
                                    return (
                                        <tr
                                            key={item.registration_id}
                                            data-queue-row={queueDropKey(item)}
                                            draggable={canReorder && waitingSet.has(item.registration_id)}
                                            onDragStart={(event) => {
                                                if (!canReorder || !waitingSet.has(item.registration_id)) {
                                                    event.preventDefault();
                                                    return;
                                                }
                                                event.dataTransfer.setData("text/plain", String(item.registration_id));
                                                event.dataTransfer.effectAllowed = "move";
                                                setDraggedTeam(item.registration_id);
                                            }}
                                            onDragEnd={clearDrag}
                                            {...dropEvents(item)}
                                            className={`group border-b border-gray-100 last:border-0 [&>td]:transition-colors motion-reduce:[&>td]:transition-none ${draggedTeam === null && canReorder && waitingSet.has(item.registration_id) ? "cursor-grab active:cursor-grabbing" : ""} ${dragStyle(item)} ${item.state === "running" ? "bg-[#155DFC12]" : item.state === "finished" ? "bg-[#ECFDF3] dark:bg-emerald-950/35" : noShow ? "bg-[--error-bg] text-app-muted" : "hover:bg-gray-50"}`}
                                        >
                                            {editing && (
                                                <td className="px-3 py-4 text-app-muted">
                                                    {item.state === "waiting" && (
                                                        <button
                                                            type="button"
                                                            aria-disabled={!canReorder || !waitingSet.has(item.registration_id)}
                                                            className={draggedTeam === item.registration_id ? "cursor-grabbing" : draggedTeam !== null ? "cursor-inherit" : "cursor-grab active:cursor-grabbing aria-disabled:cursor-not-allowed"}
                                                            aria-label={`Переместить команду «${project?.name ?? "Проект команды"}»`}
                                                            aria-describedby={canReorder ? "exam-reorder-help" : undefined}
                                                            onKeyDown={(event) => {
                                                                if (!canReorder || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
                                                                event.preventDefault();
                                                                const index = tableRows.findIndex(({ row }) => row === item);
                                                                const candidates = event.key === "ArrowUp"
                                                                    ? tableRows.slice(0, index).reverse() : tableRows.slice(index + 1);
                                                                const target = candidates.find(({ row }) => canDropOn(item.registration_id, row));
                                                                if (target) dropTeam(item.registration_id, target.row);
                                                            }}
                                                        >
                                                            <GripVertical size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-[13px]">{scheduledSlots.length ? number : numbers.get(item.registration_id)}</td>
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
                                                <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-200">
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
                                            <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-gray-300">
                                                {item.planned_start_at ? <ApproximateDefenseTime value={item.planned_start_at} /> : "—"}
                                                {eta && (
                                                    <div className="mt-1 text-xs text-app-muted">
                                                        Прогноз: {eta.certainty === "lower_bound" && "не раньше "}<ApproximateDefenseTime value={eta.eta_at} message={etaMessage} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {assessmentWindow && isAssessmentOpen(item, serverNow) ? (
                                                        <ExamAssessment
                                                            workspaceId={workspaceId}
                                                            typeId={assessmentWindow.project_type_id}
                                                            projectName={project?.name ?? "Проект команды"}
                                                        />
                                                    ) : (examOver || item.state === "finished") && (
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
                                                    )}
                                                    {isManager && !examOver && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button type="button" aria-label="Действия с командой" disabled={registrationPending || savingOrder || attemptPending} className="h-9 w-9 cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100"><Ellipsis size={16} /></button>
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
                        {!booking.inMode && tableRows.length === 0 && (
                            <div className="py-12 text-center text-sm text-app-muted">{queueQuery.isLoading ? "Загружаем список команд…" : queueQuery.isError ? "Не удалось загрузить список команд" : "Команды не найдены"}</div>
                        )}
                        </Tooltip.Provider>
                    </div>
                </section>
            </div>

            <Dialog open={!!booking.action} onOpenChange={(open) => !open && booking.dismiss()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {bookingAction?.kind === "book"
                                ? `Занять слот в ${formatExamTime(bookingAction.slot.starts_at)}?`
                                : "Отменить запись на защиту?"}
                        </DialogTitle>
                    </DialogHeader>
                    {bookingAction?.kind === "book" && (
                        <p className="text-sm text-app-muted">
                            {booking.eligible.find((project) => project.id === bookingAction.projectId)?.name}
                            <span className="mt-1 block">{beforeStartEtaMessage}</span>
                        </p>
                    )}
                    {booking.action && !booking.canConfirm && !booking.pending && (
                        <p className="text-sm text-app-muted">Данные записи изменились. Закройте окно и проверьте список.</p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="hug36" disabled={booking.pending} onClick={booking.dismiss}>
                            {bookingAction?.kind === "cancel" ? "Оставить запись" : "Отмена"}
                        </Button>
                        <Button variant="dark" size="hug36" loading={booking.pending} disabled={!booking.canConfirm} onClick={booking.confirm}>
                            {bookingAction?.kind === "cancel" ? "Отменить запись" : "Подтвердить"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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
