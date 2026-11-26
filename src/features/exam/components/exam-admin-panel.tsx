import { shareExamQueue } from "@/features/exam/exam-queue-snapshot";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    CalendarClock,
    ChevronLeft,
    Coffee,
    Save,
    ShieldCheck,
    Trash2,
    GripVertical,
    Maximize2,
    Plus,
} from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import { ExamProjectSelect } from "./exam-project-select";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner/spinner";
import { Textarea } from "@/components/ui/textarea/textarea";
import { DatePicker, DatePickerClearButton } from "@/components/ui/date-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { paths } from "@/config/paths";
import { cn } from "@/lib/utils";
import {
    examApi,
    getExamErrorCode,
    getExamErrorMessage,
    invalidateExam,
    questionApi,
} from "@/lib/exams";
import { useExamRegistrations, useExamSlots } from "@/lib/exams";
import { queryKeys } from "@/lib/query-keys";
import {
    formatScheduleTime,
    getSlotInterval,
    hasEarlierFreeSlots,
    insertScheduleBreak,
    minute,
    moveScheduleBreak,
    removeScheduleSlot,
    resizeDraftSlots,
    slotScheduleError,
    slotStartAtTime,
    updateScheduleSlot,
    type LocalSlot,
} from "../exam-schedule";
import { useProjectsList } from "@/lib/projects";
import { getExamProjectLeader, useExamProjects } from "../use-exam-projects";
import type {
    Exam,
    ExamConfiguration,
    ExamSlot,
    Registration,
    RegistrationListResponse,
} from "@/types/exam";
import type { BackendProjectType } from "@/types/api";
import { ApproximateDefenseTime } from "./approximate-defense-time";
import { ProjectTypeQuestionsEditor } from "./project-type-questions-editor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hasExamStarted } from "../exam-display";

export type ExamBasics = Pick<ExamConfiguration, "title" | "starts_at">;

type Props = {
    workspaceId: number;
    workspaceName: string;
    projectTypes: BackendProjectType[];
    workspaces?: Array<{ id: number; title: string }>;
    onWorkspaceChange?: (workspaceId: number, basics: ExamBasics) => void;
    initialBasics?: ExamBasics;
    initialSection?: SectionId;
    exam?: Exam;
    onCancel: () => void;
    onSaved: (exam: Exam) => void;
};

const sections = [
    { id: "main", label: "Основное" },
    { id: "questions", label: "Вопросы" },
    { id: "queue", label: "Очередь выступлений" },
    { id: "assessment", label: "Оценивание" },
    { id: "review", label: "Проверка" },
] as const;

type SectionId = (typeof sections)[number]["id"];

const slotFields = [
    ["presentation_minutes", "Выступление"],
    ["questions_minutes", "Вопросы"],
    ["transition_minutes", "Переход"],
] as const;

type SlotTiming = Record<(typeof slotFields)[number][0], number>;
const slotMinutes = (timing: SlotTiming) =>
    timing.presentation_minutes + timing.questions_minutes + timing.transition_minutes;

const scheduleEnd = (slots: LocalSlot[], examStart: string) =>
    slots.length
        ? formatScheduleTime(
              new Date(Math.max(...slots.map((slot) => Date.parse(slot.ends_at)))).toISOString(),
              examStart,
          )
        : "—";

const defaultConfiguration = (): ExamConfiguration => ({
    title: "",
    description: null,
    starts_at: new Date(
        Math.floor(Date.now() / minute) * minute + 7 * 24 * 60 * minute,
    ).toISOString(),
    connection_url: null,
    project_type_ids: [],
    registration_opens_at: null,
    registration_closes_at: null,
    weights: { teacher: 60, manager: 30, member: 10 },
    max_score: 25,
    presentation_minutes: 7,
    questions_minutes: 7,
    transition_minutes: 1,
    assessment_window_minutes: 3,
});

const registrationFields = [
    { key: "registration_opens_at", label: "Открытие записи" },
    { key: "registration_closes_at", label: "Закрытие записи" },
] as const;

const localDate = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

