import { queryKeys } from "@/lib/query-keys";

import { getExamQueueReceivedAt } from "../exam-queue-snapshot";
import { ExamErrorState } from "@/features/exam/components/exam-error-state";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type DragEvent,
    type ReactNode,
} from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import {
    ChevronDown,
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
    isExamAccessDenied,
    invalidateExam,
    useExam,
    useExamQueue,
    useExamRegistrations,
    useExamSettingsRevision,
    useExamSlots,
} from "@/lib/exams";
import { useProjectsList, useRecentProjectsList } from "@/lib/projects";
import { useProjectTypes } from "@/lib/projects";
import { useExamSlotBooking } from "../use-exam-slot-booking";
import { useExamClock } from "../use-exam-clock";
import { getExamProjectLeader, useExamProjects } from "../use-exam-projects";
import { paths } from "@/config/paths";
import {
    canChangeExamRegistration,
    formatExamDate,
    formatExamRegistrationWindow,
    formatExamTime,
    getExamStatus,
    getQueueTime,
    hasExamStarted,
    isAssessmentOpen,
    isExamOver,
    shouldShowExamSchedule,
    statusMeta,
} from "../exam-display";
import type { ExamSlot, QueueItem, Registration } from "@/types/exam";
import { formatScheduleTime, getSlotInterval } from "../exam-schedule";
import {
    ApproximateDefenseTime,
    ExamTimeHint,
    beforeStartEtaMessage,
    liveEtaMessage,
} from "./approximate-defense-time";
import {
    getExamAutoStartState,
    getExamTimer,
    getExamTransitionTimer,
    readExamAutoStart,
    writeExamAutoStart,
    type ExamAutoStart,
} from "../exam-timer";
import {
    applyWaitingOrder,
    getPositionedIds,
    getWaitingIds,
    interleaveExamBreaks,
    reconcileExamOrder,
} from "../exam-queue-order";
import { ExamRegistrationAssign } from "./exam-registration-assign";
import { ExamRegistrationTransfer } from "./exam-registration-transfer";
import { examGradingApi, gradingKey, getGradingError, type RegistryItem } from "@/lib/exam-grading";
import { useExamLive } from "../use-exam-live";
import { ExamResultDialog, ExamResultsRegistry, ExamScore, ExamScoreStatus } from "./exam-results";
import { ExamAssessment, ExamAssessmentNotification } from "./exam-assessment";
import { ExamPresentation } from "./exam-presentation";
import { ExamRemovalDialog, examRemovalLabel } from "./exam-removal-dialog";

