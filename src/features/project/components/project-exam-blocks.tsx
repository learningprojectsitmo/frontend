import { shareExamQueue } from "@/features/exam/exam-queue-snapshot";
import { useEffect, useState } from "react";
import {
    queryOptions,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import {
    formatExamDate,
    formatExamRegistrationWindow,
    getRegistrationDeadline,
    isExamRegistrationOpen,
} from "@/features/exam/exam-display";
import { useExamWorkspaces } from "@/features/exam/use-exam-workspaces";
import {
    examApi,
    getExamErrorCode,
    getExamErrorMessage,
    invalidateExam,
    useExams,
    useExamSlots,
} from "@/lib/exams";
import { examGradingApi, gradingKey } from "@/lib/exam-grading";
import { useProjectTypes } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import type { Exam } from "@/types/exam";
import { formatExamCountdown, getProjectExamState } from "./project-exam-display";

type Props = {
    workspaceId: number;
    projectId: number;
    projectTypeId: number | null;
    isProjectAuthor: boolean;
    isTeamMember?: boolean;
};

const dateLabel = (time: number) => formatExamDate(new Date(time).toISOString());

export function ProjectExamBlocks({
    workspaceId,
    projectId,
    projectTypeId,
    isProjectAuthor,
    isTeamMember = isProjectAuthor,
}: Props) {
    const client = useQueryClient();
    const exams = useExams(workspaceId, "published").data?.items ?? [];
    const access = useExamWorkspaces(workspaceId, isTeamMember, isTeamMember);
    const projectTypes = useProjectTypes(workspaceId);
    const [now, setNow] = useState(Date.now);
    const [booking, setBooking] = useState<{ examId: number; slotId: number | null } | null>(null);
    const checkingBookings =
        isProjectAuthor &&
        access.canSelfRegister &&
        exams.some((exam) => isExamRegistrationOpen(exam, now));
    const queues = useQueries({
        queries: exams.map((exam) =>
            queryOptions({
                queryKey: queryKeys.exams.queue(workspaceId, exam.id),
                queryFn: () => examApi.queue(workspaceId, exam.id),
                structuralSharing: shareExamQueue,
                staleTime: 30_000,
                refetchInterval: (query) =>
                    checkingBookings ||
                    Date.parse(exam.configuration.starts_at) > Date.now() ||
                    query.state.data?.items.some(
                        (item) =>
                            item.state === "waiting" ||
                            item.state === "running" ||
                            item.state === "postponed",
                    )
                        ? 30_000
                        : false,
            }),
        ),
    });
    const registered = exams.find((_, index) =>
        queues[index]?.data?.items.some((item) => item.project_id === projectId),
    );
    const matchesType = (exam: Exam) =>
        projectTypeId !== null && exam.configuration.project_type_ids.includes(projectTypeId);
    const byStart = exams
        .slice()
        .sort(
            (a, b) => Date.parse(a.configuration.starts_at) - Date.parse(b.configuration.starts_at),
        );
    const queueFor = (exam: Exam) => queues[exams.indexOf(exam)]?.data;
    const available = (exam: Exam) => isExamRegistrationOpen(exam, now);
    const upcoming = byStart.filter((exam) => Date.parse(exam.configuration.starts_at) > now);
    const openExam = upcoming.find((item) => matchesType(item) && available(item));
    const exam =
        registered ??
        (isProjectAuthor && access.canSelfRegister ? openExam : undefined) ??
        byStart.find(
            (item) =>
                matchesType(item) &&
                getProjectExamState(item, queueFor(item), now).status === "running",
        ) ??
        openExam ??
        upcoming.find(matchesType) ??
        byStart.filter(matchesType).at(-1) ??
        upcoming[0] ??
        byStart.at(-1);

    const defense = exam
        ? queueFor(exam)?.items.find(
              (item) => item.project_id === projectId && item.state === "finished",
          )?.attempt
        : null;
    const canReadGrade = isTeamMember && access.canManageResults && Boolean(exam && defense);
    const grades = useQuery({
        queryKey: [...gradingKey(workspaceId, exam?.id ?? 0), "editions", defense?.id ?? 0],
        queryFn: () => examGradingApi.editions(workspaceId, exam?.id ?? 0, defense?.id ?? 0),
        enabled: canReadGrade,
        retry: false,
        staleTime: 30_000,
        refetchInterval: canReadGrade ? 30_000 : false,
    });
    const grade =
        canReadGrade && grades.isSuccess
            ? grades.data.items.filter((item) => item.published_at).at(-1)
            : undefined;

    const slots = useExamSlots(workspaceId, booking?.examId ?? exam?.id ?? 0);
    const slotsEnd =
        slots.data?.items.reduce((end, slot) => Math.max(end, Date.parse(slot.ends_at)), 0) ?? 0;
    const state = exam
        ? getProjectExamState(
              exam,
              queueFor(exam),
              now,
              booking && booking.examId !== exam.id ? 0 : slotsEnd,
          )
        : null;
    const ticking =
        (exam && access.canSelfRegister && now < getRegistrationDeadline(exam.configuration)) ||
        state?.status === "upcoming" ||
        (state?.status === "running" && now < state.end);
    const examId = exam?.id;
    useEffect(() => {
        if (!examId) return;
        setNow(Date.now());
        if (!ticking) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1_000);
        return () => window.clearInterval(timer);
    }, [examId, ticking]);

    const registration = useMutation({
        mutationFn: ({ examId: targetId, slotId }: NonNullable<typeof booking>) =>
            examApi.register(
                workspaceId,
                targetId,
                { project_id: projectId, slot_id: slotId },
                true,
            ),
        onSuccess: async (_, { examId: targetId }) => {
            await invalidateExam(client, workspaceId, targetId);
            setBooking(null);
            toast.success("Команда записана на экзамен");
        },
        onError: async (error, { examId: targetId }) => {
            toast.error(
                getExamErrorMessage(error) ??
                    "Не удалось записать команду. Проверьте доступность записи и попробуйте ещё раз.",
            );
            await Promise.all([
                invalidateExam(client, workspaceId, targetId),
                ...(getExamErrorCode(error) === "project_already_registered"
                    ? queues.flatMap((query, index) =>
                          exams[index]?.id === targetId ? [] : [query.refetch()],
                      )
                    : []),
            ]);
            setBooking(null);
        },
    });

    if (!exam || !state) return null;

    const showCountdown = Boolean(registered) || matchesType(exam);
    const href = paths.app.examView.getHref(workspaceId, exam.id);
    const workspaceName = access.spaces.find((space) => space.id === workspaceId)?.title;
    const typeNames = (projectTypes.data ?? [])
        .filter((type) => exam.configuration.project_type_ids.includes(type.id))
        .map((type) => type.name)
        .join(", ");
    const bookingVerified = queues.every((query) => query.isSuccess);
    const canBook =
        isProjectAuthor &&
        bookingVerified &&
        !registered &&
        matchesType(exam) &&
        available(exam) &&
        access.canSelfRegister;
    const title = {
        upcoming: "Экзамен начнётся через",
        running: "Экзамен идёт",
        finished: "Экзамен завершён",
    }[state.status];
    const time =
        state.status === "upcoming" || (state.status === "running" && state.end > now)
            ? formatExamCountdown(state.end - now)
            : state.status === "finished"
              ? dateLabel(state.end)
              : "—";
    const freeSlots = slots.data?.items.filter((slot) => slot.is_available) ?? [];

    return (
        <section className={showCountdown ? "grid gap-4 lg:grid-cols-2" : "grid gap-4"}>
            {grade && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-app-border bg-app-surface p-5 lg:col-span-full">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-app-badge-blue text-app-blue dark:text-blue-300">
                            <Icon name="exam" size={22} />
                        </span>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-app-text">Опубликованная оценка</h2>
                            <p className="break-words text-sm text-app-muted">
                                {exam.configuration.title}
                            </p>
                        </div>
                    </div>
                    <div className="text-right tabular-nums text-app-text">
                        <strong className="text-2xl">
                            {Number(grade.final_score).toLocaleString("ru-RU")}
                        </strong>
                        <span className="text-sm text-app-muted">
                            {" "}
                            из {Number(grade.snapshot.max_score).toLocaleString("ru-RU")}
                        </span>
                    </div>
                </div>
            )}
            {showCountdown && (
                <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-[#4338CA] p-5 text-white dark:bg-indigo-950 dark:ring-1 dark:ring-inset dark:ring-indigo-700/50 sm:flex-nowrap">
                    <Icon name="exam" size={40} className="shrink-0 text-white" />
                    <div
                        key={`${exam.id}-${state.status}`}
                        className="min-w-0 flex-1 basis-28 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
                    >
                        <h2
                            aria-live="polite"
                            className="text-xl font-semibold [overflow-wrap:anywhere]"
                        >
                            {state.status === "running" ||
                            (state.status === "finished" && registered) ? (
                                <Link
                                    to={href}
                                    className="hover:underline hover:underline-offset-4"
                                >
                                    {title}
                                </Link>
                            ) : (
                                title
                            )}
                        </h2>
                    </div>
                    <div className="rounded-[13px] bg-app-surface px-3 py-2 text-xl font-semibold tabular-nums text-app-text">
                        {time}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-[#1E293B] p-5 text-white dark:bg-app-surface dark:ring-1 dark:ring-inset dark:ring-app-border sm:flex-nowrap">
                <div className="flex min-w-0 flex-1 basis-52 gap-4">
                    <span
                        aria-hidden="true"
                        className="w-1 shrink-0 self-stretch rounded-sm bg-white"
                    />
                    <div className="min-w-0">
                        <h2 className="text-[15px] font-semibold text-white">
                            {canBook ? (
                                <button
                                    type="button"
                                    onClick={() => setBooking({ examId: exam.id, slotId: null })}
                                    className="cursor-pointer text-left underline-offset-4 hover:underline"
                                >
                                    Запишитесь на экзамен
                                </button>
                            ) : (
                                <>
                                    {workspaceName
                                        ? `Экзамен для студентов дисциплины «${workspaceName}»`
                                        : "Экзамен для студентов дисциплины"}
                                    {typeNames && `. ${typeNames}`}
                                </>
                            )}
                        </h2>
                        {access.canSelfRegister && (
                            <p className="mt-1 text-sm text-white/80">
                                {formatExamRegistrationWindow(exam)}
                            </p>
                        )}
                    </div>
                </div>
                <Link
                    to={href}
                    className="shrink-0 rounded-[13px] bg-white/10 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-white/20"
                >
                    Открыть экзамен
                </Link>
            </div>

            <Dialog
                open={Boolean(booking?.examId === exam.id && canBook)}
                onOpenChange={(open) => {
                    if (!open && !registration.isPending) setBooking(null);
                }}
            >
                <DialogContent className="grid w-[calc(100%-2rem)] max-w-[440px] gap-4">
                    <DialogHeader>
                        <DialogTitle>Записать команду на экзамен</DialogTitle>
                    </DialogHeader>
                    {slots.isLoading ? (
                        <p className="text-sm text-app-muted">Проверяем свободные слоты…</p>
                    ) : slots.isError ? (
                        <p role="alert" className="text-sm text-app-muted">
                            Не удалось загрузить слоты. Попробуйте открыть запись ещё раз.
                        </p>
                    ) : freeSlots.length > 0 ? (
                        <label className="grid gap-2 text-sm">
                            Время выступления
                            <select
                                className="h-10 rounded-lg border border-app-border bg-app-surface px-3 text-app-text"
                                value={booking?.slotId ?? ""}
                                disabled={registration.isPending}
                                onChange={(event) =>
                                    setBooking(
                                        (current) =>
                                            current && {
                                                ...current,
                                                slotId: Number(event.target.value),
                                            },
                                    )
                                }
                            >
                                <option value="" disabled>
                                    Выберите свободный слот
                                </option>
                                {freeSlots.map((slot) => (
                                    <option key={slot.id} value={slot.id}>
                                        {formatExamDate(slot.starts_at)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : slots.data?.items.length ? (
                        <p className="text-sm text-app-muted">Свободных слотов пока нет.</p>
                    ) : (
                        <p className="text-sm text-app-muted">
                            Команда будет добавлена в очередь выступлений.
                        </p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            disabled={registration.isPending}
                            onClick={() => setBooking(null)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="blue"
                            size="hug36"
                            loading={registration.isPending}
                            disabled={
                                !slots.data ||
                                slots.isError ||
                                !booking ||
                                booking.examId !== exam.id ||
                                !canBook ||
                                (slots.data.items.length > 0 &&
                                    !freeSlots.some((slot) => slot.id === booking.slotId))
                            }
                            onClick={() => {
                                if (
                                    !booking ||
                                    booking.examId !== exam.id ||
                                    !canBook ||
                                    !slots.data ||
                                    slots.isError ||
                                    (slots.data.items.length > 0 &&
                                        !freeSlots.some((slot) => slot.id === booking.slotId))
                                )
                                    return;
                                if (!isExamRegistrationOpen(exam, Date.now())) {
                                    toast.error("Запись на экзамен уже закрылась.");
                                    setBooking(null);
                                    return;
                                }
                                registration.mutate(booking);
                            }}
                        >
                            Записать команду
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