export function ExamAdminPanel({
    workspaceId,
    workspaceName,
    projectTypes,
    workspaces = [],
    onWorkspaceChange,
    initialBasics,
    initialSection = "main",
    exam: existingExam,
    onCancel,
    onSaved,
}: Props) {
    const queryClient = useQueryClient();
    const [createdExam, setCreatedExam] = useState<Exam>();
    const exam = existingExam ?? createdExam;
    const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
    const [configuration, setConfiguration] = useState<ExamConfiguration>(
        () => existingExam?.configuration ?? { ...defaultConfiguration(), ...initialBasics },
    );
    const [settingsBaseline, setSettingsBaseline] = useState(existingExam);
    const [settingsConflict, setSettingsConflict] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const settingsStale =
        settingsConflict ||
        Boolean(
            exam &&
            settingsBaseline &&
            exam.current_settings_version > settingsBaseline.current_settings_version,
        );
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const writeInProgress = useRef(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [touched, setTouched] = useState<Set<keyof ExamConfiguration | "weights" | "durations">>(
        new Set(),
    );
    const [slotStart, setSlotStart] = useState(configuration.starts_at);
    const [pendingTiming, setPendingTiming] = useState<SlotTiming | null>(null);
    const [pendingWorkspaceId, setPendingWorkspaceId] = useState<number | null>(null);
    const workspaceSelect = useRef<HTMLSelectElement>(null);
    const workspaceField = useRef<HTMLDivElement>(null);
    const workspaceCancel = useRef<HTMLButtonElement>(null);
    const [slotCount, setSlotCount] = useState(1);
    const [scheduleEdit, setScheduleEdit] = useState<{
        base: ExamSlot[];
        rows: LocalSlot[];
    } | null>(null);
    const nextDraftSlotKey = useRef(0);
    const [assignOpenKey, setAssignOpenKey] = useState<string | null>(null);
    const [replacement, setReplacement] = useState<{
        slot: LocalSlot;
        projectId: number;
        registration: Registration;
    } | null>(null);
    const [projectSearch, setProjectSearch] = useState("");
    const [pendingSlotId, setPendingSlotId] = useState<number | null>(null);
    const [slotScheduleWarning, setSlotScheduleWarning] = useState("");
    const draggedSlotId = useRef<number | null>(null);
    const [questionErrors, setQuestionErrors] = useState<string[]>([]);
    const [resetSlotsOpen, setResetSlotsOpen] = useState(false);
    const [publishConfirmationOpen, setPublishConfirmationOpen] = useState(false);
    const [queueExpanded, setQueueExpanded] = useState(false);
    const queueDialogRef = useRef<HTMLDivElement>(null);
    const [durationWarningAction, setDurationWarningAction] = useState<"save" | "publish" | null>(
        null,
    );
    const previousExamStartRef = useRef(configuration.starts_at);

    const assessmentQueue = useQuery({
        queryKey: queryKeys.exams.queue(workspaceId, exam?.id ?? 0),
        queryFn: () => examApi.queue(workspaceId, exam?.id ?? 0),
        structuralSharing: shareExamQueue,
        enabled: activeSection === "questions" && exam?.status === "published",
    });
    const assessedTypes = new Set(
        assessmentQueue.data?.items.flatMap(({ attempt }) =>
            attempt?.assessment_window ? [attempt.assessment_window.project_type_id] : [],
        ),
    );
    const slotsQuery = useExamSlots(workspaceId, exam?.id ?? 0);
    const serverSlots = slotsQuery.data?.items;
    const scheduleDatesLocked =
        Boolean(exam?.completed_at || exam?.archived_at) || hasExamStarted(exam);
    const localSlots = useMemo(
        () =>
            scheduleEdit?.rows ??
            (serverSlots ?? []).map((slot) => ({
                ...slot,
                key: `server-${slot.id}`,
            })),
        [serverSlots, scheduleEdit],
    );
    const draftSlots = useMemo(() => localSlots.filter((slot) => !slot.id), [localSlots]);
    const defenseSlots = useMemo(
        () => localSlots.filter((slot) => slot.kind !== "break"),
        [localSlots],
    );
    const stageSchedule = (rows: LocalSlot[]) =>
        setScheduleEdit((edit) => ({ base: edit?.base ?? serverSlots ?? [], rows }));
    const registrationsQuery = useExamRegistrations(workspaceId, exam?.id ?? 0);
    const projectsQuery = useProjectsList(String(workspaceId), { page: 1, limit: 100 });
    const projectById = useExamProjects(
        projectsQuery.data?.items ?? [],
        (registrationsQuery.data?.items ?? [])
            .filter(
                (registration) => registration.status === "active" && registration.slot_id !== null,
            )
            .map((registration) => registration.project_id),
        projectsQuery.isLoading,
    );

    const historyQuery = useQuery({
        queryKey: queryKeys.exams.settings(workspaceId, exam?.id ?? 0),
        queryFn: () => examApi.settings(workspaceId, exam?.id ?? 0),
        enabled: Boolean(exam),
    });

    useEffect(() => {
        if (pendingWorkspaceId === null) return;

        const handleOutsidePress = (event: PointerEvent) => {
            if (event.target instanceof Node && !workspaceField.current?.contains(event.target)) {
                setPendingWorkspaceId(null);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            setPendingWorkspaceId(null);
            workspaceSelect.current?.focus();
        };
        // Let the native picker finish closing before moving focus to the confirmation.
        const focusFrame = requestAnimationFrame(() => workspaceCancel.current?.focus());
        document.addEventListener("pointerdown", handleOutsidePress);
        document.addEventListener("keydown", handleEscape);
        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener("pointerdown", handleOutsidePress);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [pendingWorkspaceId]);

    useEffect(() => {
        const previous = new Date(previousExamStartRef.current).getTime();
        const next = new Date(configuration.starts_at).getTime();
        previousExamStartRef.current = configuration.starts_at;
        if (
            !serverSlots?.length &&
            Number.isFinite(previous) &&
            Number.isFinite(next) &&
            previous !== next
        ) {
            const delta = next - previous;
            setSlotStart((current) => new Date(Date.parse(current) + delta).toISOString());
            setScheduleEdit(
                (current) =>
                    current && {
                        ...current,
                        rows: current.rows.map((slot) => ({
                            ...slot,
                            starts_at: new Date(Date.parse(slot.starts_at) + delta).toISOString(),
                            ends_at: new Date(Date.parse(slot.ends_at) + delta).toISOString(),
                        })),
                    },
            );
            if (draftSlots.length)
                setSlotScheduleWarning("Несохранённые слоты сдвинуты вместе с экзаменом.");
        }
    }, [configuration.starts_at, serverSlots?.length, draftSlots.length]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!exam) {
                event.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [exam]);

    const update = <K extends keyof ExamConfiguration>(key: K, value: ExamConfiguration[K]) =>
        setConfiguration((current) => ({ ...current, [key]: value }));

    const touch = (key: keyof ExamConfiguration | "weights" | "durations") =>
        setTouched((current) => new Set(current).add(key));

    const visibleError = (key: keyof ExamConfiguration | "weights" | "durations") =>
        isSubmitted || touched.has(key) ? errors[key] : undefined;

    const errors = useMemo(() => {
        const result: Partial<Record<keyof ExamConfiguration | "weights" | "durations", string>> =
            {};
        if (!configuration.title.trim()) result.title = "Укажите название";
        if (configuration.title.trim().length > 200)
            result.title = "Название должно быть не длиннее 200 символов.";
        if ((configuration.description?.trim().length ?? 0) > 5000)
            result.description = "Описание должно быть не длиннее 5000 символов.";
        const maxScore = Number(configuration.max_score);
        if (
            maxScore <= 0 ||
            maxScore >= 10_000_000_000 ||
            !/^\d+(\.\d{1,2})?$/.test(String(configuration.max_score))
        ) {
            result.max_score = "Укажите положительный балл с точностью до сотых.";
        }
        if (!configuration.project_type_ids.length)
            result.project_type_ids = "Выберите тип проекта";
        if (
            projectTypes.length > 0 &&
            configuration.project_type_ids.some(
                (typeId) => !projectTypes.some((projectType) => projectType.id === typeId),
            )
        ) {
            result.project_type_ids = "Выберите типы проектов из этого пространства";
        }
        if (Number.isNaN(new Date(configuration.starts_at).getTime()))
            result.starts_at = "Укажите дату";
        const startsAt = Date.parse(configuration.starts_at);
        const opensAt = Date.parse(configuration.registration_opens_at ?? "");
        const closesAt = Date.parse(configuration.registration_closes_at ?? "");
        if (opensAt > startsAt)
            result.registration_opens_at = "Запись должна открыться до начала экзамена.";
        if (closesAt > startsAt)
            result.registration_closes_at = "Запись должна закрыться до начала экзамена.";
        if (opensAt >= closesAt)
            result.registration_closes_at = "Закрытие должно быть позже открытия.";
        if (configuration.connection_url) {
            try {
                const url = new URL(configuration.connection_url);
                if (!["http:", "https:"].includes(url.protocol)) throw new Error();
            } catch {
                result.connection_url = "Нужна ссылка http:// или https://";
            }
        }
        const weightTotal =
            configuration.weights.teacher +
            configuration.weights.manager +
            configuration.weights.member;
        if (
            weightTotal !== 100 ||
            Object.values(configuration.weights).some(
                (weight) => !Number.isInteger(weight) || weight < 0 || weight > 100,
            )
        )
            result.weights = "Веса должны в сумме составлять 100%";
        if (
            ![
                configuration.presentation_minutes,
                configuration.questions_minutes,
                configuration.transition_minutes,
            ].every(Number.isInteger) ||
            configuration.presentation_minutes < 1 ||
            configuration.questions_minutes < 0 ||
            configuration.transition_minutes < 0 ||
            slotMinutes(configuration) > 1440
        )
            result.durations = "Проверьте время на одну команду";
        const windowMinutes = configuration.assessment_window_minutes;
        if (!Number.isInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440) {
            result.assessment_window_minutes = "Укажите от 1 до 1440 минут";
        }
        return result;
    }, [configuration, projectTypes]);

    const sectionErrors: Record<SectionId, boolean> = {
        main: Boolean(
            visibleError("title") ||
            visibleError("description") ||
            visibleError("project_type_ids") ||
            visibleError("starts_at") ||
            visibleError("registration_opens_at") ||
            visibleError("registration_closes_at") ||
            visibleError("max_score") ||
            visibleError("connection_url"),
        ),
        questions: questionErrors.length > 0,
        queue:
            Boolean(visibleError("durations")) ||
            (isSubmitted && Boolean(slotScheduleError(localSlots, configuration.starts_at))),
        assessment: Boolean(visibleError("weights") || visibleError("assessment_window_minutes")),
        review: isSubmitted && Object.keys(errors).length > 0,
    };

    const timing = {
        presentation_minutes: configuration.presentation_minutes,
        questions_minutes: configuration.questions_minutes,
        transition_minutes: configuration.transition_minutes,
    };
    const expectedSlotMinutes = slotMinutes(timing);
    const nextSlotMinutes = pendingTiming ? slotMinutes(pendingTiming) : expectedSlotMinutes;
    const validTiming =
        !pendingTiming ||
        (slotFields.every(
            ([key]) => Number.isInteger(pendingTiming[key]) && pendingTiming[key] >= 0,
        ) &&
            pendingTiming.presentation_minutes >= 1 &&
            nextSlotMinutes <= 24 * 60);

    // Keep the first start and existing gaps. Preview changes to unsaved slots only,
    // since the API cannot rewrite saved slots. Commit timings and the preview together.
    const proposedSlots =
        pendingTiming && validTiming ? resizeDraftSlots(draftSlots, nextSlotMinutes) : null;
    const proposedSchedule = proposedSlots
        ? [...localSlots.filter((slot) => slot.id), ...proposedSlots]
        : null;
    const timingError =
        proposedSchedule && draftSlots.length > 0
            ? slotScheduleError(proposedSchedule, configuration.starts_at)
            : null;

    const applyTiming = (next: SlotTiming) => {
        setConfiguration((current) => ({ ...current, ...next }));
        setPendingTiming(null);
    };

    const changeTiming = (key: keyof SlotTiming, value: number) => {
        const next = { ...(pendingTiming ?? timing), [key]: value };
        if (slotFields.every(([field]) => next[field] === timing[field])) {
            setPendingTiming(null);
        } else if (
            localSlots.length ||
            !Number.isInteger(value) ||
            value < (key === "presentation_minutes" ? 1 : 0) ||
            slotMinutes(next) > 24 * 60
        ) {
            setPendingTiming(next);
        } else {
            applyTiming(next);
        }
    };

    const selectedTypeNames = projectTypes
        .filter((type) => configuration.project_type_ids.includes(type.id))
        .map((type) => type.name)
        .join(", ");

    const scheduleMismatch = useMemo(
        () =>
            defenseSlots.filter((slot) => {
                const minutes =
                    (new Date(slot.ends_at).getTime() - new Date(slot.starts_at).getTime()) / 60000;
                return Math.abs(minutes - expectedSlotMinutes) > 0.01;
            }),
        [expectedSlotMinutes, defenseSlots],
    );

    const syncLocalSlots = async (savedExam: Exam) => {
        if (!scheduleEdit) return;
        const interval = ({ starts_at, ends_at, kind = "defense" }: LocalSlot) => ({
            starts_at,
            ends_at,
            kind,
        });
        const queryKey = queryKeys.exams.slots(workspaceId, savedExam.id);
        const expected_slots = scheduleEdit.base.map(
            ({ id, starts_at, ends_at, kind = "defense" }) => ({
                id,
                starts_at,
                ends_at,
                kind,
            }),
        );
        const slots = scheduleEdit.rows.map((row) => ({ id: row.id, ...interval(row) }));
        const items = await examApi.replaceSlots(workspaceId, savedExam.id, {
            expected_slots,
            slots,
        });
        await queryClient.cancelQueries({ queryKey });
        queryClient.setQueryData(queryKey, { items, has_more: false });
        setScheduleEdit(null);
    };

    const loadLatestSettings = async () => {
        if (!exam || writeInProgress.current || loadingSettings) return;
        setLoadingSettings(true);
        try {
            const queryKey = queryKeys.exams.detail(workspaceId, exam.id);
            await queryClient.cancelQueries({ queryKey });
            const latest = await examApi.get(workspaceId, exam.id);
            previousExamStartRef.current = latest.configuration.starts_at;
            setSlotStart(latest.configuration.starts_at);
            setConfiguration(latest.configuration);
            setSettingsBaseline(latest);
            setSettingsConflict(false);
            setPendingTiming(null);
            setReason("");
            setQuestionErrors([]);
            queryClient.setQueryData(queryKey, latest);
        } catch {
            toast.error("Не удалось загрузить актуальные настройки. Попробуйте ещё раз.");
        } finally {
            setLoadingSettings(false);
        }
    };

    const saveExam = async (action: "save" | "publish", ignoreDurationWarning = false) => {
        if (writeInProgress.current || pendingTiming || settingsStale || loadingSettings) return;
        const publishing = action === "publish";
        const settings = {
            ...configuration,
            description: configuration.description?.trim() || null,
        };
        const configurationChanged =
            settingsBaseline &&
            (Object.keys(settings) as Array<keyof ExamConfiguration>).some(
                (key) =>
                    JSON.stringify(settingsBaseline.configuration[key]) !==
                    JSON.stringify(settings[key]),
            );
        if (!publishing && exam && !configurationChanged && !scheduleEdit) {
            toast.info("Нет изменений для сохранения");
            return;
        }
        setIsSubmitted(true);
        if (!workspaceId) {
            toast.error("Выберите пространство");
            setActiveSection("main");
            return;
        }
        const startChanged = Boolean(
            settingsBaseline &&
            Date.parse(settingsBaseline.configuration.starts_at) !== Date.parse(settings.starts_at),
        );
        const datesChanged =
            startChanged ||
            registrationFields.some(
                ({ key }) =>
                    settingsBaseline && settingsBaseline.configuration[key] !== settings[key],
            );
        if (datesChanged && scheduleDatesLocked) {
            toast.error("После начала экзамена сроки изменить нельзя.");
            setActiveSection("main");
            return;
        }
        if (
            startChanged &&
            exam?.status === "published" &&
            Date.parse(settings.starts_at) <= Date.now()
        ) {
            toast.error("Выберите новое время начала экзамена в будущем.");
            setActiveSection("main");
            return;
        }
        if (
            startChanged &&
            serverSlots?.some((slot) => Date.parse(slot.starts_at) < Date.parse(settings.starts_at))
        ) {
            toast.error(
                "Начало экзамена должно быть не позже первого сохранённого слота. Сначала скорректируйте расписание.",
            );
            setActiveSection("main");
            return;
        }
        const checkSchedule = Boolean(scheduleEdit) || publishing || startChanged;
        const scheduleError =
            checkSchedule && slotScheduleError(localSlots, configuration.starts_at);
        if (scheduleError) {
            toast.error(scheduleError);
            setActiveSection("queue");
            return;
        }
        if (Object.keys(errors).length > 0) {
            toast.error("Проверьте обязательные поля");
            setActiveSection(
                errors.durations
                    ? "queue"
                    : errors.weights || errors.assessment_window_minutes
                      ? "assessment"
                      : "main",
            );
            return;
        }
        const timingsChanged =
            exam &&
            (exam.configuration.presentation_minutes !== configuration.presentation_minutes ||
                exam.configuration.questions_minutes !== configuration.questions_minutes ||
                exam.configuration.transition_minutes !== configuration.transition_minutes);
        if (
            !ignoreDurationWarning &&
            (publishing || scheduleEdit || timingsChanged) &&
            scheduleMismatch.length > 0
        ) {
            setDurationWarningAction(action);
            return;
        }
        if (configurationChanged && !reason.trim()) {
            toast.error("Укажите причину изменения настроек");
            return;
        }

        writeInProgress.current = true;
        setSaving(true);
        let saved = settingsBaseline ?? exam;
        let stage: "settings" | "slots" | "publish" = "settings";
        try {
            if (publishing && !(await validateQuestions())) {
                toast.error("Проверьте вопросы перед публикацией");
                setActiveSection("questions");
                return;
            }
            if (!saved) {
                saved = await examApi.create(workspaceId, settings);
                setCreatedExam(saved);
            } else if (configurationChanged && settingsBaseline) {
                saved = await examApi.replaceSettings(workspaceId, saved.id, {
                    expected_version: settingsBaseline.current_settings_version,
                    reason: reason.trim(),
                    configuration: settings,
                });
            }
            await queryClient.cancelQueries({
                queryKey: queryKeys.exams.detail(workspaceId, saved.id),
            });
            queryClient.setQueryData(queryKeys.exams.detail(workspaceId, saved.id), saved);
            setConfiguration(saved.configuration);
            setSettingsBaseline(saved);
            if (!existingExam) setCreatedExam(saved);
            setReason("");
            stage = "slots";
            await syncLocalSlots(saved);
            if (publishing) {
                stage = "publish";
                saved = await examApi.publish(
                    workspaceId,
                    saved.id,
                    saved.current_settings_version,
                );
                queryClient.setQueryData(queryKeys.exams.detail(workspaceId, saved.id), saved);
            }
            toast.success(
                publishing
                    ? "Экзамен опубликован"
                    : existingExam
                      ? "Изменения сохранены"
                      : "Черновик сохранён",
            );
            onSaved(saved);
        } catch (error) {
            const code = getExamErrorCode(error);
            // eslint-disable-next-line no-console
            console.error("Не удалось сохранить экзамен", error);
            const fallback = {
                settings: "Не удалось сохранить настройки экзамена",
                slots: "Не удалось сохранить слоты",
                publish: "Не удалось опубликовать экзамен",
            };
            const message =
                code === "settings_version_conflict"
                    ? "Настройки изменились. Загрузите актуальные настройки, чтобы продолжить."
                    : (getExamErrorMessage(error) ?? fallback[stage]);
            if (code === "settings_version_conflict") setSettingsConflict(true);
            if (code === "questions_not_ready") {
                if (await validateQuestions()) setQuestionErrors([message]);
                setActiveSection("questions");
            }
            toast.error(stage === "slots" ? `Настройки сохранены. ${message}` : message);
        } finally {
            if (saved) await invalidateExam(queryClient, workspaceId, saved.id);
            writeInProgress.current = false;
            setSaving(false);
        }
    };

    const validateQuestions = async () => {
        if (!configuration.project_type_ids.length) {
            setQuestionErrors(["Добавьте хотя бы один тип проекта и заполните вопросы для него."]);
            return false;
        }
        const results = await Promise.all(
            configuration.project_type_ids.map(async (typeId) => {
                try {
                    const data = await questionApi.get(workspaceId, typeId);
                    const expectedScores = Array.from(
                        { length: data.max_score },
                        (_, index) => index + data.min_score,
                    );
                    const invalid =
                        data.questions.length === 0 ||
                        data.questions.some(
                            (question) =>
                                !question.text.trim() ||
                                question.levels.length !== expectedScores.length ||
                                expectedScores.some(
                                    (score) =>
                                        !question.levels.some(
                                            (level) =>
                                                level.score === score && level.description.trim(),
                                        ),
                                ),
                        );
                    return invalid
                        ? `Проверьте вопросы типа «${projectTypes.find((type) => type.id === typeId)?.name ?? typeId}»: добавьте вопросы и заполните описания уровней ${data.min_score}–${data.max_score}.`
                        : null;
                } catch {
                    return "Не удалось проверить вопросы. Откройте раздел «Вопросы» и убедитесь, что обязательные поля заполнены.";
                }
            }),
        );
        const nextErrors = results.filter((item): item is string => Boolean(item));
        setQuestionErrors(nextErrors);
        return nextErrors.length === 0;
    };

    const canAddSlots =
        !saving &&
        !pendingTiming &&
        !exam?.archived_at &&
        !exam?.completed_at &&
        !slotsQuery.isLoading &&
        !slotsQuery.isError;

    const addSlots = (start: number, count: number) => {
        if (!canAddSlots) return;
        if (Date.now() >= start) {
            toast.error("Нельзя добавить слот на прошедшее время.");
            return;
        }
        if (
            !Number.isFinite(start) ||
            !Number.isInteger(expectedSlotMinutes) ||
            expectedSlotMinutes < 1 ||
            !Number.isInteger(count) ||
            count < 1 ||
            count > 100
        ) {
            toast.error("Проверьте время и длительность. За раз можно создать до 100 слотов.");
            return;
        }
        const duration = expectedSlotMinutes * minute;
        const candidates = Array.from({ length: count }, (_, index) => {
            const begins = start + index * duration;
            return {
                key: `new-${nextDraftSlotKey.current + index}`,
                starts_at: new Date(begins).toISOString(),
                ends_at: new Date(begins + duration).toISOString(),
            };
        });
        const error = slotScheduleError([...localSlots, ...candidates], configuration.starts_at);
        if (error) {
            toast.error(error);
            return;
        }
        nextDraftSlotKey.current += count;
        stageSchedule([...localSlots, ...candidates]);
        toast.success(count === 1 ? "Слот добавлен" : "Слоты добавлены в форму");
    };

    const appendSlot = () => {
        const start = localSlots.length
            ? Math.max(...localSlots.map((slot) => Date.parse(slot.ends_at)))
            : Date.parse(slotStart);
        addSlots(start, 1);
    };

    const applySchedule = (rows: LocalSlot[] | null) => {
        if (!rows) {
            toast.error("Изменение затрагивает защищённую строку расписания.");
            return false;
        }
        const error = slotScheduleError(rows, configuration.starts_at);
        if (error) {
            toast.error(error);
            return false;
        }
        stageSchedule(rows);
        return true;
    };

    const addBreak = (index: number) => {
        const key = `new-${nextDraftSlotKey.current}`;
        if (applySchedule(insertScheduleBreak(sortedLocalSlots, index, key, 10, slotStart))) {
            nextDraftSlotKey.current++;
        }
    };

    const assignedRegistrationBySlot = useMemo(() => {
        const result = new Map<number, Registration>();
        for (const registration of registrationsQuery.data?.items ?? []) {
            if (registration.status === "active" && registration.slot_id) {
                result.set(registration.slot_id, registration);
            }
        }
        return result;
    }, [registrationsQuery.data]);

    const savedSlots = slotsQuery.data?.items ?? [];
    const hasSlotGap = hasEarlierFreeSlots(savedSlots);
    const reviewAssignments = savedSlots.flatMap((slot) => {
        const registration = assignedRegistrationBySlot.get(slot.id);
        return registration ? [{ slot, registration }] : [];
    });

    const assignedProjectIds = useMemo(
        () =>
            new Set(
                (registrationsQuery.data?.items ?? [])
                    .filter((registration) => registration.status === "active")
                    .map((registration) => registration.project_id),
            ),
        [registrationsQuery.data],
    );

    const sortedLocalSlots = useMemo(
        () =>
            localSlots
                .slice()
                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
        [localSlots],
    );

    const cacheRegistration = (examId: number, registration: Registration) =>
        queryClient.setQueryData<RegistrationListResponse>(
            queryKeys.exams.registrations(workspaceId, examId),
            (current) => {
                if (!current) return current;
                const items = current.items.filter((item) => item.id !== registration.id);
                return { ...current, items: [...items, registration] };
            },
        );

    const moveTeam = async (fromId: number, toId: number) => {
        const registration = assignedRegistrationBySlot.get(fromId);
        const targetSlot = savedSlots.find((slot) => slot.id === toId);
        if (
            !exam ||
            !registration ||
            !targetSlot ||
            targetSlot.kind === "break" ||
            registration.started_at ||
            assignedRegistrationBySlot.has(toId) ||
            writeInProgress.current
        )
            return;
        setAssignOpenKey(null);
        writeInProgress.current = true;
        setPendingSlotId(toId);
        try {
            const result = await examApi.moveRegistration(
                workspaceId,
                exam.id,
                registration,
                toId,
                {
                    targetExamId: exam.id,
                    reason: "Перенос команды в другой слот",
                    expectedSlot: getSlotInterval(targetSlot),
                },
            );
            cacheRegistration(exam.id, result.target);
            toast.success("Команда перенесена");
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось перенести команду");
        } finally {
            await invalidateExam(queryClient, workspaceId, exam.id);
            writeInProgress.current = false;
            setPendingSlotId(null);
        }
    };

    const changeSlotAssignment = async (
        slot: LocalSlot,
        projectId?: number,
        expected?: Registration,
    ) => {
        if (!exam || !slot.id || slot.kind === "break" || scheduleEdit || writeInProgress.current)
            return;
        const existing = assignedRegistrationBySlot.get(slot.id);
        setAssignOpenKey(null);
        if (expected && (existing?.id !== expected.id || existing.version !== expected.version)) {
            toast.error("Запись команды изменилась. Проверьте слот и повторите замену.");
            return;
        }
        if (existing?.started_at || existing?.project_id === projectId) return;
        writeInProgress.current = true;
        setPendingSlotId(slot.id);
        try {
            if (existing && projectId) {
                await examApi.replaceRegistration(
                    workspaceId,
                    exam.id,
                    existing,
                    projectId,
                    getSlotInterval(slot),
                );
                toast.success("Команда заменена");
            } else if (existing) {
                const cancelled = await examApi.cancelRegistration(
                    workspaceId,
                    exam.id,
                    existing.id,
                    existing.version,
                    "Команда снята со слота",
                );
                cacheRegistration(exam.id, cancelled);
                toast.success("Команда снята со слота");
            } else if (projectId) {
                const registered = await examApi.register(workspaceId, exam.id, {
                    project_id: projectId,
                    slot_id: slot.id,
                    expected_slot: getSlotInterval(slot),
                });
                cacheRegistration(exam.id, registered);
                toast.success("Команда назначена");
            }
        } catch (error) {
            toast.error(getExamErrorMessage(error) ?? "Не удалось изменить команду в слоте");
        } finally {
            await invalidateExam(queryClient, workspaceId, exam.id);
            writeInProgress.current = false;
            setPendingSlotId(null);
        }
    };

    const startsDate = localDate(configuration.starts_at);
    const canChangeExamDates = !saving && !scheduleDatesLocked;

    const resetAllSlots = () => {
        setScheduleEdit(null);
        setSlotScheduleWarning("");
        setAssignOpenKey(null);
        setResetSlotsOpen(false);
        toast.success("Несохранённые слоты сброшены");
    };

    const renderQueueTable = () => {
        let defenseNumber = 0;
        return localSlots.length > 0 || canAddSlots ? (
            <div
                className={cn(
                    "min-h-0 overflow-auto rounded-[12px] border border-gray-200 dark:border-app-border",
                    queueExpanded && "flex-1",
                )}
            >
                <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead className="border-b border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost text-[12px] text-app-muted">
                        <tr>
                            <th className="px-3 py-3 font-semibold">№</th>
                            <th className="px-3 py-3 font-semibold">Начало</th>
                            <th className="px-3 py-3 font-semibold">Длительность</th>
                            <th className="px-3 py-3 font-semibold">Команда / проект</th>
                            <th className="px-3 py-3 font-semibold">Руководитель</th>
                            <th className="px-3 py-3 font-semibold">Статус назначения</th>
                            <th className="px-3 py-3 text-right font-semibold">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLocalSlots.map((slot, slotIndex) => {
                            const isBreak = slot.kind === "break";
                            const number = isBreak ? null : ++defenseNumber;
                            const canEditRow = canAddSlots && slot.can_edit !== false;
                            const rowDate = new Date(slot.starts_at);
                            const canDeleteRow = canAddSlots && slot.can_delete !== false;
                            const label = isBreak ? "перерыва" : `слота ${number}`;
                            const registration = slot.id
                                ? assignedRegistrationBySlot.get(slot.id)
                                : undefined;
                            const canMove = Boolean(
                                slot.id &&
                                registration &&
                                !registration.started_at &&
                                pendingSlotId === null &&
                                !saving &&
                                !scheduleEdit,
                            );
                            const project = registration
                                ? projectById.get(registration.project_id)
                                : undefined;
                            const durationMinutes = Math.round(
                                (new Date(slot.ends_at).getTime() -
                                    new Date(slot.starts_at).getTime()) /
                                    60000,
                            );
                            const availableProjects = (projectsQuery.data?.items ?? [])
                                .filter(
                                    (item) =>
                                        item.project_type_id != null &&
                                        exam?.configuration.project_type_ids.includes(
                                            item.project_type_id,
                                        ) &&
                                        (!assignedProjectIds.has(item.id) ||
                                            item.id === project?.id),
                                )
                                .filter((item) =>
                                    item.name
                                        .toLowerCase()
                                        .includes(projectSearch.trim().toLowerCase()),
                                );
                            return (
                                <tr
                                    key={slot.key}
                                    className="border-b border-gray-100 dark:border-app-border last:border-0 hover:bg-gray-50 dark:hover:bg-app-ghost"
                                    onDragOver={(event) => {
                                        if (
                                            !isBreak &&
                                            slot.id &&
                                            !registration &&
                                            draggedSlotId.current &&
                                            !scheduleEdit
                                        )
                                            event.preventDefault();
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        if (
                                            !isBreak &&
                                            slot.id &&
                                            draggedSlotId.current &&
                                            !scheduleEdit
                                        )
                                            void moveTeam(draggedSlotId.current, slot.id);
                                        draggedSlotId.current = null;
                                    }}
                                >
                                    <td className="px-3 py-3 text-[13px] text-app-muted">
                                        <div className="flex items-center gap-1">
                                            {slot.id && registration && (
                                                <button
                                                    type="button"
                                                    draggable={canMove}
                                                    disabled={!canMove}
                                                    aria-label={`Перенести команду из слота ${number}. Используйте стрелки вверх и вниз.`}
                                                    className="cursor-grab text-app-muted active:cursor-grabbing disabled:cursor-default"
                                                    onDragStart={(event) => {
                                                        if (!slot.id) return;
                                                        draggedSlotId.current = slot.id;
                                                        event.dataTransfer.setData(
                                                            "text/plain",
                                                            String(slot.id),
                                                        );
                                                        event.dataTransfer.effectAllowed = "move";
                                                    }}
                                                    onDragEnd={() => {
                                                        draggedSlotId.current = null;
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (
                                                            !slot.id ||
                                                            (event.key !== "ArrowUp" &&
                                                                event.key !== "ArrowDown")
                                                        )
                                                            return;
                                                        event.preventDefault();
                                                        const candidates =
                                                            event.key === "ArrowUp"
                                                                ? sortedLocalSlots
                                                                      .slice(0, slotIndex)
                                                                      .reverse()
                                                                : sortedLocalSlots.slice(
                                                                      slotIndex + 1,
                                                                  );
                                                        const target = candidates.find(
                                                            (item) =>
                                                                item.id &&
                                                                item.kind !== "break" &&
                                                                !assignedRegistrationBySlot.has(
                                                                    item.id,
                                                                ),
                                                        );
                                                        if (target?.id)
                                                            void moveTeam(slot.id, target.id);
                                                    }}
                                                >
                                                    <GripVertical size={16} />
                                                </button>
                                            )}
                                            {number ?? "—"}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="text-[13px] font-semibold text-app-text">
                                            {formatScheduleTime(
                                                slot.starts_at,
                                                configuration.starts_at,
                                            )}
                                        </div>
                                        {canEditRow && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <Input
                                                    type="date"
                                                    className="h-9 w-[131px] rounded-[10px] px-2 text-[12px]"
                                                    key={`date-${slot.starts_at}`}
                                                    aria-label={`Дата ${label}`}
                                                    defaultValue={rowDate.toLocaleDateString(
                                                        "sv-SE",
                                                    )}
                                                    onBlur={(event) => {
                                                        const input = event.currentTarget;
                                                        if (!input.value)
                                                            input.value = input.defaultValue;
                                                        if (input.value === input.defaultValue)
                                                            return;
                                                        const [year, month, day] = input.value
                                                            .split("-")
                                                            .map(Number);
                                                        const date = new Date(rowDate);
                                                        date.setFullYear(year, month - 1, day);
                                                        if (
                                                            !applySchedule(
                                                                updateScheduleSlot(
                                                                    sortedLocalSlots,
                                                                    slot.key,
                                                                    date.toISOString(),
                                                                ),
                                                            )
                                                        ) {
                                                            input.value = input.defaultValue;
                                                        }
                                                    }}
                                                />
                                                <Input
                                                    type="time"
                                                    className="h-9 w-[103px] rounded-[10px] px-2 text-[12px]"
                                                    key={`time-${slot.starts_at}`}
                                                    aria-label={`Начало ${label}`}
                                                    defaultValue={rowDate
                                                        .toTimeString()
                                                        .slice(0, 5)}
                                                    onBlur={(event) => {
                                                        const input = event.currentTarget;
                                                        if (!input.value)
                                                            input.value = input.defaultValue;
                                                        if (input.value === input.defaultValue)
                                                            return;
                                                        const start = slotStartAtTime(
                                                            slot.starts_at,
                                                            input.value,
                                                        );
                                                        if (
                                                            !applySchedule(
                                                                updateScheduleSlot(
                                                                    sortedLocalSlots,
                                                                    slot.key,
                                                                    start.toISOString(),
                                                                ),
                                                            )
                                                        ) {
                                                            input.value = input.defaultValue;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-[13px] text-gray-600 dark:text-app-muted">
                                        {isBreak && canEditRow ? (
                                            <Input
                                                key={slot.ends_at}
                                                type="number"
                                                min={1}
                                                max={1440}
                                                className="h-9 w-20 px-2 text-[12px]"
                                                aria-label="Длительность перерыва, минут"
                                                defaultValue={durationMinutes}
                                                onBlur={(event) => {
                                                    const input = event.currentTarget;
                                                    if (input.value === input.defaultValue) return;
                                                    const duration = input.valueAsNumber;
                                                    if (
                                                        !Number.isInteger(duration) ||
                                                        duration < 1 ||
                                                        duration > 1440
                                                    ) {
                                                        toast.error(
                                                            "Укажите длительность перерыва от 1 до 1440 минут.",
                                                        );
                                                        input.value = input.defaultValue;
                                                        return;
                                                    }
                                                    if (
                                                        !applySchedule(
                                                            updateScheduleSlot(
                                                                sortedLocalSlots,
                                                                slot.key,
                                                                slot.starts_at,
                                                                duration * minute,
                                                            ),
                                                        )
                                                    ) {
                                                        input.value = input.defaultValue;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            `${durationMinutes} мин.`
                                        )}
                                        <span className="block text-[11px] text-app-muted">
                                            до{" "}
                                            {formatScheduleTime(
                                                slot.ends_at,
                                                configuration.starts_at,
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        {isBreak ? (
                                            <span className="font-medium text-app-text">
                                                Перерыв
                                            </span>
                                        ) : project ? (
                                            <span className="font-medium text-app-text">
                                                {project.name}
                                            </span>
                                        ) : (
                                            <span className="text-[13px] text-app-muted">
                                                {registration
                                                    ? "Команда назначена"
                                                    : "Не назначена"}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 text-[13px] text-gray-600 dark:text-app-muted">
                                        {registration
                                            ? (getExamProjectLeader(project) ?? "Имя не указано")
                                            : "—"}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span
                                            className={cn(
                                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                                                registration
                                                    ? "bg-[--status-completed-bg] text-emerald-700 dark:text-emerald-300"
                                                    : "bg-gray-100 dark:bg-app-ghost text-gray-600 dark:text-app-muted",
                                            )}
                                        >
                                            {isBreak
                                                ? "—"
                                                : registration
                                                  ? "Назначена"
                                                  : "Не назначена"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex w-max max-w-[144px] flex-wrap justify-end gap-1 sm:max-w-none">
                                            {!isBreak &&
                                                exam?.status === "published" &&
                                                slot.id &&
                                                !registration?.started_at && (
                                                    <ExamProjectSelect
                                                        open={assignOpenKey === slot.key}
                                                        onOpenChange={(open) => {
                                                            setAssignOpenKey((current) =>
                                                                open
                                                                    ? slot.key
                                                                    : current === slot.key
                                                                      ? null
                                                                      : current,
                                                            );
                                                            if (open) setProjectSearch("");
                                                        }}
                                                        label={
                                                            registration ? "Заменить" : "Назначить"
                                                        }
                                                        disabled={
                                                            pendingSlotId !== null ||
                                                            saving ||
                                                            Boolean(scheduleEdit)
                                                        }
                                                        container={
                                                            queueExpanded
                                                                ? queueDialogRef
                                                                : undefined
                                                        }
                                                        search={projectSearch}
                                                        onSearch={setProjectSearch}
                                                        projects={availableProjects}
                                                        selectedId={project?.id}
                                                        onSelect={(projectId) => {
                                                            if (
                                                                registration?.queue_hold &&
                                                                registration.project_id !==
                                                                    projectId
                                                            ) {
                                                                setAssignOpenKey(null);
                                                                setReplacement({
                                                                    slot,
                                                                    projectId,
                                                                    registration,
                                                                });
                                                            } else {
                                                                void changeSlotAssignment(
                                                                    slot,
                                                                    projectId,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                )}
                                            {registration &&
                                                !registration.started_at &&
                                                slot.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="hug36"
                                                        disabled={
                                                            pendingSlotId !== null ||
                                                            saving ||
                                                            Boolean(scheduleEdit)
                                                        }
                                                        onClick={() => changeSlotAssignment(slot)}
                                                    >
                                                        Убрать
                                                    </Button>
                                                )}
                                            {isBreak ? (
                                                (
                                                    [
                                                        [-1, "Выше", ArrowUp],
                                                        [1, "Ниже", ArrowDown],
                                                    ] as const
                                                ).map(([direction, title, Icon]) => (
                                                    <Button
                                                        key={direction}
                                                        variant="ghost"
                                                        size="hug36"
                                                        icon={<Icon size={16} />}
                                                        aria-label={`Переместить перерыв ${title.toLowerCase()}`}
                                                        disabled={
                                                            !canEditRow ||
                                                            !sortedLocalSlots[
                                                                slotIndex + direction
                                                            ] ||
                                                            sortedLocalSlots[slotIndex + direction]
                                                                .can_edit === false
                                                        }
                                                        onClick={() =>
                                                            applySchedule(
                                                                moveScheduleBreak(
                                                                    sortedLocalSlots,
                                                                    slot.key,
                                                                    direction,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                ))
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="hug36"
                                                    disabled={!canEditRow}
                                                    icon={<Coffee size={16} />}
                                                    aria-label="Перерыв до слота"
                                                    title="Вставить перерыв перед слотом"
                                                    onClick={() => addBreak(slotIndex)}
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    applySchedule(
                                                        removeScheduleSlot(
                                                            sortedLocalSlots,
                                                            slot.key,
                                                        ),
                                                    )
                                                }
                                                disabled={!canDeleteRow}
                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted hover:bg-[--error-bg] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label={
                                                    isBreak ? "Удалить перерыв" : "Удалить слот"
                                                }
                                                title={
                                                    canDeleteRow
                                                        ? undefined
                                                        : "Строка защищена или имеет историю записей"
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {canAddSlots && (
                            <tr className="border-t border-gray-200 dark:border-app-border">
                                <td colSpan={7} className="p-0">
                                    <button
                                        type="button"
                                        disabled={!canAddSlots}
                                        onClick={appendSlot}
                                        className="sticky left-0 flex w-fit cursor-pointer items-center gap-2 px-3 py-3 text-[13px] font-medium text-app-blue dark:text-blue-300 hover:bg-app-badge-blue disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Plus aria-hidden="true" size={16} />
                                        Добавить слот
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="hug36"
                                        onClick={() => addBreak(sortedLocalSlots.length)}
                                    >
                                        Добавить перерыв
                                    </Button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-app-border p-8 text-center text-[13px] text-app-muted">
                Слоты появятся здесь после генерации.
            </div>
        );
    };

    return (
        <div className="overflow-hidden rounded-[20px] border border-gray-200 dark:border-app-border bg-app-surface">
            <header className="flex items-center justify-between border-b border-gray-200 dark:border-app-border px-5 py-4">
                <div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving || pendingSlotId !== null}
                        className="mb-1 flex cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 items-center gap-1 text-[13px] text-app-muted hover:text-app-text"
                    >
                        <ChevronLeft size={14} /> Отмена
                    </button>
                    <h1 className="text-[22px] font-bold text-app-text [overflow-wrap:anywhere]">
                        {exam
                            ? `Редактирование экзамена · ${workspaceName}`
                            : workspaceId
                              ? `Создание экзамена для пространства «${workspaceName}»`
                              : "Создание экзамена"}
                    </h1>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-app-ghost px-3 py-1 text-[12px] font-medium text-gray-600 dark:text-app-muted">
                    {exam?.status === "published" ? "Опубликован" : "Черновик"}
                </span>
            </header>

            <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="border-b border-gray-200 dark:border-app-border p-3 lg:border-b-0 lg:border-r">
                    <nav aria-label="Разделы формы экзамена" className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                aria-current={activeSection === section.id ? "step" : undefined}
                                onClick={() => setActiveSection(section.id)}
                                className={cn(
                                    "flex h-10 w-full cursor-pointer items-center justify-between rounded-[10px] px-3 text-left text-[13px] font-medium transition",
                                    activeSection === section.id
                                        ? "bg-app-text text-app-background"
                                        : "text-gray-600 dark:text-app-muted hover:bg-gray-100 dark:hover:bg-app-ghost",
                                )}
                            >
                                {section.label}
                                {sectionErrors[section.id] && (
                                    <AlertCircle
                                        size={14}
                                        className="text-red-600 dark:text-red-300"
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                <fieldset disabled={saving} className="min-h-[520px] min-w-0 p-5 sm:p-6">
                    {activeSection === "main" && (
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <Label htmlFor="exam-title">Название *</Label>
                                <Input
                                    id="exam-title"
                                    value={configuration.title}
                                    error={Boolean(visibleError("title"))}
                                    helperText={visibleError("title")}
                                    onBlur={() => touch("title")}
                                    onChange={(event) => update("title", event.target.value)}
                                    placeholder="Например: Защита продуктовых проектов"
                                />
                            </div>
                            <div>
                                <Label>Дисциплина / пространство</Label>
                                {exam ? (
                                    <Input value={workspaceName} disabled />
                                ) : (
                                    <div ref={workspaceField} className="relative">
                                        <select
                                            ref={workspaceSelect}
                                            aria-label="Дисциплина / пространство"
                                            aria-controls={
                                                pendingWorkspaceId !== null
                                                    ? "exam-workspace-confirmation"
                                                    : undefined
                                            }
                                            value={pendingWorkspaceId ?? (workspaceId || "")}
                                            onChange={(event) => {
                                                const next = Number(event.target.value);
                                                setPendingWorkspaceId(
                                                    next === workspaceId ? null : next,
                                                );
                                            }}
                                            className="mt-1 h-10 w-full cursor-pointer rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface px-3 text-[13px]"
                                        >
                                            <option disabled value="">
                                                Выберите пространство
                                            </option>
                                            {workspaces.map((workspace) => (
                                                <option key={workspace.id} value={workspace.id}>
                                                    {workspace.title}
                                                </option>
                                            ))}
                                        </select>
                                        {pendingWorkspaceId !== null && (
                                            <div
                                                id="exam-workspace-confirmation"
                                                role="dialog"
                                                aria-label="Подтверждение смены пространства"
                                                className="absolute left-0 top-full z-30 mt-2 w-full max-w-xs rounded-xl border border-gray-200 dark:border-app-border bg-app-surface p-4 shadow-lg"
                                            >
                                                <p className="text-[13px] text-app-text">
                                                    Название, дата и время сохранятся. Остальные
                                                    поля, выбранные типы проектов и слоты будут
                                                    сброшены. Продолжить?
                                                </p>
                                                <div className="mt-3 flex flex-wrap justify-end gap-2">
                                                    <Button
                                                        ref={workspaceCancel}
                                                        variant="outline"
                                                        size="hug36"
                                                        onClick={() => {
                                                            setPendingWorkspaceId(null);
                                                            workspaceSelect.current?.focus();
                                                        }}
                                                    >
                                                        Отмена
                                                    </Button>
                                                    <Button
                                                        variant="blue"
                                                        size="hug36"
                                                        onClick={() => {
                                                            if (pendingWorkspaceId === null) return;
                                                            onWorkspaceChange?.(
                                                                pendingWorkspaceId,
                                                                {
                                                                    title: configuration.title,
                                                                    starts_at:
                                                                        configuration.starts_at,
                                                                },
                                                            );
                                                            setPendingWorkspaceId(null);
                                                            toast.success(
                                                                "Название, дата и время сохранены. Остальные поля сброшены.",
                                                            );
                                                        }}
                                                    >
                                                        Продолжить
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="exam-url">Ссылка на подключение</Label>
                                <Input
                                    id="exam-url"
                                    value={configuration.connection_url ?? ""}
                                    error={Boolean(visibleError("connection_url"))}
                                    helperText={visibleError("connection_url")}
                                    onBlur={() => touch("connection_url")}
                                    onChange={(event) =>
                                        update("connection_url", event.target.value || null)
                                    }
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="exam-start-time">Дата и время начала *</Label>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <DatePicker
                                        value={startsDate}
                                        disabled={!canChangeExamDates}
                                        onChange={(date) => {
                                            const current = startsDate;
                                            date.setHours(
                                                current.getHours(),
                                                current.getMinutes(),
                                                0,
                                                0,
                                            );
                                            update("starts_at", date.toISOString());
                                        }}
                                        className="h-10 min-w-[180px] justify-between rounded-[12px] border border-gray-200 dark:border-app-border px-3 text-[13px] hover:border-gray-300 dark:hover:border-slate-500"
                                    />
                                    <Input
                                        id="exam-start-time"
                                        type="time"
                                        disabled={!canChangeExamDates}
                                        value={startsDate.toTimeString().slice(0, 5)}
                                        onChange={(event) => {
                                            if (!event.target.value) return;
                                            const [hours, minutes] = event.target.value
                                                .split(":")
                                                .map(Number);
                                            const date = localDate(configuration.starts_at);
                                            date.setHours(hours, minutes, 0, 0);
                                            update("starts_at", date.toISOString());
                                        }}
                                        className="h-10 w-[112px] rounded-[12px] px-3 text-[13px]"
                                    />
                                </div>
                                {visibleError("starts_at") && (
                                    <p className="mt-1 text-[12px] text-red-600 dark:text-red-300">
                                        {visibleError("starts_at")}
                                    </p>
                                )}
                                {scheduleDatesLocked ? (
                                    <p className="mt-1 text-[12px] text-app-muted">
                                        После начала экзамена сроки изменить нельзя.
                                    </p>
                                ) : (
                                    Boolean(serverSlots?.length) && (
                                        <p className="mt-1 text-[12px] text-app-muted">
                                            Новое начало должно быть не позже первого сохранённого
                                            слота. Сохранённые слоты останутся на прежнее время.
                                        </p>
                                    )
                                )}
                            </div>
                            <fieldset className="grid gap-3 md:col-span-2 sm:grid-cols-2">
                                <legend className="mb-2 text-sm font-medium text-app-text">
                                    Период записи
                                </legend>
                                {registrationFields.map(({ key, label }) => {
                                    const value = configuration[key];
                                    const date = value ? new Date(value) : null;
                                    const error = visibleError(key);
                                    const disabled = !canChangeExamDates;
                                    const change = (next: string | null) => {
                                        update(key, next);
                                        touch(key);
                                    };
                                    return (
                                        <div
                                            key={key}
                                            className="min-w-0"
                                            role="group"
                                            aria-label={label}
                                        >
                                            <Label htmlFor={key}>{label}</Label>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <DatePicker
                                                    value={date}
                                                    disabled={disabled}
                                                    placeholder="Выберите дату"
                                                    className="h-10 min-w-[180px] justify-between rounded-[12px] border border-app-border px-3"
                                                    onChange={(next) => {
                                                        next.setHours(
                                                            date?.getHours() ?? 0,
                                                            date?.getMinutes() ?? 0,
                                                            0,
                                                            0,
                                                        );
                                                        change(next.toISOString());
                                                    }}
                                                />
                                                <Input
                                                    id={key}
                                                    type="time"
                                                    disabled={disabled || !date}
                                                    aria-label={`Время: ${label.toLowerCase()}`}
                                                    className="h-10 w-[112px] rounded-[12px] px-3 text-[13px]"
                                                    value={date?.toTimeString().slice(0, 5) ?? ""}
                                                    onChange={(event) => {
                                                        if (!date || !event.target.value) return;
                                                        const [hours, minutes] = event.target.value
                                                            .split(":")
                                                            .map(Number);
                                                        date.setHours(hours, minutes, 0, 0);
                                                        change(date.toISOString());
                                                    }}
                                                />
                                                {date && !disabled && (
                                                    <DatePickerClearButton
                                                        onClick={() => change(null)}
                                                    />
                                                )}
                                            </div>
                                            {error && (
                                                <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                                                    {error}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                                <p className="text-xs text-app-muted sm:col-span-2">
                                    Без указанных дат запись доступна с публикации до начала
                                    экзамена.
                                </p>
                            </fieldset>
                            <div>
                                <Label htmlFor="exam-score">Максимальный балл</Label>
                                <Input
                                    id="exam-score"
                                    error={Boolean(visibleError("max_score"))}
                                    helperText={visibleError("max_score")}
                                    onBlur={() => touch("max_score")}
                                    type="number"
                                    min={0.01}
                                    step="0.01"
                                    value={configuration.max_score}
                                    onChange={(event) =>
                                        update("max_score", Number(event.target.value))
                                    }
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="exam-description">Описание</Label>
                                <Textarea
                                    id="exam-description"
                                    rows={4}
                                    value={configuration.description ?? ""}
                                    error={Boolean(visibleError("description"))}
                                    helperText={visibleError("description")}
                                    onBlur={() => touch("description")}
                                    onChange={(event) => update("description", event.target.value)}
                                    placeholder="Опишите цель и формат экзамена"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Типы проектов *</Label>
                                {!workspaceId ? (
                                    <p className="mt-2 rounded-lg bg-gray-50 dark:bg-app-ghost px-3 py-2 text-[13px] text-app-muted">
                                        Сначала выберите пространство.
                                    </p>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {projectTypes.map((type) => {
                                            const selected =
                                                configuration.project_type_ids.includes(type.id);
                                            return (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    disabled={exam?.status === "published"}
                                                    aria-pressed={selected}
                                                    onBlur={() => touch("project_type_ids")}
                                                    onClick={() => {
                                                        update(
                                                            "project_type_ids",
                                                            selected
                                                                ? configuration.project_type_ids.filter(
                                                                      (id) => id !== type.id,
                                                                  )
                                                                : [
                                                                      ...configuration.project_type_ids,
                                                                      type.id,
                                                                  ],
                                                        );
                                                        setQuestionErrors([]);
                                                    }}
                                                    className={cn(
                                                        "h-8 rounded-full border px-3 text-[13px] font-medium",
                                                        selected
                                                            ? "border-app-blue bg-app-badge-blue text-app-blue dark:text-blue-300"
                                                            : "border-gray-200 dark:border-app-border text-gray-600 dark:text-app-muted hover:border-gray-300 dark:hover:border-slate-500",
                                                        exam?.status === "published" &&
                                                            "cursor-not-allowed opacity-60",
                                                    )}
                                                >
                                                    {type.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {configuration.project_type_ids.length > 0 && (
                                    <p className="mt-2 text-[12px] text-app-muted">
                                        При смене типов проектов список вопросов и критериев
                                        обновится.
                                    </p>
                                )}
                                {visibleError("project_type_ids") && (
                                    <p className="mt-2 text-[12px] text-red-600 dark:text-red-300">
                                        {visibleError("project_type_ids")}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === "questions" && (
                        <div className="space-y-5">
                            {questionErrors.length > 0 && (
                                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-[--error-bg] p-4 text-[13px] text-red-800 dark:text-red-200">
                                    <p className="font-semibold">Нельзя опубликовать экзамен</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        {questionErrors.map((error) => (
                                            <li key={error}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="rounded-xl border border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost p-4 text-[13px] text-app-text">
                                <p className="font-semibold">Откуда берутся критерии</p>
                                <div className="mt-2 space-y-1 text-app-muted">
                                    <p>
                                        {selectedTypeNames ? (
                                            <>
                                                Критерии берутся из выбранных типов проектов:{" "}
                                                <strong>{selectedTypeNames}</strong>.
                                            </>
                                        ) : configuration.project_type_ids.length ? (
                                            "Критерии берутся из выбранных типов проектов."
                                        ) : (
                                            "Выберите типы проектов в разделе «Основное», чтобы увидеть их критерии."
                                        )}
                                    </p>
                                    <p>
                                        Критерии общие для всех экзаменов с этими типами. Если
                                        сохранить правки здесь, они появятся и в других экзаменах.
                                    </p>
                                    <p>При смене типа проекта список критериев обновится.</p>
                                    <p>
                                        Шаблон заполняет критерии выбранного типа проекта. Отдельно
                                        он не сохраняется.
                                    </p>
                                    <p>
                                        У экзамена нет отдельного набора критериев. Чтобы сохранить
                                        правки, нажмите «Сохранить вопросы» у нужного типа.
                                    </p>
                                </div>
                            </div>
                            {configuration.project_type_ids.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 dark:border-app-border p-8 text-center text-[13px] text-app-muted">
                                    Сначала выберите хотя бы один тип проекта в разделе «Основное».
                                </div>
                            ) : (
                                configuration.project_type_ids.map((typeId) => {
                                    const type = projectTypes.find((item) => item.id === typeId);
                                    return (
                                        <div key={typeId}>
                                            <h3 className="mb-3 text-[16px] font-semibold text-app-text">
                                                {type?.name ?? `Тип проекта ${typeId}`}
                                            </h3>
                                            {assessmentQueue.isLoading ? (
                                                <Spinner />
                                            ) : exam ? (
                                                <ProjectTypeQuestionsEditor
                                                    workspaceId={workspaceId}
                                                    typeId={typeId}
                                                    assessmentOpened={assessedTypes.has(typeId)}
                                                    typeName={type?.name ?? `Тип проекта ${typeId}`}
                                                />
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-gray-300 dark:border-app-border p-5 text-[13px] text-app-muted">
                                                    Сохраните черновик, чтобы добавить и привязать
                                                    вопросы к типу проекта.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeSection === "queue" && (
                        <div className="space-y-5">
                            <p className="text-[13px] font-semibold text-app-text">
                                Время на одну команду
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {slotFields.map(([key, label]) => (
                                    <div key={key}>
                                        <Label htmlFor={key}>{label}, мин.</Label>
                                        <Input
                                            id={key}
                                            type="number"
                                            min={key === "presentation_minutes" ? 1 : 0}
                                            value={(pendingTiming ?? timing)[key]}
                                            error={Boolean(visibleError("durations"))}
                                            onBlur={() => touch("durations")}
                                            onChange={(event) =>
                                                changeTiming(key, Number(event.target.value))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[12px] text-app-muted">
                                Длительность слота: {expectedSlotMinutes} мин. · выступление +
                                вопросы + переход.
                            </p>
                            {pendingTiming && (
                                <div className="space-y-2 rounded-xl border border-app-border bg-app-badge-blue p-3 text-[13px] text-app-text">
                                    <p aria-live="polite">
                                        {!validTiming
                                            ? "Проверьте время на команду: укажите целые минуты, выступление не короче минуты."
                                            : timingError ||
                                              (proposedSchedule && draftSlots.length
                                                  ? `Будут пересчитаны несохранённые слоты: ${draftSlots.length}. Длительность — ${nextSlotMinutes} мин., новое время окончания — ${scheduleEnd(proposedSchedule, configuration.starts_at)}.`
                                                  : `Новая длительность слота — ${nextSlotMinutes} мин.`)}
                                    </p>
                                    {localSlots.some((slot) => slot.id) && (
                                        <p>Время уже сохранённых слотов останется прежним.</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="blue"
                                            size="hug36"
                                            disabled={!proposedSlots || Boolean(timingError)}
                                            onClick={() => {
                                                if (!proposedSlots || timingError) return;
                                                if (proposedSchedule && draftSlots.length)
                                                    stageSchedule(proposedSchedule);
                                                applyTiming(pendingTiming);
                                                setSlotScheduleWarning(
                                                    draftSlots.length
                                                        ? `Несохранённые слоты пересчитаны: ${draftSlots.length}.`
                                                        : "",
                                                );
                                            }}
                                        >
                                            Применить
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="hug36"
                                            onClick={() => setPendingTiming(null)}
                                        >
                                            Отменить пересчёт
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {visibleError("durations") && (
                                <p className="text-[12px] text-red-600 dark:text-red-300">
                                    {visibleError("durations")}
                                </p>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="min-w-0">
                                    <Label className="block min-h-10 leading-5">
                                        Начало слотов
                                    </Label>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <div className="flex h-10 min-w-[180px] flex-1 items-center rounded-[12px] border border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost px-3 text-[13px] text-gray-600 dark:text-app-muted">
                                            {new Date(configuration.starts_at).toLocaleDateString(
                                                "ru-RU",
                                                {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                },
                                            )}
                                        </div>
                                        <Input
                                            type="time"
                                            disabled={!canAddSlots}
                                            className="h-10 w-[112px] rounded-[12px] px-3 text-[13px]"
                                            aria-label="Начало слотов"
                                            value={new Date(slotStart).toTimeString().slice(0, 5)}
                                            onChange={(event) => {
                                                if (!event.target.value) return;
                                                const date = slotStartAtTime(
                                                    configuration.starts_at,
                                                    event.target.value,
                                                );
                                                setSlotStart(date.toISOString());
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <Label className="block min-h-10 leading-5">Количество</Label>
                                    <Input
                                        className="w-full"
                                        type="number"
                                        min={1}
                                        max={100}
                                        disabled={!canAddSlots}
                                        value={slotCount}
                                        onChange={(event) =>
                                            setSlotCount(Number(event.target.value))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[12px]">
                                <span className="rounded-full bg-gray-100 dark:bg-app-ghost px-3 py-1.5">
                                    Всего выступлений: {defenseSlots.length}
                                </span>
                                <span className="rounded-full bg-gray-100 dark:bg-app-ghost px-3 py-1.5">
                                    Окончание: {scheduleEnd(localSlots, configuration.starts_at)}
                                </span>
                                <span className="rounded-full bg-gray-100 dark:bg-app-ghost px-3 py-1.5">
                                    Назначено команд: {assignedRegistrationBySlot.size} из{" "}
                                    {defenseSlots.length}
                                </span>
                                <span className="rounded-full bg-gray-100 dark:bg-app-ghost px-3 py-1.5">
                                    Не назначено:{" "}
                                    {Math.max(
                                        0,
                                        defenseSlots.length - assignedRegistrationBySlot.size,
                                    )}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    icon={<CalendarClock size={16} />}
                                    disabled={!canAddSlots}
                                    onClick={() => addSlots(Date.parse(slotStart), slotCount)}
                                >
                                    Сгенерировать слоты
                                </Button>
                                {scheduleEdit && (
                                    <Button
                                        variant="outline"
                                        size="hug36"
                                        disabled={saving}
                                        onClick={() => setResetSlotsOpen(true)}
                                    >
                                        {slotsQuery.data?.items.length
                                            ? "Сбросить изменения расписания"
                                            : "Сбросить все слоты"}
                                    </Button>
                                )}
                            </div>
                            <Dialog
                                open={queueExpanded}
                                onOpenChange={(open) => {
                                    setAssignOpenKey(null);
                                    setQueueExpanded(open);
                                }}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-[13px] font-semibold text-app-text">
                                        Очередь выступлений
                                    </h3>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="hug36"
                                            aria-label="Расширить таблицу очереди"
                                            title="Расширить таблицу"
                                            className="cursor-pointer !px-2.5"
                                        >
                                            <Maximize2 aria-hidden="true" size={16} />
                                        </Button>
                                    </DialogTrigger>
                                </div>
                                {!queueExpanded && renderQueueTable()}
                                <DialogContent
                                    ref={queueDialogRef}
                                    onEscapeKeyDown={(event) => {
                                        if (assignOpenKey === null) return;
                                        event.preventDefault();
                                        setAssignOpenKey(null);
                                    }}
                                    className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-4 p-3 sm:p-6"
                                >
                                    <DialogHeader className="shrink-0 pr-8 text-left">
                                        <DialogTitle>Очередь выступлений</DialogTitle>
                                    </DialogHeader>
                                    {queueExpanded && renderQueueTable()}
                                </DialogContent>
                            </Dialog>
                            {exam?.status !== "published" && (
                                <p className="text-[12px] text-app-muted">
                                    Слоты сохраняются вместе с черновиком. Команды можно назначать
                                    после публикации.
                                </p>
                            )}
                        </div>
                    )}

                    {activeSection === "assessment" && (
                        <div className="space-y-5">
                            <div className="grid gap-4 md:grid-cols-3">
                                {(
                                    [
                                        ["teacher", "Комиссия / преподаватели"],
                                        ["manager", "Менеджеры / магистранты"],
                                        ["member", " Участники / бакалавры"],
                                    ] as const
                                ).map(([key, label]) => (
                                    <div key={key}>
                                        <Label>{label}, вес</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={configuration.weights[key]}
                                            error={Boolean(visibleError("weights"))}
                                            onBlur={() => touch("weights")}
                                            onChange={(event) =>
                                                update("weights", {
                                                    ...configuration.weights,
                                                    [key]: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                            {visibleError("weights") && (
                                <p className="text-[12px] text-red-600 dark:text-red-300">
                                    {visibleError("weights")}
                                </p>
                            )}
                            <div className="max-w-56">
                                <Label htmlFor="exam-assessment-window">
                                    Окно оценивания, мин.
                                </Label>
                                <Input
                                    id="exam-assessment-window"
                                    type="number"
                                    min={1}
                                    value={configuration.assessment_window_minutes}
                                    error={Boolean(visibleError("assessment_window_minutes"))}
                                    helperText={visibleError("assessment_window_minutes")}
                                    onBlur={() => touch("assessment_window_minutes")}
                                    onChange={(event) =>
                                        update(
                                            "assessment_window_minutes",
                                            Number(event.target.value),
                                        )
                                    }
                                />
                                <p className="mt-1 text-[12px] text-app-muted">
                                    Время на выставление оценок. В длительность слота не входит.
                                </p>
                            </div>
                            <div className="rounded-xl border border-app-border bg-app-badge-blue p-4 text-[13px] text-app-text">
                                <p className="font-semibold">Как считается оценка</p>
                                <div className="mt-2 space-y-1.5">
                                    <p>
                                        Максимум листа — сумма максимальных баллов по критериям. Для
                                        пяти критериев шкала 1–3 даёт 15 баллов, а шкала 1–5 — 25.
                                    </p>
                                    <p>
                                        Средние баллы комиссии, магистрантов и бакалавров объединяют
                                        с учётом весов. В расчёт входят группы с отправленными
                                        оценками и весом больше нуля. Их веса пропорционально
                                        пересчитывают до 100%.
                                    </p>
                                    <p>
                                        Чтобы получить итог, балл делят на максимум за лист и
                                        умножают на максимум экзамена. Если подходящих оценок нет,
                                        итог не рассчитывается.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "review" && (
                        <div className="space-y-4">
                            {exam?.status === "published" && (
                                <Link
                                    to={paths.app.examView.getHref(workspaceId, exam.id)}
                                    className="inline-flex rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-app-blue hover:bg-app-ghost dark:text-blue-300"
                                >
                                    Перейти на страницу экзамена
                                </Link>
                            )}
                            {Object.keys(errors).length === 0 ? (
                                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-[--status-completed-bg] p-4 text-[13px] text-emerald-800 dark:text-emerald-300">
                                    Основные настройки заполнены. Перед публикацией проверьте
                                    вопросы и слоты.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.values(errors).map((error) => (
                                        <div
                                            key={error}
                                            className="flex items-center gap-2 rounded-lg bg-[--error-bg] px-3 py-2 text-[13px] text-red-700 dark:text-red-200"
                                        >
                                            <AlertCircle size={14} /> {error}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-[13px] text-app-muted">
                                Расчёт на команду: {timing.presentation_minutes} +{" "}
                                {timing.questions_minutes} + {timing.transition_minutes} ={" "}
                                {expectedSlotMinutes} мин. Окончание по расписанию:{" "}
                                {scheduleEnd(localSlots, configuration.starts_at)}.
                            </p>
                            {scheduleMismatch.length > 0 && (
                                <div className="rounded-xl border border-app-border bg-app-badge-amber p-4 text-[13px] text-app-badge-amber-fg">
                                    <p className="font-semibold">Проверьте длительность слотов</p>
                                    <p className="mt-1">
                                        {scheduleMismatch.length}{" "}
                                        {scheduleMismatch.length === 1
                                            ? "слот отличается"
                                            : "слота отличаются"}{" "}
                                        от расчёта выступление + вопросы + переход (
                                        {expectedSlotMinutes} мин.).
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("queue")}
                                        className="mt-3 cursor-pointer font-semibold text-app-blue dark:text-blue-300 hover:underline"
                                    >
                                        Перейти к слотам
                                    </button>
                                </div>
                            )}
                            {hasSlotGap && (
                                <div className="rounded-xl border border-app-border bg-app-badge-amber p-4 text-[13px] text-app-badge-amber-fg">
                                    <p className="font-semibold">
                                        Есть свободные слоты раньше записанных
                                    </p>
                                    <p className="mt-1">
                                        К плановому началу экзамена пустые слоты автоматически
                                        скроются в очереди. Переносите команды только если нужно
                                        изменить время их записи.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("queue")}
                                        className="mt-3 cursor-pointer font-semibold underline underline-offset-4"
                                    >
                                        Перейти к слотам
                                    </button>
                                </div>
                            )}
                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <dt className="text-[12px] text-app-muted">Название</dt>
                                    <dd className="mt-1 font-semibold [overflow-wrap:anywhere]">
                                        {configuration.title || "—"}
                                    </dd>
                                </div>
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <dt className="text-[12px] text-app-muted">Начало</dt>
                                    <dd className="mt-1 font-semibold">
                                        {new Date(configuration.starts_at).toLocaleString("ru-RU")}
                                    </dd>
                                </div>
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <dt className="text-[12px] text-app-muted">Типы проектов</dt>
                                    <dd className="mt-1 font-semibold">
                                        {configuration.project_type_ids
                                            .map(
                                                (id) =>
                                                    projectTypes.find((type) => type.id === id)
                                                        ?.name,
                                            )
                                            .filter(Boolean)
                                            .join(", ") || "Не выбраны"}
                                    </dd>
                                </div>
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <dt className="text-[12px] text-app-muted">
                                        Максимальный балл
                                    </dt>
                                    <dd className="mt-1 font-semibold">
                                        {configuration.max_score}
                                    </dd>
                                </div>
                            </dl>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <p className="text-[13px] font-semibold text-app-text">
                                        Слоты: {defenseSlots.length}
                                    </p>
                                    <p className="mt-1 text-[12px] text-app-muted">
                                        Назначено: {assignedRegistrationBySlot.size} · Не назначено:{" "}
                                        {Math.max(
                                            0,
                                            defenseSlots.filter((slot) => slot.id).length -
                                                assignedRegistrationBySlot.size,
                                        )}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("queue")}
                                        className="mt-3 cursor-pointer text-[12px] font-semibold text-app-blue dark:text-blue-300 hover:underline"
                                    >
                                        Перейти к слоту
                                    </button>
                                </div>
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <p className="text-[13px] font-semibold text-app-text">
                                        Критерии и веса
                                    </p>
                                    <p className="mt-1 text-[12px] text-app-muted">
                                        Бакалавры: {configuration.weights.member}% · Магистранты:{" "}
                                        {configuration.weights.manager}% · Комиссия:{" "}
                                        {configuration.weights.teacher}%
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection("assessment")}
                                        className="mt-3 cursor-pointer text-[12px] font-semibold text-app-blue dark:text-blue-300 hover:underline"
                                    >
                                        Перейти к оцениванию
                                    </button>
                                </div>
                            </div>
                            {reviewAssignments.length > 0 && (
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <h3 className="mb-2 text-[13px] font-semibold text-app-text">
                                        Время защиты команд
                                    </h3>
                                    <Tooltip.Provider delay={100}>
                                        <ul className="divide-y divide-gray-200 dark:divide-app-border text-[13px]">
                                            {reviewAssignments.map(({ slot, registration }) => (
                                                <li
                                                    key={registration.id}
                                                    className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2"
                                                >
                                                    <span>
                                                        {projectById.get(registration.project_id)
                                                            ?.name ??
                                                            `Проект №${registration.project_id}`}
                                                    </span>
                                                    <ApproximateDefenseTime
                                                        value={slot.starts_at}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </Tooltip.Provider>
                                </div>
                            )}
                            {exam && (
                                <div className="rounded-[12px] border border-gray-200 dark:border-app-border p-4">
                                    <p className="mb-3 text-[13px] font-semibold text-app-text">
                                        История версий
                                    </p>
                                    {historyQuery.isLoading ? (
                                        <p className="text-[12px] text-app-muted">
                                            Загрузка истории...
                                        </p>
                                    ) : (historyQuery.data?.items.length ?? 0) === 0 ? (
                                        <p className="text-[12px] text-app-muted">
                                            Изменений пока нет.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {historyQuery.data?.items
                                                .slice()
                                                .reverse()
                                                .map((revision) => (
                                                    <div
                                                        key={revision.version}
                                                        className="flex justify-between gap-3 rounded-[10px] bg-gray-50 dark:bg-app-ghost px-3 py-2 text-[12px]"
                                                    >
                                                        <span className="font-medium text-app-text">
                                                            Версия {revision.version}
                                                        </span>
                                                        <span className="text-app-muted">
                                                            {new Date(
                                                                revision.changed_at,
                                                            ).toLocaleString("ru-RU")}
                                                        </span>
                                                        <span className="max-w-[280px] truncate text-app-muted">
                                                            {revision.reason || "Без комментария"}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </fieldset>
            </div>

            {pendingTiming && activeSection !== "queue" && (
                <p className="px-5 pb-3 text-[13px] text-app-muted">
                    Время слотов ещё не изменилось.{" "}
                    <button
                        type="button"
                        className="cursor-pointer font-semibold text-app-blue dark:text-blue-300 hover:underline"
                        onClick={() => setActiveSection("queue")}
                    >
                        Проверить пересчёт
                    </button>
                </p>
            )}
            {slotScheduleWarning && (
                <p
                    role="status"
                    className="px-5 pb-3 text-[13px] text-emerald-800 dark:text-emerald-300"
                >
                    {slotScheduleWarning}
                </p>
            )}

            <Dialog
                open={replacement !== null}
                onOpenChange={(open) => !open && setReplacement(null)}
            >
                <DialogContent withDescription className="w-[calc(100%-2rem)]">
                    <DialogHeader>
                        <DialogTitle>Заменить команду в слоте?</DialogTitle>
                        <DialogDescription>
                            {replacement?.registration.queue_hold === "postponed"
                                ? "Запись отложенной команды будет отменена."
                                : "Запись команды с неявкой будет отменена."}{" "}
                            Выбранная команда займёт её слот.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="hug36" onClick={() => setReplacement(null)}>
                            Оставить запись
                        </Button>
                        <Button
                            variant="blue"
                            size="hug36"
                            onClick={() => {
                                if (!replacement) return;
                                setReplacement(null);
                                void changeSlotAssignment(
                                    replacement.slot,
                                    replacement.projectId,
                                    replacement.registration,
                                );
                            }}
                        >
                            Подтвердить замену
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {settingsStale && (
                <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 text-[13px] text-app-text"
                >
                    <p>
                        Настройки экзамена изменились в другом окне. При загрузке актуальной версии
                        несохранённые правки настроек будут сброшены. Правки расписания останутся в
                        редакторе.
                    </p>
                    <Button
                        variant="outline"
                        size="hug36"
                        disabled={saving}
                        loading={loadingSettings}
                        onClick={() => void loadLatestSettings()}
                    >
                        Загрузить актуальные настройки
                    </Button>
                </div>
            )}
            <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-gray-200 dark:border-app-border bg-app-surface px-5 py-4">
                {exam && (
                    <Input
                        maxLength={1000}
                        disabled={saving}
                        aria-label="Причина изменения"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Причина изменения"
                        className="max-w-64"
                    />
                )}
                <Button
                    variant="outline"
                    size="hug36"
                    disabled={saving || pendingSlotId !== null}
                    onClick={onCancel}
                >
                    Отмена
                </Button>
                <Button
                    variant="outline"
                    size="hug36"
                    icon={<Save size={16} />}
                    disabled={
                        pendingSlotId !== null ||
                        Boolean(pendingTiming) ||
                        settingsStale ||
                        loadingSettings
                    }
                    loading={saving}
                    onClick={() => void saveExam("save")}
                >
                    {exam ? "Сохранить" : "Сохранить черновик"}
                </Button>
                {exam?.status === "draft" && (
                    <Dialog
                        open={publishConfirmationOpen}
                        onOpenChange={setPublishConfirmationOpen}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="blue"
                                size="hug36"
                                icon={<ShieldCheck size={16} />}
                                disabled={
                                    pendingSlotId !== null ||
                                    Boolean(pendingTiming) ||
                                    settingsStale ||
                                    loadingSettings
                                }
                                loading={saving}
                            >
                                Опубликовать
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="grid w-[calc(100%-2rem)] max-w-[440px] gap-4">
                            <DialogHeader>
                                <DialogTitle>Вы точно хотите опубликовать экзамен?</DialogTitle>
                            </DialogHeader>
                            <p className="text-[13px] leading-relaxed text-app-muted">
                                После публикации экзамен появится в списке экзаменов пространства.
                            </p>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    onClick={() => setPublishConfirmationOpen(false)}
                                >
                                    Вернуться к черновику
                                </Button>
                                <Button
                                    variant="blue"
                                    size="hug36"
                                    onClick={() => {
                                        setPublishConfirmationOpen(false);
                                        void saveExam("publish");
                                    }}
                                >
                                    Опубликовать экзамен
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </footer>
            <Dialog open={resetSlotsOpen} onOpenChange={setResetSlotsOpen}>
                <DialogContent className="grid w-[calc(100%-2rem)] max-w-[440px] gap-4">
                    <DialogHeader>
                        <DialogTitle>Сбросить изменения расписания?</DialogTitle>
                    </DialogHeader>
                    <p className="text-[13px] leading-relaxed text-app-muted">
                        Сброс отменит изменения с последнего сохранения и покажет актуальное
                        расписание.
                    </p>
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setResetSlotsOpen(false)}
                        >
                            Отмена
                        </Button>
                        <Button variant="blue" size="hug36" onClick={resetAllSlots}>
                            {slotsQuery.data?.items.length
                                ? "Сбросить изменения расписания"
                                : "Сбросить все слоты"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog
                open={durationWarningAction !== null}
                onOpenChange={(open) => {
                    if (!open) setDurationWarningAction(null);
                }}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Проверьте длительность слотов</DialogTitle>
                    </DialogHeader>
                    <p className="text-[13px] text-app-muted">
                        {scheduleMismatch.length}{" "}
                        {scheduleMismatch.length === 1 ? "слот отличается" : "слота отличаются"} от
                        расчёта «выступление + вопросы + переход» ({expectedSlotMinutes} мин.).
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-app-border text-[12px]">
                        {scheduleMismatch.map((slot) => {
                            const index =
                                sortedLocalSlots.findIndex((item) => item.key === slot.key) + 1;
                            const actual = Math.round(
                                (new Date(slot.ends_at).getTime() -
                                    new Date(slot.starts_at).getTime()) /
                                    60000,
                            );
                            return (
                                <div
                                    key={slot.key}
                                    className="flex justify-between gap-3 border-b border-gray-100 dark:border-app-border px-3 py-2 last:border-0"
                                >
                                    <span>Слот №{index}</span>
                                    <span>
                                        {actual} мин. вместо {expectedSlotMinutes} мин.
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setDurationWarningAction(null)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => {
                                setDurationWarningAction(null);
                                setActiveSection("queue");
                            }}
                        >
                            Перейти к слотам
                        </Button>
                        <Button
                            variant="blue"
                            size="hug36"
                            onClick={() => {
                                const action = durationWarningAction;
                                setDurationWarningAction(null);
                                if (action) void saveExam(action, true);
                            }}
                        >
                            Всё равно{" "}
                            {durationWarningAction === "publish" ? "опубликовать" : "сохранить"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