function ConfirmExamAction({
    label,
    icon,
    pending,
    disabled,
    description,
    confirmLabel,
    onConfirm,
}: {
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
                <Button
                    variant="outline"
                    size="hug36"
                    icon={icon}
                    loading={pending}
                    disabled={disabled}
                    className="max-w-full whitespace-normal text-left"
                >
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
                        <Button variant="outline" size="hug36">
                            Отмена
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            variant="blue"
                            size="hug36"
                            disabled={disabled || pending}
                            onClick={() => void onConfirm()}
                        >
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
            <Tooltip.Trigger
                aria-label="Участники команды"
                className="flex cursor-pointer items-center"
            >
                {names.slice(0, 3).map((name, index) => (
                    <span
                        key={index}
                        className="flex size-7 items-center justify-center rounded-full border-2 border-app-surface bg-gray-200 dark:bg-app-border text-[10px] font-semibold text-gray-700 dark:text-slate-200"
                        style={{ marginLeft: index > 0 ? -8 : 0 }}
                    >
                        {name
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                    </span>
                ))}
                {names.length > 3 && (
                    <span className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-app-surface bg-gray-100 dark:bg-app-ghost text-[10px] text-gray-600 dark:text-app-muted">
                        +{names.length - 3}
                    </span>
                )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Positioner
                    positionMethod="fixed"
                    sideOffset={8}
                    collisionPadding={8}
                    className="z-[500]"
                >
                    <Tooltip.Popup className="max-h-[var(--available-height)] w-[220px] max-w-[var(--available-width)] overflow-auto break-words rounded-xl border border-gray-200 dark:border-app-border bg-app-surface p-3 text-[12px] leading-5 text-gray-700 dark:text-slate-200 shadow-lg">
                        {names.map((name, index) => (
                            <div key={index}>{name}</div>
                        ))}
                    </Tooltip.Popup>
                </Tooltip.Positioner>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

export function ExamDetail({ organizerOnly = false }: { organizerOnly?: boolean } = {}) {
    const [params] = useSearchParams();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const examId = Number(params.get("examId") || 0);
    if (
        !Number.isSafeInteger(workspaceId) ||
        workspaceId <= 0 ||
        !Number.isSafeInteger(examId) ||
        examId <= 0
    ) {
        return <Navigate to={paths.app.exams.getHref()} replace />;
    }
    return (
        <ExamDetailView
            organizerOnly={organizerOnly}
            key={`${workspaceId}:${examId}`}
            workspaceId={workspaceId}
            examId={examId}
        />
    );
}

function queueDropKey(row: QueueItem | ExamSlot) {
    return "registration_id" in row ? `team-${row.registration_id}` : `slot-${row.id}`;
}

function ExamBreakRow({
    slot,
    examStart,
    editing,
}: {
    slot: ExamSlot;
    examStart: string;
    editing: boolean;
}) {
    return (
        <tr
            data-queue-row={queueDropKey(slot)}
            className="border-b border-gray-100 bg-[#F5F6F8] text-app-muted last:border-0 dark:border-app-border dark:bg-app-ghost"
        >
            {editing && <td />}
            <td className="px-6 py-4 text-[13px]">—</td>
            <th scope="row" className="px-6 py-4 text-[13px] font-medium">
                Перерыв
            </th>
            <td className="px-6 py-4">—</td>
            <td className="px-6 py-4">—</td>
            <td className="whitespace-nowrap px-6 py-4 text-[13px] text-app-text">
                <time dateTime={slot.starts_at}>
                    {formatScheduleTime(slot.starts_at, examStart)}
                </time>
                {" – "}
                <time dateTime={slot.ends_at}>{formatScheduleTime(slot.ends_at, examStart)}</time>
            </td>
            <td />
        </tr>
    );
}

function ExamDetailView({
    workspaceId,
    examId,
    organizerOnly,
}: {
    workspaceId: number;
    examId: number;
    organizerOnly: boolean;
}) {
    const navigate = useNavigate();
    const { hash } = useLocation();
    const access = useExamWorkspaces(workspaceId, true, true);
    const canOpen = !organizerOnly || access.canManage;
    const examQuery = useExam(workspaceId, canOpen ? examId : 0);
    const queueEnabled = canOpen && !!examQuery.data && !isExamAccessDenied(examQuery.error);
    const live = useExamLive(workspaceId, examId, queueEnabled);
    const queueQuery = useExamQueue(workspaceId, examId, queueEnabled, live);
    const [resultItem, setResultItem] = useState<RegistryItem | null>(null);
    const resultAccess =
        queueEnabled && access.canManageResults && !isExamAccessDenied(queueQuery.error);
    const results = useQuery({
        queryKey: [...gradingKey(workspaceId, examId), "registry"],
        queryFn: () => examGradingApi.registry(workspaceId, examId),
        enabled: resultAccess,
        refetchInterval: resultAccess ? 10_000 : false,
    });
    const resultsByAttempt = useMemo(
        () =>
            new Map(
                resultAccess && results.isSuccess
                    ? results.data.map((item) => [item.attempt_id, item])
                    : [],
            ),
        [resultAccess, results.isSuccess, results.data],
    );
    const queryClient = useQueryClient();
    const now = useExamClock();
    const dataAvailable =
        canOpen &&
        !!examQuery.data &&
        !isExamAccessDenied(examQuery.error) &&
        !isExamAccessDenied(queueQuery.error);
    const myProjects = useRecentProjectsList();
    const myProjectIds = new Set(
        myProjects.isSuccess ? myProjects.data.items.map((project) => project.id) : [],
    );
    const projectsQuery = useProjectsList(dataAvailable ? String(workspaceId) : "", {
        page: 1,
        limit: 100,
    });
    const projectTypesQuery = useProjectTypes(workspaceId, dataAvailable);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "waiting" | "no_show">("all");
    const [editingRequested, setEditing] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);
    const [draggedTeam, setDraggedTeam] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const autoStartKey = `exam-auto-start:${workspaceId}:${examId}`;
    const [autoStart, setAutoStart] = useState(() => readExamAutoStart(autoStartKey));
    const saveAutoStart = useCallback(
        (plan: ExamAutoStart | null) => {
            writeExamAutoStart(autoStartKey, plan);
            setAutoStart(plan);
        },
        [autoStartKey],
    );
    const queueHeading = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        if (hash !== "#presentation-queue" || !dataAvailable) return;
        queueHeading.current?.focus({ preventScroll: true });
        queueHeading.current?.scrollIntoView({ block: "start" });
    }, [hash, dataAvailable]);
    const queueBody = useRef<HTMLTableSectionElement>(null);
    const previousRowOffsets = useRef(new Map<string, number>());
    const mutationLock = useRef(false);
    const [attemptPending, setAttemptPending] = useState(false);
    const [registrationPending, setRegistrationPending] = useState(false);
    const [postpone, setPostpone] = useState<{ item: QueueItem; title: string } | null>(null);
    const [postponeReason, setPostponeReason] = useState("");
    const [assignOpen, setAssignOpen] = useState(false);
    const [removalOpen, setRemovalOpen] = useState(false);
    const [transfer, setTransfer] = useState<{ registration: Registration; self: boolean } | null>(
        null,
    );
    const [deleteRow, setDeleteRow] = useState<{ id: number; title: string } | null>(null);

    const exam = isExamAccessDenied(examQuery.error) ? undefined : examQuery.data;
    const isManager = canOpen && access.canManage && !isExamAccessDenied(queueQuery.error);
    const editing = isManager && editingRequested;
    const registrations = useExamRegistrations(
        workspaceId,
        examId,
        false,
        isManager && exam?.status === "published",
    );
    const registrationsById = new Map(
        (isExamAccessDenied(registrations.error) ? undefined : registrations.data?.items)?.map(
            (item) => [item.id, item],
        ),
    );
    const showBooking =
        canOpen &&
        access.canSelfRegister &&
        !isExamAccessDenied(queueQuery.error) &&
        exam?.status === "published";
    const serverNow = getQueueTime(queueQuery.data, now, queueQuery.dataUpdatedAt);
    const booking = useExamSlotBooking(
        workspaceId,
        examId,
        exam,
        serverNow,
        showBooking,
        queueQuery.data,
    );
    const bookingAction = booking.action;
    const freeSlotCount = booking.available.filter((slot) => slot.is_available).length;

    const queueItems = useMemo(
        () => (isExamAccessDenied(queueQuery.error) ? [] : (queueQuery.data?.items ?? [])),
        [queueQuery.data, queueQuery.error],
    );
    const hasStarted = hasExamStarted(exam, queueQuery.data);
    const showSchedule = Boolean(
        queueQuery.data &&
        exam &&
        shouldShowExamSchedule(exam.configuration.starts_at, serverNow, hasStarted),
    );
    const slotsQuery = useExamSlots(workspaceId, examId, dataAvailable);
    const etaByRegistration = useMemo(
        () => new Map(queueQuery.data?.eta.items.map((item) => [item.registration_id, item])),
        [queueQuery.data?.eta.items],
    );
    const etaMessage = showSchedule ? beforeStartEtaMessage : liveEtaMessage;
    const queueBySlot = useMemo(
        () =>
            new Map(
                queueItems.flatMap((item) =>
                    item.slot_id === null ? [] : [[item.slot_id, item] as const],
                ),
            ),
        [queueItems],
    );
    const [orderedIds, setOrderedIds] = useState<number[] | null>(null);
    const orderStorageKey = `exam-presentation-order:${workspaceId}:${examId}`;
    const [savedOrder, setSavedOrder] = useState<number[]>(() => {
        try {
            const value: unknown = JSON.parse(sessionStorage.getItem(orderStorageKey) ?? "[]");
            return Array.isArray(value)
                ? [...new Set(value.filter((id): id is number => Number.isSafeInteger(id)))]
                : [];
        } catch {
            return [];
        }
    });
    const stableIds = useMemo(
        () => reconcileExamOrder(savedOrder, queueItems),
        [savedOrder, queueItems],
    );
    useEffect(() => {
        if (!queueQuery.data) return;
        if (
            savedOrder.length === stableIds.length &&
            savedOrder.every((id, index) => id === stableIds[index])
        )
            return;
        setSavedOrder(stableIds);
        try {
            sessionStorage.setItem(orderStorageKey, JSON.stringify(stableIds));
        } catch {
            // Keep the order in memory if storage is unavailable.
        }
    }, [orderStorageKey, queueQuery.data, savedOrder, stableIds]);

    const waitingIds = useMemo(() => getWaitingIds(queueItems), [queueItems]);
    const waitingSet = useMemo(() => new Set(waitingIds), [waitingIds]);
    const draftIsCurrent =
        orderedIds?.length === waitingIds.length && orderedIds.every((id) => waitingSet.has(id));
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
            if (filter === "waiting")
                return (
                    (item.state === "waiting" ||
                        (item.state === "postponed" && item.position !== null)) &&
                    matchesSearch
                );
            return matchesSearch;
        })();
        return matchesFilter ? [item] : [];
    });

    const visibleTeams = new Set(rows.map((item) => item.registration_id));
    const slots = isExamAccessDenied(slotsQuery.error) ? [] : (slotsQuery.data?.items ?? []);
    const scheduledSlots = showSchedule
        ? [...slots].sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
        : [];
    const orderedTeams = visibleIds.flatMap((id) => {
        const item = queueByRegistration.get(id);
        return item ? [item] : [];
    });
    // Empty slots keep their places in the schedule while team rows follow the queue.
    let teamIndex = 0;
    const scheduleRows = scheduledSlots.map((slot) =>
        slot.kind !== "break" && queueBySlot.has(slot.id)
            ? (orderedTeams[teamIndex++] ?? slot)
            : slot,
    );
    const allTableRows = showSchedule
        ? [...scheduleRows, ...orderedTeams.slice(teamIndex)]
        : interleaveExamBreaks(orderedTeams, slots, etaByRegistration);
    let defenseNumber = 0;
    const tableRows = allTableRows
        .map((row) => ({
            row,
            number: "kind" in row && row.kind === "break" ? "—" : ++defenseNumber,
        }))
        .filter(({ row }) => !("registration_id" in row) || visibleTeams.has(row.registration_id));
    const hasDefenseRows = tableRows.some(
        ({ row }) => "registration_id" in row || row.kind !== "break",
    );
    const bookingRows = booking.inMode && booking.available.length > 0 ? slots : null;
    let bookingDefenseNumber = 0;

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
                    [
                        { transform: `translateY(${previous - offset}px)` },
                        { transform: "translateY(0)" },
                    ],
                    { duration: 180, easing: "ease-out" },
                );
            }
        }
        previousRowOffsets.current = offsets;
    });

    const workspace = access.spaces.find((item) => item.id === workspaceId);
    const currentTeam = queueItems.find((item) => item.state === "running");
    const activeAttempt = currentTeam?.attempt;
    const status = exam
        ? getExamStatus(exam, queueQuery.data, now, queueQuery.dataUpdatedAt)
        : "draft";
    const examOver = Boolean(exam?.archived_at) || isExamOver(status);
    const canRemove = access.canRemove && !exam?.archived_at;
    const followingTeam = queueItems.find(
        (item) => item.position === 1 && (item.state === "waiting" || item.state === "postponed"),
    );
    const remainingTeams = queueItems.filter(
        (item) => item.state === "waiting" || item.state === "postponed",
    );
    const canStartDefense =
        isManager &&
        !queueQuery.isError &&
        exam?.status === "published" &&
        !examOver &&
        !currentTeam &&
        Boolean(followingTeam);
    const canStartExam = isManager && exam?.status === "published" && !examOver && !hasStarted;
    const startExam = async () => {
        if (!canStartExam || mutationLock.current) return;
        mutationLock.current = true;
        setAttemptPending(true);
        try {
            const started = await examApi.start(workspaceId, examId);
            queryClient.setQueryData(queryKeys.exams.detail(workspaceId, examId), started);
            toast.success("Экзамен начался");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось начать экзамен");
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            mutationLock.current = false;
            setAttemptPending(false);
        }
    };
    const presentedTeam =
        currentTeam ?? (exam?.status === "published" && !examOver ? followingTeam : undefined);
    const transition =
        !currentTeam && presentedTeam && exam
            ? getExamTransitionTimer(
                  queueItems,
                  autoStart?.transitionMinutes ?? exam.configuration.transition_minutes,
                  serverNow,
              )
            : null;
    const canPlay =
        canStartDefense && hasStarted && !editing && (!autoStart || Boolean(transition));
    const currentIndex = currentTeam ? stableIds.indexOf(currentTeam.registration_id) : -1;
    const earlierTeams =
        currentIndex > 0
            ? stableIds
                  .slice(0, currentIndex)
                  .reverse()
                  .map((id) => queueByRegistration.get(id))
            : [];
    const previousTeam = earlierTeams.find(
        (item) => item?.state === "postponed" && item.attempt?.status === "postponed",
    );
    const previousUnavailable = examOver
        ? "экзамен завершён."
        : exam?.status !== "published" || !currentTeam
          ? "нет текущего выступления."
          : currentIndex <= 0
            ? "сейчас выступает первая команда."
            : previousTeam
              ? undefined
              : earlierTeams.some((item) => item?.state === "finished")
                ? "завершённые выступления нельзя возобновить."
                : "среди предыдущих команд нет отложенных выступлений.";
    const canFinishCurrentDefense =
        isManager && Boolean(activeAttempt) && (exam?.archived_at || remainingTeams.length === 0);
    const assessmentOpen = queueItems.some((item) => isAssessmentOpen(item, serverNow));
    const canCompleteExam =
        hasStarted &&
        queueQuery.isSuccess &&
        !currentTeam &&
        remainingTeams.length === 0 &&
        !queueItems.some((item) => item.state === "running");
    const finishExamNotice = !queueQuery.isSuccess
        ? "Не удалось проверить состояние очереди."
        : !canCompleteExam
          ? "Сначала завершите текущую защиту и обработайте остальные команды в очереди."
          : assessmentOpen
            ? "Экзамен завершится. Открытые окна оценивания будут действовать до своего срока."
            : "Экзамен завершится. Утвердить итоги команд можно в ведомости.";
    const completeExam = async () => {
        if (!canCompleteExam || mutationLock.current) return;
        mutationLock.current = true;
        setAttemptPending(true);
        try {
            const completed = await examApi.complete(workspaceId, examId);
            queryClient.setQueryData(queryKeys.exams.detail(workspaceId, examId), completed);
            toast.success("Экзамен завершён");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось завершить экзамен");
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            mutationLock.current = false;
            setAttemptPending(false);
        }
    };
    const statusStyle = exam?.archived_at
        ? { ...statusMeta.finished, label: "В архиве" }
        : statusMeta[status];
    const queueSnapshot = queueQuery.data;
    const eta = queueSnapshot?.eta;
    const queueEtaStale = queueQuery.isError || queueSnapshot?.eta_stale;
    const lastEta = eta?.items.at(-1);
    const lastScheduledTeam = lastEta && queueByRegistration.get(lastEta.registration_id);
    const lastAttempt = lastScheduledTeam?.state === "postponed" ? lastScheduledTeam.attempt : null;
    const settingsVersion = exam?.current_settings_version;
    const queueSettingsVersion = queueQuery.data?.settings_version;
    const activeVersion = activeAttempt?.settings_version;
    const finalVersion = lastAttempt?.postponed_phase
        ? lastAttempt.settings_version
        : queueSettingsVersion;
    const activeRevision = useExamSettingsRevision(
        workspaceId,
        examId,
        isManager && activeVersion !== settingsVersion ? activeVersion : undefined,
    );
    const finalRevision = useExamSettingsRevision(
        workspaceId,
        examId,
        isManager && lastEta && finalVersion !== settingsVersion ? finalVersion : undefined,
    );

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

    const canReorder =
        isManager &&
        editing &&
        !examOver &&
        !savingOrder &&
        !registrationPending &&
        !attemptPending;

    function canDropOn(sourceId: number, row: QueueItem | ExamSlot) {
        if (!canReorder || !waitingSet.has(sourceId)) return false;
        return "registration_id" in row
            ? sourceId !== row.registration_id && waitingSet.has(row.registration_id)
            : showSchedule &&
                  row.kind !== "break" &&
                  queueByRegistration.get(sourceId)?.slot_id != null &&
                  !queueBySlot.has(row.id);
    }

    const moveToSlot = async (source: QueueItem, slot: ExamSlot) => {
        if (source.slot_id === null || slot.kind === "break") return;
        const oldSlotId = source.slot_id;
        const teamsAhead = allTableRows
            .slice(0, allTableRows.indexOf(slot))
            .filter(
                (row) =>
                    "registration_id" in row &&
                    row.registration_id !== source.registration_id &&
                    row.position !== null,
            );
        const position = teamsAhead.length + 1;
        let moved: Registration | undefined;
        if (mutationLock.current) return;
        mutationLock.current = true;
        setRegistrationPending(true);
        try {
            const result = await examApi.moveRegistration(
                workspaceId,
                examId,
                {
                    id: source.registration_id,
                    version: source.registration_version,
                },
                slot.id,
                {
                    targetExamId: examId,
                    reason: "Перенос команды в другой слот",
                    expectedSlot: getSlotInterval(slot),
                },
            );
            moved = result.target;
            if (source.position !== position) {
                await examApi.place(workspaceId, examId, moved.id, moved.version, position);
            }
            if (draft) {
                const ids = draft.filter((id) => id !== source.registration_id);
                ids.splice(
                    teamsAhead.filter(
                        (row) => "registration_id" in row && waitingSet.has(row.registration_id),
                    ).length,
                    0,
                    source.registration_id,
                );
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
                    message =
                        "Не удалось подтвердить перенос или вернуть исходный слот. Проверьте обновлённую очередь.";
                }
            }
            toast.error(detail ? `${message} ${detail}` : message);
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            mutationLock.current = false;
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
                if (
                    event.relatedTarget instanceof Node &&
                    event.currentTarget.contains(event.relatedTarget)
                )
                    return;
                setDropTarget((target) => (target === queueDropKey(row) ? null : target));
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
        const after =
            "registration_id" in row && ids.indexOf(draggedTeam) < ids.indexOf(row.registration_id);
        return after
            ? "[&>td]:bg-[#155DFC12] dark:[&>td]:bg-blue-400/20 [&>td]:shadow-[inset_0_-2px_#155DFC] dark:[&>td]:shadow-[inset_0_-2px_#93C5FD]"
            : "[&>td]:bg-[#155DFC12] dark:[&>td]:bg-blue-400/20 [&>td]:shadow-[inset_0_2px_#155DFC] dark:[&>td]:shadow-[inset_0_2px_#93C5FD]";
    }

    const saveOrder = async () => {
        if (!canReorder) return;
        if (orderedIds && !draft) {
            setOrderedIds(null);
            toast.error("Состав очереди изменился. Проверьте порядок и повторите перестановку.");
            return;
        }
        if (!draft || !hasOrderChanges) return;
        if (mutationLock.current) return;
        mutationLock.current = true;
        setSavingOrder(true);
        try {
            const initial = (await queueQuery.refetch({ throwOnError: true })).data;
            if (!initial || initial.queue_revision !== queueQuery.data?.queue_revision) {
                throw new Error("Queue changed before saving");
            }
            const target = applyWaitingOrder(getPositionedIds(initial.items), draft);
            let snapshot = initial;
            for (const [index, id] of target.entries()) {
                const item = snapshot.items.find((row) => row.registration_id === id);
                const position = index + 1;
                if (!item || item.position === null) throw new Error("Team left the queue");
                if (item.position === position) continue;
                const result = await examApi.place(
                    workspaceId,
                    examId,
                    id,
                    item.registration_version,
                    position,
                );
                const refreshed = (await queueQuery.refetch({ throwOnError: true })).data;
                if (
                    !refreshed ||
                    result.queue_revision !== snapshot.queue_revision + 1 ||
                    refreshed.queue_revision !== result.queue_revision
                ) {
                    throw new Error("Queue changed while saving");
                }
                snapshot = refreshed;
            }
            toast.success("Порядок выступлений сохранён");
        } catch (error) {
            toast.error(
                getExamErrorMessage(error) ??
                    "Не удалось сохранить весь порядок. Проверьте текущую очередь.",
            );
        } finally {
            await queueQuery.refetch();
            setOrderedIds(null);
            setEditing(false);
            mutationLock.current = false;
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

    const finishCurrentDefense = async () => {
        if (!isManager || !activeAttempt || attemptPending || registrationPending || savingOrder)
            return;
        if (mutationLock.current) return;
        mutationLock.current = true;
        setAttemptPending(true);
        try {
            const latest = await queueQuery.refetch({ throwOnError: true });
            const items = latest.data?.items ?? [];
            const current = items.find((item) => item.state === "running")?.attempt;
            if (current?.id !== activeAttempt.id) {
                toast.error("Текущая команда изменилась. Проверьте очередь выступлений.");
                return;
            }
            if (
                !exam?.archived_at &&
                items.some((item) => item.state === "waiting" || item.state === "postponed")
            ) {
                toast.error("Очередь изменилась. Проверьте, все ли команды выступили.");
                return;
            }
            await examApi.commandAttempt(
                workspaceId,
                examId,
                current.id,
                "finish",
                current.version,
            );
            toast.success("Выступление завершено. Оценивание открыто.");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось завершить выступление");
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            mutationLock.current = false;
            setAttemptPending(false);
        }
    };

    const updatePhase = async (action: "questions" | "resume" | "pause") => {
        if (!isManager || !activeAttempt || attemptPending || registrationPending || savingOrder)
            return;
        if (mutationLock.current) return;
        mutationLock.current = true;
        setAttemptPending(true);
        try {
            await examApi.commandAttempt(
                workspaceId,
                examId,
                activeAttempt.id,
                action,
                activeAttempt.version,
            );
        } catch (error) {
            toast.error(
                getExamErrorMessage(error) ??
                    (action === "questions"
                        ? "Не удалось перейти к вопросам"
                        : "Не удалось изменить состояние таймера"),
            );
        } finally {
            await queueQuery.refetch();
            mutationLock.current = false;
            setAttemptPending(false);
        }
    };

    const { refetch: refetchQueue } = queueQuery;
    const startDefense = useCallback(
        async (registrationId: number, plan?: ExamAutoStart) => {
            if (mutationLock.current) return;
            mutationLock.current = true;
            setAttemptPending(true);
            try {
                const queue = (await refetchQueue({ throwOnError: true })).data;
                const items = queue?.items ?? [];
                const first = items.find(
                    (item) =>
                        item.position === 1 &&
                        (item.state === "waiting" || item.state === "postponed"),
                );
                const autoState =
                    plan && queue
                        ? getExamAutoStartState(plan, queue, Date.parse(queue.server_now))
                        : undefined;
                if (plan && autoState === "waiting") return;
                if (
                    items.some((item) => item.state === "running") ||
                    first?.registration_id !== registrationId ||
                    autoState === "changed"
                ) {
                    if (plan) saveAutoStart(null);
                    toast.error(
                        "Очередь изменилась. Проверьте, какая команда выступает следующей.",
                    );
                    return;
                }
                if (first.attempt?.status === "postponed") {
                    await examApi.commandAttempt(
                        workspaceId,
                        examId,
                        first.attempt.id,
                        "restart",
                        first.attempt.version,
                        undefined,
                        plan ? queue?.queue_revision : undefined,
                    );
                } else {
                    await examApi.startAttempt(
                        workspaceId,
                        examId,
                        first.registration_id,
                        first.registration_version,
                        plan ? queue?.queue_revision : undefined,
                    );
                }
                saveAutoStart(null);
            } catch (error) {
                if (plan) saveAutoStart(null);
                toast.error(getExamErrorMessage(error) ?? "Не удалось начать выступление команды.");
            } finally {
                await invalidateExam(queryClient, workspaceId, examId);
                mutationLock.current = false;
                setAttemptPending(false);
            }
        },
        [queryClient, workspaceId, examId, refetchQueue, saveAutoStart],
    );

    useEffect(() => {
        if (
            !autoStart ||
            !isManager ||
            !exam ||
            !queueQuery.isFetchedAfterMount ||
            !queueQuery.data ||
            !queueQuery.isSuccess ||
            attemptPending ||
            registrationPending ||
            savingOrder ||
            editing
        )
            return;
        const state = getExamAutoStartState(autoStart, queueQuery.data, serverNow);
        if (!examOver && state === "waiting") return;
        if (state === "ready" && canStartDefense && hasStarted) {
            void startDefense(autoStart.registrationId, autoStart);
            return;
        }
        saveAutoStart(null);
        if (!currentTeam && !examOver) {
            toast.info("Очередь изменилась. Следующее выступление нужно запустить вручную.");
        }
    }, [
        autoStart,
        attemptPending,
        registrationPending,
        savingOrder,
        editing,
        queueQuery.data,
        serverNow,
        isManager,
        exam,
        examOver,
        hasStarted,
        queueQuery.isFetchedAfterMount,
        queueQuery.isSuccess,
        canStartDefense,
        currentTeam,
        startDefense,
        saveAutoStart,
    ]);

    const switchTeam = async (direction: "previous" | "next") => {
        const target = direction === "previous" ? previousTeam : followingTeam;
        if (
            !target ||
            !activeAttempt ||
            !isManager ||
            exam?.status !== "published" ||
            examOver ||
            attemptPending ||
            savingOrder ||
            registrationPending ||
            editing ||
            (direction === "previous" && previousUnavailable)
        )
            return;
        if (mutationLock.current) return;
        mutationLock.current = true;
        setAttemptPending(true);
        let postponedCurrent = false;
        try {
            const items = (await queueQuery.refetch({ throwOnError: true })).data?.items ?? [];
            const current = items.find((item) => item.state === "running")?.attempt;
            const destination = items.find(
                (item) => item.registration_id === target.registration_id,
            );
            const validDestination =
                direction === "next"
                    ? destination?.position === 1 &&
                      (destination.state === "waiting" || destination.state === "postponed")
                    : destination?.state === "postponed" &&
                      destination.attempt?.status === "postponed";
            if (
                current?.id !== activeAttempt.id ||
                current.version !== activeAttempt.version ||
                !destination ||
                !validDestination
            ) {
                toast.error("Очередь изменилась. Проверьте текущую и следующую команды.");
                return;
            }

            if (direction === "next") {
                const finished = await examApi.commandAttempt(
                    workspaceId,
                    examId,
                    current.id,
                    "finish",
                    current.version,
                );
                const finishedAt = Date.parse(finished.finished_at ?? "");
                const transitionMinutes = exam.configuration.transition_minutes;
                if (Number.isFinite(finishedAt)) {
                    saveAutoStart({
                        finishedAttemptId: finished.id,
                        registrationId: destination.registration_id,
                        transitionMinutes,
                        deadline: finishedAt + transitionMinutes * 60_000,
                    });
                }
            } else {
                const postponed = await examApi.commandAttempt(
                    workspaceId,
                    examId,
                    current.id,
                    "postpone",
                    current.version,
                    "Возврат к предыдущей команде",
                );
                postponedCurrent = true;
                const latest = (await queueQuery.refetch({ throwOnError: true })).data?.items ?? [];
                const deferred = latest.find(
                    (item) => item.registration_id === postponed.registration_id,
                );
                const previous = latest.find(
                    (item) => item.registration_id === destination.registration_id,
                );
                if (
                    latest.some((item) => item.state === "running") ||
                    deferred?.state !== "postponed" ||
                    previous?.state !== "postponed"
                ) {
                    toast.error(
                        "Текущее выступление отложено. Проверьте очередь перед вызовом команды.",
                    );
                    return;
                }
                await examApi.place(
                    workspaceId,
                    examId,
                    deferred.registration_id,
                    deferred.registration_version,
                    1,
                );
                await examApi.place(
                    workspaceId,
                    examId,
                    previous.registration_id,
                    previous.registration_version,
                    1,
                );
            }
        } catch (error) {
            const message = getExamErrorMessage(error) ?? "Не удалось переключить команду.";
            toast.error(postponedCurrent ? `Текущее выступление отложено. ${message}` : message);
        } finally {
            await invalidateExam(queryClient, workspaceId, examId);
            mutationLock.current = false;
            setAttemptPending(false);
        }
    };

    const postponeTeam = async () => {
        if (
            !isManager ||
            !postpone ||
            !postponeReason.trim() ||
            registrationPending ||
            attemptPending ||
            savingOrder
        )
            return;
        const item = queueByRegistration.get(postpone.item.registration_id);
        if (
            !item ||
            item.state !== postpone.item.state ||
            (item.state !== "waiting" && item.state !== "running")
        ) {
            toast.error("Состояние команды изменилось. Проверьте очередь.");
            return;
        }
        if (mutationLock.current) return;
        mutationLock.current = true;
        setRegistrationPending(true);
        try {
            if (item.state === "running" && item.attempt) {
                await examApi.commandAttempt(
                    workspaceId,
                    examId,
                    item.attempt.id,
                    "postpone",
                    item.attempt.version,
                    postponeReason.trim(),
                );
            } else {
                await examApi.postponeRegistration(
                    workspaceId,
                    examId,
                    item.registration_id,
                    item.registration_version,
                    postponeReason.trim(),
                );
            }
            toast.success("Выступление отложено");
            setPostpone(null);
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось отложить выступление");
        } finally {
            await queueQuery.refetch();
            mutationLock.current = false;
            setRegistrationPending(false);
        }
    };

    const returnTeam = async (item: QueueItem, first: boolean) => {
        if (!isManager || registrationPending || attemptPending || savingOrder) return;
        if (mutationLock.current) return;
        mutationLock.current = true;
        setRegistrationPending(true);
        try {
            await examApi.place(
                workspaceId,
                examId,
                item.registration_id,
                item.registration_version,
                first ? 1 : undefined,
            );
            toast.success(
                first ? "Команда будет выступать следующей" : "Команда возвращена в очередь",
            );
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось изменить порядок выступлений");
        } finally {
            await queueQuery.refetch();
            mutationLock.current = false;
            setRegistrationPending(false);
        }
    };

    const setNoShow = async (item: QueueItem) => {
        if (!isManager || registrationPending || savingOrder || attemptPending) return;
        const restore = item.state === "no_show";
        if (mutationLock.current) return;
        mutationLock.current = true;
        setRegistrationPending(true);
        try {
            if (restore) {
                await examApi.place(
                    workspaceId,
                    examId,
                    item.registration_id,
                    item.registration_version,
                );
            } else {
                await examApi.noShow(
                    workspaceId,
                    examId,
                    item.registration_id,
                    item.registration_version,
                    "Неявка",
                );
            }
            toast.success(restore ? "Команда возвращена в очередь" : "Неявка отмечена");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось изменить явку команды");
        } finally {
            await queueQuery.refetch();
            mutationLock.current = false;
            setRegistrationPending(false);
        }
    };

    const deleteRegistration = async () => {
        if (!isManager || !deleteRow || registrationPending || savingOrder || attemptPending)
            return;
        const item = queueByRegistration.get(deleteRow.id);
        if (!item || !canChangeExamRegistration(item)) return;
        if (mutationLock.current) return;
        mutationLock.current = true;
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
            mutationLock.current = false;
            setRegistrationPending(false);
        }
    };

    if (organizerOnly && !access.isLoading && !canOpen) {
        return <Navigate to={paths.app.examView.getHref(workspaceId, examId)} replace />;
    }

    if (examQuery.isLoading || (organizerOnly && access.isLoading)) {
        return (
            <ContentLayout title="Экзамен">
                <div className="flex h-64 items-center justify-center">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

    if (!exam || isExamAccessDenied(examQuery.error) || isExamAccessDenied(queueQuery.error)) {
        return (
            <ContentLayout title="Экзамен">
                <ExamErrorState
                    message={
                        isExamAccessDenied(examQuery.error) || isExamAccessDenied(queueQuery.error)
                            ? "Экзамен недоступен."
                            : "Не удалось загрузить экзамен."
                    }
                    retry={
                        examQuery.isError && !isExamAccessDenied(examQuery.error)
                            ? () => void examQuery.refetch()
                            : undefined
                    }
                    pending={examQuery.isFetching}
                />
                <Link
                    className="block text-center text-app-blue dark:text-blue-300"
                    to={paths.app.exams.getHref(workspaceId)}
                >
                    К списку экзаменов
                </Link>
            </ContentLayout>
        );
    }

    const activeTiming =
        activeAttempt?.settings_version === settingsVersion
            ? exam.configuration
            : activeRevision.data?.configuration;
    const timer =
        transition ??
        getExamTimer(
            activeAttempt,
            activeTiming ?? exam.configuration,
            getExamQueueReceivedAt(queueSnapshot, queueQuery.dataUpdatedAt),
            now,
        );
    const currentEndsAt =
        queueSnapshot && eta?.current && activeTiming
            ? serverNow +
              (eta.current.overdue_seconds > 0
                  ? 0
                  : Math.max(
                        0,
                        eta.current.slot_remaining_seconds -
                            activeTiming.transition_minutes * 60 -
                            (eta.current.paused
                                ? 0
                                : (serverNow - Date.parse(queueSnapshot.server_now)) / 1000),
                    )) *
                  1000
            : undefined;
    const finalTiming =
        finalVersion === settingsVersion ? exam.configuration : finalRevision.data?.configuration;
    const queueEndsAt = lastEta
        ? finalTiming &&
          Date.parse(lastEta.eta_at) +
              (finalTiming.questions_minutes +
                  (lastAttempt?.postponed_phase === "questions"
                      ? 0
                      : finalTiming.presentation_minutes)) *
                  60_000
        : currentEndsAt;
    const etaLowerBound =
        lastEta?.certainty === "lower_bound" ||
        Boolean(eta?.current?.overdue_seconds || eta?.current?.paused);
    const etaStale = queueEtaStale || activeRevision.isError || finalRevision.isError;
    const scheduledEnd = Math.max(
        0,
        ...(slotsQuery.data?.items ?? []).map((slot) => Date.parse(slot.ends_at)),
    );
    const actualEnd =
        status === "finished"
            ? Math.max(
                  0,
                  ...queueItems.map((item) => Date.parse(item.attempt?.finished_at ?? "") || 0),
              )
            : 0;
    const actualStart = Math.min(
        Infinity,
        ...queueItems.map(
            (item) => Date.parse(item.started_at ?? item.attempt?.started_at ?? "") || Infinity,
        ),
    );
    const defenseStart =
        (actualEnd || !scheduledEnd) && Number.isFinite(actualStart)
            ? new Date(actualStart).toISOString()
            : exam.configuration.starts_at;
    const defenseEnd = actualEnd || scheduledEnd || queueEndsAt;

    return (
        <ContentLayout title={exam.configuration.title}>
            <div className="mx-auto max-w-7xl p-4 sm:p-8 flex flex-col gap-8">
                <Breadcrumb className="min-h-[34px] flex flex-wrap gap-y-1.5 items-center">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app" className="text-[16px] font-medium text-app-muted">
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link
                                    to="/app/exams"
                                    className="text-[16px] font-medium text-app-muted"
                                >
                                    Экзамены
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage
                                title={exam.configuration.title}
                                className="block max-w-[min(65vw,30rem)] truncate text-[16px] font-medium"
                            >
                                {exam.configuration.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-5">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#4338CA] text-white">
                            <Icon name="exam" size={32} />
                        </div>
                        <div className="min-w-0 [overflow-wrap:anywhere]">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1
                                    title={exam.configuration.title}
                                    className="line-clamp-3 text-[26px] font-bold leading-[1.2] text-app-text sm:line-clamp-none sm:text-[40px]"
                                >
                                    {exam.configuration.title}
                                </h1>
                                <span
                                    className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium ${statusStyle.className}`}
                                >
                                    {statusStyle.label}
                                </span>
                                {exam.status === "published" && (
                                    <span className="inline-flex h-6 items-center rounded-full bg-app-badge-blue px-2.5 text-[12px] font-medium text-app-blue dark:text-blue-300">
                                        {formatExamDate(exam.configuration.starts_at)}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-base font-medium leading-7 text-app-muted">
                                Экзамен для студентов дисциплины «
                                {workspace?.title ?? "Управление проектами"}»
                            </p>
                            {(isManager || showBooking) && exam.status === "published" && (
                                <p className="text-[13px] text-app-muted">
                                    Период защиты {formatExamDate(defenseStart)}
                                    {defenseEnd
                                        ? ` — ${formatExamDate(new Date(defenseEnd).toISOString())}`
                                        : " · время окончания пока неизвестно"}
                                    {actualEnd
                                        ? " (последняя защита завершилась)"
                                        : scheduledEnd
                                          ? " (по расписанию)"
                                          : defenseEnd
                                            ? " (прогноз)"
                                            : ""}
                                </p>
                            )}
                            <p className="text-[13px] text-app-muted">
                                {workspace?.title ?? `Пространство ${workspaceId}`} · Создан:{" "}
                                {formatCreatedDate(exam.created_at)}
                            </p>
                        </div>
                    </div>

                    {(!examOver || canRemove) && (
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            {canStartExam && (
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    icon={<Play size={16} />}
                                    disabled={
                                        editing ||
                                        savingOrder ||
                                        registrationPending ||
                                        attemptPending
                                    }
                                    onClick={() => void startExam()}
                                >
                                    Начать экзамен
                                </Button>
                            )}
                            {isManager &&
                                exam.status === "published" &&
                                hasStarted &&
                                !examOver && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="hug36"
                                                icon={<Square size={16} />}
                                            >
                                                Завершить экзамен
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="grid w-[calc(100%-2rem)] max-w-[440px] gap-4">
                                            <DialogHeader>
                                                <DialogTitle>Завершить экзамен</DialogTitle>
                                            </DialogHeader>
                                            <p className="text-sm text-app-muted">
                                                {finishExamNotice}
                                            </p>
                                            <div className="flex justify-end">
                                                <DialogClose asChild>
                                                    <Button variant="outline" size="hug36">
                                                        Закрыть
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    size="hug36"
                                                    disabled={!canCompleteExam || attemptPending}
                                                    onClick={() => void completeExam()}
                                                >
                                                    Подтвердить завершение
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            {!examOver && exam.configuration.connection_url && (
                                <Button
                                    variant="dark"
                                    size="hug36"
                                    icon={<LinkIcon size={16} />}
                                    onClick={() =>
                                        window.open(
                                            String(exam.configuration.connection_url),
                                            "_blank",
                                            "noopener,noreferrer",
                                        )
                                    }
                                >
                                    Подключиться
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Действия с экзаменом"
                                        className="h-9 w-9 cursor-pointer rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-app-ghost"
                                    >
                                        <Ellipsis size={18} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent align="end" className="w-[220px]">
                                        <DropdownMenuItem className="gap-3" onSelect={share}>
                                            <Share2 size={16} />
                                            Поделиться
                                        </DropdownMenuItem>
                                        {isManager && !examOver && (
                                            <>
                                                <DropdownMenuItem
                                                    className="gap-3"
                                                    onSelect={() =>
                                                        navigate(
                                                            paths.app.examEdit.getHref(
                                                                workspaceId,
                                                                examId,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Pencil size={16} />
                                                    Редактировать экзамен
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {canRemove && (
                                            <DropdownMenuItem
                                                className="gap-3"
                                                onSelect={() => setRemovalOpen(true)}
                                            >
                                                <Trash2 size={16} />
                                                {examRemovalLabel(exam)}
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {canRemove && removalOpen && (
                    <ExamRemovalDialog
                        exam={exam}
                        onClose={() => setRemovalOpen(false)}
                        onRemoved={() =>
                            navigate(paths.app.examManage.getHref(workspaceId), { replace: true })
                        }
                    />
                )}

                <section>
                    <h2 className="text-[20px] font-bold text-app-text">Описание экзамена</h2>
                    <p className="mt-2.5 text-[17px] leading-7 text-app-muted">
                        <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {exam.configuration.description || "Описание не указано"}
                        </span>
                    </p>
                </section>

                {queueItems.map((item) => {
                    const closesAt = item.attempt?.assessment_window?.closes_at;
                    return item.attempt && closesAt && isAssessmentOpen(item, serverNow) ? (
                        <ExamAssessmentNotification
                            key={item.attempt.id}
                            workspaceId={workspaceId}
                            examId={examId}
                            attemptId={item.attempt.id}
                            closesAt={closesAt}
                            serverNow={serverNow}
                        />
                    ) : null;
                })}

                <ExamPresentation
                    team={presentedTeam}
                    project={presentedTeam && projectById.get(presentedTeam.project_id)}
                    number={presentedTeam ? numbers.get(presentedTeam.registration_id) : undefined}
                    attempt={activeAttempt}
                    timer={timer}
                    canManage={isManager && !exam.archived_at}
                    pending={attemptPending || registrationPending || savingOrder}
                    previousUnavailable={
                        editing ? "завершите редактирование очереди." : previousUnavailable
                    }
                    canGoForward={
                        exam.status === "published" &&
                        !examOver &&
                        !editing &&
                        Boolean(activeAttempt && followingTeam)
                    }
                    canStart={canPlay}
                    inTransition={transition !== null}
                    autoStarting={Boolean(autoStart) && !activeAttempt}
                    idleLabel={
                        examOver
                            ? statusStyle.label
                            : !presentedTeam && assessmentOpen
                              ? "Идёт оценивание"
                              : undefined
                    }
                    onToggle={() => {
                        if (activeAttempt)
                            void updatePhase(activeAttempt.paused_at ? "resume" : "pause");
                        else if (
                            canPlay &&
                            followingTeam &&
                            !attemptPending &&
                            !registrationPending &&
                            !savingOrder
                        ) {
                            void startDefense(followingTeam.registration_id);
                        }
                    }}
                    onQuestions={() => void updatePhase("questions")}
                    timerSettingsHref={
                        isManager && !exam.archived_at
                            ? `${paths.app.examEdit.getHref(workspaceId, examId)}&section=queue`
                            : undefined
                    }
                    onPrevious={() => void switchTeam("previous")}
                    onNext={() => void switchTeam("next")}
                    finishLastDefenseAction={
                        canFinishCurrentDefense && activeAttempt ? (
                            <ConfirmExamAction
                                key={activeAttempt.id}
                                label={
                                    exam.archived_at
                                        ? "Завершить текущее выступление"
                                        : "Завершить выступление последней команды"
                                }
                                confirmLabel="Завершить выступление"
                                description="Откроется окно оценивания. Итоги будут доступны для утверждения после закрытия окна."
                                icon={<Square size={16} />}
                                pending={attemptPending}
                                disabled={savingOrder || registrationPending}
                                onConfirm={finishCurrentDefense}
                            />
                        ) : undefined
                    }
                />

                {exam.configuration.project_type_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {exam.configuration.project_type_ids.map((typeId) => {
                            const projectType = projectTypesQuery.data?.find(
                                (item) => item.id === typeId,
                            );
                            return (
                                <span
                                    key={typeId}
                                    className="inline-flex h-7 items-center rounded-[8px] bg-gray-100 dark:bg-app-ghost px-2.5 text-[12px] font-medium text-gray-900 dark:text-app-text"
                                >
                                    {projectType?.name ?? `Тип проекта ${typeId}`}
                                </span>
                            );
                        })}
                    </div>
                )}

                <section>
                    <div className="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <h2
                            id="presentation-queue"
                            ref={queueHeading}
                            tabIndex={-1}
                            className="scroll-mt-6 text-[20px] font-bold text-app-text"
                        >
                            Порядок выступлений
                        </h2>
                        {booking.inMode ? (
                            <Button
                                variant="outline"
                                size="hug36"
                                disabled={booking.pending}
                                onClick={() => booking.setSelecting(false)}
                            >
                                Выйти из режима записи
                            </Button>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                {isManager && exam.status === "published" && !examOver && (
                                    <Button
                                        variant="outline"
                                        size="hug36"
                                        disabled={
                                            attemptPending || registrationPending || savingOrder
                                        }
                                        onClick={() => setAssignOpen(true)}
                                    >
                                        Назначить команду
                                    </Button>
                                )}
                                {booking.canBook && (
                                    <Button
                                        variant="dark"
                                        size="hug36"
                                        onClick={() => booking.setSelecting(true)}
                                    >
                                        Записаться на защиту
                                    </Button>
                                )}
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Поиск команд"
                                    aria-label="Поиск команд"
                                    className="h-10 w-[240px] rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface px-3 text-[14px] outline-none placeholder:text-app-muted focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <div className="relative inline-flex">
                                    <select
                                        aria-label="Статус команды"
                                        value={filter}
                                        onChange={(event) =>
                                            setFilter(
                                                event.target.value as "all" | "waiting" | "no_show",
                                            )
                                        }
                                        className="h-10 appearance-none rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface pl-3 pr-9 text-[13px]"
                                    >
                                        <option value="all">Все команды</option>
                                        <option value="waiting">В очереди</option>
                                        <option value="no_show">Неявка</option>
                                    </select>
                                    <ChevronDown
                                        aria-hidden="true"
                                        size={16}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-app-muted"
                                    />
                                </div>
                                {editing && !examOver ? (
                                    <>
                                        <Button
                                            variant="dark"
                                            size="hug36"
                                            onClick={saveOrder}
                                            loading={savingOrder}
                                            disabled={
                                                !hasOrderChanges ||
                                                registrationPending ||
                                                attemptPending
                                            }
                                        >
                                            Сохранить изменения
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="hug36"
                                            disabled={savingOrder}
                                            onClick={() => {
                                                setOrderedIds(null);
                                                setEditing(false);
                                            }}
                                        >
                                            {hasOrderChanges ? "Отменить изменения" : "Готово"}
                                        </Button>
                                    </>
                                ) : isManager && !examOver ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                type="button"
                                                aria-label="Действия над списком"
                                                className="h-10 w-10 cursor-pointer rounded-[12px] border border-gray-200 dark:border-app-border p-2 hover:bg-gray-50 dark:hover:bg-app-ghost"
                                            >
                                                <Ellipsis size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuContent align="end" className="w-[220px]">
                                                <DropdownMenuItem
                                                    className="gap-3"
                                                    disabled={attemptPending}
                                                    onSelect={() => setEditing(true)}
                                                >
                                                    <Pencil size={16} />
                                                    Редактировать
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenu>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {showSchedule &&
                        scheduledSlots.some((slot) => slot.kind !== "break") &&
                        exam.status === "published" && (
                            <p className="mb-4 text-sm text-app-muted">
                                К плановому времени начала пустые слоты автоматически исчезнут из
                                таблицы. Время записи команд сохранится.
                            </p>
                        )}

                    {showBooking && (
                        <div className="mb-4 space-y-3 text-sm text-app-muted" aria-live="polite">
                            <p>{formatExamRegistrationWindow(exam)}</p>
                            {booking.active.map((registration) => {
                                const slot = booking.available.find(
                                    (item) => item.id === registration.slot_id,
                                );
                                const plannedStart = queueByRegistration.get(
                                    registration.id,
                                )?.planned_start_at;
                                const time = plannedStart ?? slot?.starts_at;
                                const eta = etaByRegistration.get(registration.id);
                                return (
                                    <div
                                        key={registration.id}
                                        className="flex flex-wrap items-center gap-3"
                                    >
                                        {time ? (
                                            <Tooltip.Provider delay={100}>
                                                <span>
                                                    Вы записаны на слот в{" "}
                                                    <ApproximateDefenseTime
                                                        value={time}
                                                        examStart={exam.configuration.starts_at}
                                                    />
                                                </span>
                                            </Tooltip.Provider>
                                        ) : (
                                            <span>Вы записаны на защиту</span>
                                        )}
                                        {eta && (
                                            <span>
                                                Прогноз начала:{" "}
                                                {queueEtaStale && "прошлый снимок, "}
                                                {eta.certainty === "lower_bound" && "не раньше "}
                                                <ApproximateDefenseTime
                                                    value={eta.eta_at}
                                                    examStart={exam.configuration.starts_at}
                                                    message={etaMessage}
                                                />
                                            </span>
                                        )}
                                        {booking.canCancel(registration) ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="hug36"
                                                    disabled={booking.pending}
                                                    onClick={() =>
                                                        setTransfer({ registration, self: true })
                                                    }
                                                >
                                                    Перенести запись
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="hug36"
                                                    disabled={booking.pending}
                                                    onClick={() =>
                                                        booking.selectCancellation(registration)
                                                    }
                                                >
                                                    Отменить запись
                                                </Button>
                                            </>
                                        ) : examOver ? (
                                            <span>Экзамен завершён. Запись закрыта.</span>
                                        ) : hasStarted ? (
                                            <span>
                                                Экзамен уже идёт. Изменить запись может организатор.
                                            </span>
                                        ) : !booking.isOpen ? (
                                            <span>
                                                Отменить запись можно до закрытия записи на экзамен.
                                            </span>
                                        ) : !booking.loading && !booking.error ? (
                                            <span>Для этого проекта отмена записи недоступна.</span>
                                        ) : null}
                                    </div>
                                );
                            })}
                            {booking.error ? (
                                <p>
                                    Не удалось загрузить данные для записи на защиту. Попробуйте
                                    обновить страницу.
                                </p>
                            ) : booking.loading ? (
                                <p>Проверяем возможность записи…</p>
                            ) : !booking.active.length && !booking.isOpen ? (
                                <p>Запись сейчас недоступна.</p>
                            ) : !booking.bookableProjects.length && booking.hasOtherBooking ? (
                                <p>
                                    Запись недоступна. Ваш проект уже записан на другой экзамен или
                                    его защита уже началась.
                                </p>
                            ) : !booking.active.length && !booking.eligible.length ? (
                                <p>
                                    У вас нет своего проекта подходящего типа в этом пространстве.
                                </p>
                            ) : null}
                            {booking.canBook && booking.available.length > 0 && (
                                <p>
                                    Свободно {freeSlotCount} слотов из {booking.available.length}
                                </p>
                            )}
                            {booking.canBook &&
                                booking.available.length > 0 &&
                                freeSlotCount === 0 && <p>Свободных слотов нет</p>}
                            {booking.inMode && booking.available.length === 0 && (
                                <Button
                                    variant="blue"
                                    size="hug36"
                                    disabled={booking.pending}
                                    onClick={booking.bookWithoutSlot}
                                >
                                    Записать команду без слота
                                </Button>
                            )}
                            {booking.inMode && freeSlotCount > 0 && (
                                <p>Выберите свободный слот и нажмите «Занять место».</p>
                            )}
                            {booking.inMode && booking.bookableProjects.length > 1 && (
                                <label className="flex flex-wrap items-center gap-2">
                                    Проект
                                    <select
                                        className="min-w-0 max-w-full rounded-lg border border-gray-200 dark:border-app-border bg-app-surface px-3 py-2 text-app-text"
                                        value={booking.selected?.id}
                                        disabled={booking.pending}
                                        onChange={(event) =>
                                            booking.setProjectId(Number(event.target.value))
                                        }
                                    >
                                        {booking.bookableProjects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>
                    )}

                    {isManager && (currentEndsAt !== undefined || queueEndsAt !== undefined) && (
                        <section
                            aria-labelledby="exam-forecast-title"
                            className="mb-5 overflow-hidden rounded-[22px] border border-[#DCE6FA] bg-[#F5F8FF] dark:border-[#293B5A] dark:bg-[#121D30]"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-7">
                                <div className="flex items-center gap-2.5">
                                    <Icon
                                        name="clock"
                                        size={18}
                                        className="text-[#155DFC] dark:text-[#90B8FF]"
                                    />
                                    <h3
                                        id="exam-forecast-title"
                                        className="text-[15px] font-semibold text-[#182844] dark:text-[#E8EFFF]"
                                    >
                                        Прогноз окончания
                                    </h3>
                                    <ExamTimeHint message={etaMessage} />
                                </div>
                                {etaLowerBound && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-app-badge-amber px-2.5 py-1 text-xs font-medium text-app-badge-amber-fg">
                                        <Icon name="pause" size={14} />
                                        {eta?.current?.paused
                                            ? "Не раньше, если продолжить сейчас"
                                            : "Не раньше"}
                                    </span>
                                )}
                            </div>
                            {etaStale && (
                                <p
                                    role="status"
                                    className="mt-2 px-5 text-xs text-app-muted sm:px-7"
                                >
                                    Прогноз пока не обновился.
                                </p>
                            )}
                            <dl className="grid grid-cols-1 px-5 pb-5 pt-4 min-[420px]:grid-cols-2 sm:px-7 sm:pb-6">
                                {(
                                    [
                                        {
                                            label: "Окончание команды",
                                            timestamp: currentEndsAt,
                                            last: false,
                                        },
                                        {
                                            label: "Окончание очереди",
                                            timestamp: queueEndsAt,
                                            last: true,
                                        },
                                    ] as const
                                ).map(({ label, timestamp, last }) => {
                                    const time =
                                        timestamp === undefined
                                            ? null
                                            : new Date(timestamp).toISOString();
                                    return (
                                        <div
                                            key={label}
                                            className="relative min-w-0 border-l border-[#BDCEF0] pb-4 pl-5 last:border-l-transparent last:pb-0 min-[420px]:border-l-0 min-[420px]:pb-0 min-[420px]:pl-0 dark:border-[#4B648F]"
                                        >
                                            <div
                                                aria-hidden="true"
                                                className="absolute -left-[5px] top-[7px] flex items-center min-[420px]:static min-[420px]:mb-3 min-[420px]:h-3"
                                            >
                                                <span
                                                    className={`size-[9px] shrink-0 rounded-full border-2 border-[#155DFC] dark:border-[#90B8FF] ${last ? "bg-[#155DFC] dark:bg-[#90B8FF]" : "bg-[#F5F8FF] dark:bg-[#121D30]"}`}
                                                />
                                                {!last && (
                                                    <span className="hidden h-px flex-1 bg-gradient-to-r from-[#155DFC] to-[#BDCEF0] min-[420px]:block dark:from-[#90B8FF] dark:to-[#4B648F]" />
                                                )}
                                            </div>
                                            <dt className="text-[13px] font-medium text-[#4B5D7D] dark:text-[#ACBCDA]">
                                                {label}
                                            </dt>
                                            <dd
                                                className={`mt-1 flex items-baseline gap-1.5 text-[clamp(30px,5vw,46px)] font-semibold leading-none tracking-tight tabular-nums ${last ? "text-[#155DFC] dark:text-[#90B8FF]" : "text-[#182844] dark:text-[#E8EFFF]"}`}
                                            >
                                                {time ? (
                                                    <>
                                                        <span className="text-xl font-normal opacity-70">
                                                            ≈
                                                        </span>
                                                        <time dateTime={time}>
                                                            {formatExamTime(time)}
                                                        </time>
                                                    </>
                                                ) : (
                                                    "—"
                                                )}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </section>
                    )}

                    {canReorder && (
                        <p id="exam-reorder-help" className="mb-3 text-sm text-app-muted">
                            Перетащите команду или переместите её стрелками на ручке. Перенос в
                            свободный слот сохраняется сразу. Перестановку команд подтвердите
                            кнопкой «Сохранить изменения».
                        </p>
                    )}

                    <div className="overflow-x-auto rounded-[20px] border border-gray-200 dark:border-app-border">
                        <Tooltip.Provider delay={100}>
                            <table className="w-full border-collapse text-left">
                                <thead className="border-b border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost text-app-text">
                                    <tr>
                                        {editing && <th className="h-14 w-10 px-3" />}
                                        <th className="h-14 px-6 text-[15px] font-semibold">№</th>
                                        <th className="h-14 px-6 text-[15px] font-semibold">
                                            Проект
                                        </th>
                                        <th className="h-14 px-6 text-[15px] font-semibold">
                                            Руководитель
                                        </th>
                                        <th className="h-14 px-6 text-[15px] font-semibold">
                                            Команда
                                        </th>
                                        <th className="h-14 px-6 text-[15px] font-semibold">
                                            Время
                                        </th>
                                        <th
                                            scope="col"
                                            className="h-14 px-3 text-right text-[15px] font-semibold"
                                        >
                                            Оценка
                                        </th>
                                    </tr>
                                </thead>
                                <tbody ref={queueBody}>
                                    {bookingRows
                                        ? bookingRows.map((slot) => {
                                              if (slot.kind === "break") {
                                                  return (
                                                      <ExamBreakRow
                                                          key={queueDropKey(slot)}
                                                          slot={slot}
                                                          examStart={exam.configuration.starts_at}
                                                          editing={editing}
                                                      />
                                                  );
                                              }
                                              const item = queueBySlot.get(slot.id);
                                              const project =
                                                  item && projectById.get(item.project_id);
                                              return (
                                                  <tr
                                                      key={slot.id}
                                                      className={`border-b border-gray-100 dark:border-app-border last:border-0 ${item?.state === "running" ? "bg-[#155DFC12] dark:bg-blue-400/15" : item?.state === "finished" ? "bg-[#ECFDF3] dark:bg-emerald-950/35" : slot.is_available ? "bg-green-50 dark:bg-green-950/40" : "text-app-muted"}`}
                                                  >
                                                      {editing && <td />}
                                                      <td className="px-6 py-4 text-[13px]">
                                                          {++bookingDefenseNumber}
                                                      </td>
                                                      <td className="px-6 py-4 text-[13px]">
                                                          {slot.is_available ? (
                                                              <span className="rounded-full bg-green-100 px-2 py-1 font-medium text-green-900 dark:bg-green-900 dark:text-green-100">
                                                                  Свободно
                                                              </span>
                                                          ) : project ? (
                                                              `${project.name} · Занято`
                                                          ) : (
                                                              "Занято"
                                                          )}
                                                      </td>
                                                      <td className="px-6 py-4 text-[13px]">
                                                          {getExamProjectLeader(project) ?? "—"}
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
                                                      <td className="px-6 py-4 text-[13px]">
                                                          <ApproximateDefenseTime
                                                              value={slot.starts_at}
                                                              examStart={
                                                                  exam.configuration.starts_at
                                                              }
                                                          />
                                                      </td>
                                                      <td className="px-3 py-4 text-right">
                                                          {slot.is_available && (
                                                              <Button
                                                                  variant="dark"
                                                                  size="hug36"
                                                                  className="cursor-pointer motion-reduce:transition-none"
                                                                  disabled={booking.pending}
                                                                  aria-label={`Занять место в ${formatScheduleTime(slot.starts_at, exam.configuration.starts_at)}`}
                                                                  onClick={() =>
                                                                      booking.selectSlot(slot)
                                                                  }
                                                              >
                                                                  Занять место
                                                              </Button>
                                                          )}
                                                      </td>
                                                  </tr>
                                              );
                                          })
                                        : tableRows.map(({ row, number }) => {
                                              if (!("registration_id" in row)) {
                                                  if (row.kind === "break") {
                                                      return (
                                                          <ExamBreakRow
                                                              key={queueDropKey(row)}
                                                              slot={row}
                                                              examStart={
                                                                  exam.configuration.starts_at
                                                              }
                                                              editing={editing}
                                                          />
                                                      );
                                                  }
                                                  return (
                                                      <tr
                                                          key={queueDropKey(row)}
                                                          data-queue-row={queueDropKey(row)}
                                                          {...dropEvents(row)}
                                                          className={`border-b border-gray-100 bg-[#F5F6F8] text-app-muted last:border-0 dark:border-app-border dark:bg-app-ghost [&>td]:transition-colors motion-reduce:[&>td]:transition-none ${dragStyle(row)}`}
                                                      >
                                                          {editing && <td />}
                                                          <td className="px-6 py-4 text-[13px]">
                                                              {number}
                                                          </td>
                                                          <td className="px-6 py-4">—</td>
                                                          <td className="px-6 py-4">—</td>
                                                          <td className="px-6 py-4">—</td>
                                                          <td className="px-6 py-4 text-[13px] text-app-text">
                                                              {formatScheduleTime(
                                                                  row.starts_at,
                                                                  exam.configuration.starts_at,
                                                              )}
                                                          </td>
                                                          <td />
                                                      </tr>
                                                  );
                                              }
                                              const item = row;
                                              const eta = etaByRegistration.get(
                                                  item.registration_id,
                                              );
                                              const startedAt =
                                                  item.started_at ?? item.attempt?.started_at;
                                              const project = projectById.get(item.project_id);
                                              const registration = registrationsById.get(
                                                  item.registration_id,
                                              );
                                              const canChangeRegistration =
                                                  canChangeExamRegistration(item);
                                              const noShow = item.state === "no_show";
                                              const canPlacePostponed =
                                                  item.state === "postponed" && item.position !== 1;
                                              const hasTeamActions = !examOver
                                                  ? noShow ||
                                                    item.state === "running" ||
                                                    item.state === "waiting" ||
                                                    canPlacePostponed ||
                                                    canChangeRegistration
                                                  : canChangeRegistration ||
                                                    (status === "passed" && noShow);
                                              const assessmentWindow =
                                                  item.attempt?.assessment_window;
                                              const score =
                                                  item.attempt &&
                                                  resultsByAttempt.get(item.attempt.id);
                                              return (
                                                  <tr
                                                      key={item.registration_id}
                                                      data-queue-row={queueDropKey(item)}
                                                      draggable={
                                                          canReorder &&
                                                          waitingSet.has(item.registration_id)
                                                      }
                                                      onDragStart={(event) => {
                                                          if (
                                                              !canReorder ||
                                                              !waitingSet.has(item.registration_id)
                                                          ) {
                                                              event.preventDefault();
                                                              return;
                                                          }
                                                          event.dataTransfer.setData(
                                                              "text/plain",
                                                              String(item.registration_id),
                                                          );
                                                          event.dataTransfer.effectAllowed = "move";
                                                          setDraggedTeam(item.registration_id);
                                                      }}
                                                      onDragEnd={clearDrag}
                                                      {...dropEvents(item)}
                                                      className={`group border-b border-gray-100 dark:border-app-border last:border-0 [&>td]:transition-colors motion-reduce:[&>td]:transition-none ${draggedTeam === null && canReorder && waitingSet.has(item.registration_id) ? "cursor-grab active:cursor-grabbing" : ""} ${dragStyle(item)} ${item.state === "running" ? "bg-[#155DFC12] dark:bg-blue-400/15" : item.state === "finished" ? "bg-[#ECFDF3] dark:bg-emerald-950/35" : noShow ? "bg-[--error-bg] text-app-muted" : "hover:bg-gray-50 dark:hover:bg-app-ghost"}`}
                                                  >
                                                      {editing && (
                                                          <td className="px-3 py-4 text-app-muted">
                                                              {item.state === "waiting" && (
                                                                  <button
                                                                      type="button"
                                                                      aria-disabled={
                                                                          !canReorder ||
                                                                          !waitingSet.has(
                                                                              item.registration_id,
                                                                          )
                                                                      }
                                                                      className={
                                                                          draggedTeam ===
                                                                          item.registration_id
                                                                              ? "cursor-grabbing"
                                                                              : draggedTeam !== null
                                                                                ? "cursor-inherit"
                                                                                : "cursor-grab active:cursor-grabbing aria-disabled:cursor-not-allowed"
                                                                      }
                                                                      aria-label={`Переместить команду «${project?.name ?? "Проект команды"}»`}
                                                                      aria-describedby={
                                                                          canReorder
                                                                              ? "exam-reorder-help"
                                                                              : undefined
                                                                      }
                                                                      onKeyDown={(event) => {
                                                                          if (
                                                                              !canReorder ||
                                                                              (event.key !==
                                                                                  "ArrowUp" &&
                                                                                  event.key !==
                                                                                      "ArrowDown")
                                                                          )
                                                                              return;
                                                                          event.preventDefault();
                                                                          const index =
                                                                              tableRows.findIndex(
                                                                                  ({ row }) =>
                                                                                      row === item,
                                                                              );
                                                                          const candidates =
                                                                              event.key ===
                                                                              "ArrowUp"
                                                                                  ? tableRows
                                                                                        .slice(
                                                                                            0,
                                                                                            index,
                                                                                        )
                                                                                        .reverse()
                                                                                  : tableRows.slice(
                                                                                        index + 1,
                                                                                    );
                                                                          const target =
                                                                              candidates.find(
                                                                                  ({ row }) =>
                                                                                      canDropOn(
                                                                                          item.registration_id,
                                                                                          row,
                                                                                      ),
                                                                              );
                                                                          if (target)
                                                                              dropTeam(
                                                                                  item.registration_id,
                                                                                  target.row,
                                                                              );
                                                                      }}
                                                                  >
                                                                      <GripVertical size={16} />
                                                                  </button>
                                                              )}
                                                          </td>
                                                      )}
                                                      <td className="px-6 py-4 text-[13px]">
                                                          {scheduledSlots.length
                                                              ? number
                                                              : numbers.get(item.registration_id)}
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          {project ? (
                                                              <Link
                                                                  to={paths.app.project.getHref(
                                                                      project.id,
                                                                  )}
                                                                  className="cursor-pointer text-[13px] font-medium text-app-blue dark:text-blue-300 hover:underline"
                                                              >
                                                                  {project.name}
                                                              </Link>
                                                          ) : (
                                                              <span className="text-[13px] text-app-muted">
                                                                  —
                                                              </span>
                                                          )}
                                                          {registration && (
                                                              <div className="mt-1 text-xs text-app-muted">
                                                                  {registration.created_source ===
                                                                  "manager"
                                                                      ? "Записалась сама"
                                                                      : "Назначена организатором"}
                                                              </div>
                                                          )}
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          <span className="flex items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-slate-200">
                                                              <Icon name="profile" size={16} />
                                                              {getExamProjectLeader(project) ??
                                                                  "Имя не указано"}
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
                                                      <td className="px-6 py-4 text-[13px] text-gray-600 dark:text-slate-300">
                                                          {eta && hasOrderChanges ? (
                                                              <span className="text-app-muted">
                                                                  После сохранения порядка
                                                              </span>
                                                          ) : eta ? (
                                                              <>
                                                                  {queueEtaStale &&
                                                                      "Прошлый прогноз: "}
                                                                  {eta.certainty ===
                                                                      "lower_bound" && "Не раньше "}
                                                                  <ApproximateDefenseTime
                                                                      value={eta.eta_at}
                                                                      examStart={
                                                                          exam.configuration
                                                                              .starts_at
                                                                      }
                                                                      message={etaMessage}
                                                                  />
                                                                  {item.planned_start_at && (
                                                                      <div className="mt-1 text-xs text-app-muted">
                                                                          Слот:{" "}
                                                                          {formatScheduleTime(
                                                                              item.planned_start_at,
                                                                              exam.configuration
                                                                                  .starts_at,
                                                                          )}
                                                                      </div>
                                                                  )}
                                                              </>
                                                          ) : startedAt ? (
                                                              formatExamTime(startedAt)
                                                          ) : item.planned_start_at ? (
                                                              <span className="text-app-muted">
                                                                  Слот:{" "}
                                                                  {formatScheduleTime(
                                                                      item.planned_start_at,
                                                                      exam.configuration.starts_at,
                                                                  )}
                                                              </span>
                                                          ) : (
                                                              "—"
                                                          )}
                                                          {item.state === "postponed" && (
                                                              <div className="mt-1 text-xs text-app-muted">
                                                                  {item.position === null
                                                                      ? "Отложена"
                                                                      : "В очереди"}
                                                              </div>
                                                          )}
                                                      </td>
                                                      <td className="px-3 py-4">
                                                          <div className="flex items-center justify-end gap-1">
                                                              {assessmentWindow && item.attempt && (
                                                                  <ExamAssessment
                                                                      key={item.attempt.id}
                                                                      workspaceId={workspaceId}
                                                                      examId={examId}
                                                                      attemptId={item.attempt.id}
                                                                      closesAt={
                                                                          assessmentWindow.closes_at
                                                                      }
                                                                      remainingSeconds={Math.max(
                                                                          0,
                                                                          Math.ceil(
                                                                              (Date.parse(
                                                                                  assessmentWindow.closes_at,
                                                                              ) -
                                                                                  serverNow) /
                                                                                  1000,
                                                                          ),
                                                                      )}
                                                                      projectName={
                                                                          project?.name ??
                                                                          "Проект команды"
                                                                      }
                                                                  />
                                                              )}
                                                              {score?.current ? (
                                                                  <ExamScore
                                                                      item={score}
                                                                      workspaceId={workspaceId}
                                                                      examId={examId}
                                                                      onOpen={() =>
                                                                          setResultItem(score)
                                                                      }
                                                                  />
                                                              ) : item.state === "finished" &&
                                                                myProjectIds.has(
                                                                    item.project_id,
                                                                ) ? (
                                                                  <ExamScoreStatus
                                                                      label="Оценка скоро появится"
                                                                      onOpen={
                                                                          score
                                                                              ? () =>
                                                                                    setResultItem(
                                                                                        score,
                                                                                    )
                                                                              : undefined
                                                                      }
                                                                  />
                                                              ) : score ||
                                                                (resultAccess &&
                                                                    !isExamAccessDenied(
                                                                        results.error,
                                                                    ) &&
                                                                    item.state === "finished") ? (
                                                                  <ExamScoreStatus
                                                                      label={
                                                                          isAssessmentOpen(
                                                                              item,
                                                                              serverNow,
                                                                          )
                                                                              ? "Идёт оценивание"
                                                                              : results.isError
                                                                                ? "Не удалось загрузить итог"
                                                                                : score
                                                                                  ? "Утвердить оценку"
                                                                                  : "Итог пока недоступен"
                                                                      }
                                                                      onOpen={
                                                                          score
                                                                              ? () =>
                                                                                    setResultItem(
                                                                                        score,
                                                                                    )
                                                                              : undefined
                                                                      }
                                                                  />
                                                              ) : null}
                                                              {isManager && hasTeamActions && (
                                                                  <DropdownMenu>
                                                                      <DropdownMenuTrigger asChild>
                                                                          <button
                                                                              type="button"
                                                                              aria-label="Действия с командой"
                                                                              disabled={
                                                                                  registrationPending ||
                                                                                  savingOrder ||
                                                                                  attemptPending
                                                                              }
                                                                              className="h-9 w-9 cursor-pointer rounded-lg p-2 text-gray-500 dark:text-app-muted hover:bg-gray-100 dark:hover:bg-app-ghost"
                                                                          >
                                                                              <Ellipsis size={16} />
                                                                          </button>
                                                                      </DropdownMenuTrigger>
                                                                      <DropdownMenuPortal>
                                                                          <DropdownMenuContent
                                                                              align="end"
                                                                              className="w-[220px]"
                                                                          >
                                                                              {!examOver &&
                                                                                  (item.state ===
                                                                                      "running" ||
                                                                                      item.state ===
                                                                                          "waiting") && (
                                                                                      <DropdownMenuItem
                                                                                          onSelect={() => {
                                                                                              setPostponeReason(
                                                                                                  "",
                                                                                              );
                                                                                              setPostpone(
                                                                                                  {
                                                                                                      item,
                                                                                                      title:
                                                                                                          project?.name ??
                                                                                                          "Команда",
                                                                                                  },
                                                                                              );
                                                                                          }}
                                                                                      >
                                                                                          Отложить
                                                                                      </DropdownMenuItem>
                                                                                  )}
                                                                              {!examOver &&
                                                                                  canPlacePostponed && (
                                                                                      <>
                                                                                          {item.position ===
                                                                                              null && (
                                                                                              <DropdownMenuItem
                                                                                                  onSelect={() =>
                                                                                                      void returnTeam(
                                                                                                          item,
                                                                                                          false,
                                                                                                      )
                                                                                                  }
                                                                                              >
                                                                                                  Вернуть
                                                                                                  в
                                                                                                  очередь
                                                                                              </DropdownMenuItem>
                                                                                          )}
                                                                                          <DropdownMenuItem
                                                                                              onSelect={() =>
                                                                                                  void returnTeam(
                                                                                                      item,
                                                                                                      true,
                                                                                                  )
                                                                                              }
                                                                                          >
                                                                                              Поставить
                                                                                              следующей
                                                                                          </DropdownMenuItem>
                                                                                      </>
                                                                                  )}
                                                                              {registration &&
                                                                                  canChangeRegistration && (
                                                                                      <DropdownMenuItem
                                                                                          onSelect={() =>
                                                                                              setTransfer(
                                                                                                  {
                                                                                                      registration,
                                                                                                      self: false,
                                                                                                  },
                                                                                              )
                                                                                          }
                                                                                      >
                                                                                          Перенести
                                                                                          запись
                                                                                      </DropdownMenuItem>
                                                                                  )}
                                                                              {noShow &&
                                                                                  (!examOver ||
                                                                                      status ===
                                                                                          "passed") && (
                                                                                      <DropdownMenuItem
                                                                                          className="gap-3"
                                                                                          onSelect={() =>
                                                                                              setNoShow(
                                                                                                  item,
                                                                                              )
                                                                                          }
                                                                                      >
                                                                                          Отменить
                                                                                          неявку
                                                                                      </DropdownMenuItem>
                                                                                  )}
                                                                              {!examOver &&
                                                                                  item.state ===
                                                                                      "waiting" && (
                                                                                      <DropdownMenuItem
                                                                                          className="gap-3"
                                                                                          onSelect={() =>
                                                                                              setNoShow(
                                                                                                  item,
                                                                                              )
                                                                                          }
                                                                                      >
                                                                                          Неявка
                                                                                      </DropdownMenuItem>
                                                                                  )}
                                                                              {canChangeRegistration && (
                                                                                  <DropdownMenuItem
                                                                                      className="gap-3 text-red-600 dark:text-red-300"
                                                                                      onSelect={() =>
                                                                                          setDeleteRow(
                                                                                              {
                                                                                                  id: item.registration_id,
                                                                                                  title:
                                                                                                      project?.name ??
                                                                                                      "Команда",
                                                                                              },
                                                                                          )
                                                                                      }
                                                                                  >
                                                                                      <Trash2
                                                                                          size={16}
                                                                                      />
                                                                                      Снять с
                                                                                      экзамена
                                                                                  </DropdownMenuItem>
                                                                              )}
                                                                          </DropdownMenuContent>
                                                                      </DropdownMenuPortal>
                                                                  </DropdownMenu>
                                                              )}
                                                          </div>
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                </tbody>
                            </table>
                            {queueQuery.isError && (
                                <ExamErrorState
                                    message="Не удалось обновить очередь выступлений."
                                    retry={() => void queueQuery.refetch()}
                                    pending={queueQuery.isFetching}
                                />
                            )}
                            {!queueQuery.isError && !bookingRows && !hasDefenseRows && (
                                <div className="py-12 text-center text-sm text-app-muted">
                                    {queueQuery.isLoading
                                        ? "Загружаем список команд…"
                                        : "Команды не найдены"}
                                </div>
                            )}
                        </Tooltip.Provider>
                    </div>
                </section>
                {resultAccess && results.isSuccess && (
                    <ExamResultsRegistry
                        workspaceId={workspaceId}
                        examId={examId}
                        items={results.data}
                        canDownload={status === "finished" && !queueEtaStale && !assessmentOpen}
                        onOpen={setResultItem}
                    />
                )}
                {resultAccess && results.isError && !isExamAccessDenied(results.error) && (
                    <ExamErrorState
                        message={getGradingError(results.error)}
                        retry={() => void results.refetch()}
                        pending={results.isFetching}
                    />
                )}
            </div>

            {resultAccess && resultItem && !isExamAccessDenied(results.error) && (
                <ExamResultDialog
                    key={resultItem.attempt_id}
                    workspaceId={workspaceId}
                    examId={examId}
                    item={resultItem}
                    onClose={() => setResultItem(null)}
                    windowOpen={queueItems.some(
                        (item) =>
                            item.attempt?.id === resultItem.attempt_id &&
                            isAssessmentOpen(item, serverNow),
                    )}
                />
            )}

            {isManager && assignOpen && exam.status === "published" && !examOver && (
                <ExamRegistrationAssign
                    exam={exam}
                    assignedIds={new Set(queueItems.map((item) => item.project_id))}
                    onClose={() => setAssignOpen(false)}
                    onQueue={() => {
                        setAssignOpen(false);
                        if (!organizerOnly) {
                            navigate(
                                `${paths.app.examConduct.getHref(workspaceId, examId)}#presentation-queue`,
                            );
                            return;
                        }
                        requestAnimationFrame(() => {
                            queueHeading.current?.focus({ preventScroll: true });
                            queueHeading.current?.scrollIntoView({ block: "start" });
                        });
                    }}
                />
            )}

            {transfer && (transfer.self ? showBooking : isManager) && (
                <ExamRegistrationTransfer
                    sourceExam={exam}
                    registration={
                        (transfer.self
                            ? booking.active.find((item) => item.id === transfer.registration.id)
                            : registrationsById.get(transfer.registration.id)) ??
                        transfer.registration
                    }
                    projectName={projectById.get(transfer.registration.project_id)?.name}
                    self={transfer.self}
                    sourceOpen={!transfer.self || booking.isOpen}
                    now={serverNow}
                    onClose={() => setTransfer(null)}
                />
            )}

            <Dialog open={!!booking.action} onOpenChange={(open) => !open && booking.dismiss()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {bookingAction?.kind === "book"
                                ? bookingAction.slot
                                    ? `Занять слот в ${formatScheduleTime(bookingAction.slot.starts_at, exam.configuration.starts_at)}?`
                                    : "Записать команду на защиту?"
                                : "Отменить запись на защиту?"}
                        </DialogTitle>
                    </DialogHeader>
                    {bookingAction?.kind === "book" && (
                        <p className="text-sm text-app-muted">
                            {
                                booking.eligible.find(
                                    (project) => project.id === bookingAction.projectId,
                                )?.name
                            }
                            {bookingAction.slot && (
                                <span className="mt-1 block">{beforeStartEtaMessage}</span>
                            )}
                        </p>
                    )}
                    {booking.action && !booking.canConfirm && !booking.pending && (
                        <p className="text-sm text-app-muted">
                            Данные записи изменились. Закройте окно и проверьте список.
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            disabled={booking.pending}
                            onClick={booking.dismiss}
                        >
                            {bookingAction?.kind === "cancel" ? "Оставить запись" : "Отмена"}
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            loading={booking.pending}
                            disabled={!booking.canConfirm}
                            onClick={booking.confirm}
                        >
                            {bookingAction?.kind === "cancel" ? "Отменить запись" : "Подтвердить"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isManager && !!postpone}
                onOpenChange={(open) => {
                    if (!open && !registrationPending) setPostpone(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Отложить выступление?</DialogTitle>
                    </DialogHeader>
                    <form
                        className="mt-4 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void postponeTeam();
                        }}
                    >
                        <p className="text-sm text-app-muted">
                            {postpone?.title}. Команда останется в экзамене, оценивание не
                            откроется.
                        </p>
                        <label className="grid gap-1 text-sm">
                            Причина
                            <textarea
                                required
                                maxLength={1000}
                                rows={3}
                                value={postponeReason}
                                onChange={(event) => setPostponeReason(event.target.value)}
                                className="rounded-lg border border-app-border bg-app-surface p-2"
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="hug36"
                                disabled={registrationPending}
                                onClick={() => setPostpone(null)}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                variant="blue"
                                size="hug36"
                                loading={registrationPending}
                                disabled={!postponeReason.trim()}
                            >
                                Отложить
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isManager && !!deleteRow}
                onOpenChange={(open) => !open && setDeleteRow(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить команду?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-app-muted">{deleteRow?.title}</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" size="hug36" onClick={() => setDeleteRow(null)}>
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            className="!bg-red-700 !text-white hover:!bg-red-800"
                            onClick={deleteRegistration}
                            loading={registrationPending}
                        >
                            Удалить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ContentLayout>
    );
}
