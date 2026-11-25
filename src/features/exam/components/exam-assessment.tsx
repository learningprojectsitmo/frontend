import { ExamErrorState } from "./exam-error-state";
import { Tooltip } from "@base-ui/react/tooltip";
import { Ban } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import {
    Dialog,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog/dialog";
import { Icon } from "@/components/ui/icons";
import { getExamErrorCode, isExamAccessDenied } from "@/lib/exams";
import {
    examGradingApi,
    getGradingError,
    gradingKey,
    type Answer,
    type AssessmentForm,
} from "@/lib/exam-grading";

import { formatExamDate } from "../exam-display";
import { useExamClock } from "../use-exam-clock";

type AssessmentTarget = { workspaceId: number; examId: number; attemptId: number };
type ExamAssessmentProps = AssessmentTarget & {
    projectName: string;
    remainingSeconds: number;
    closesAt: string;
};

function useAssessmentForm({ workspaceId, examId, attemptId }: AssessmentTarget, enabled: boolean) {
    return useQuery({
        queryKey: [...gradingKey(workspaceId, examId), "assessment", attemptId],
        queryFn: () => examGradingApi.form(workspaceId, examId, attemptId),
        enabled,
        retry: false,
        staleTime: 30_000,
    });
}

function AssessmentCountdown({ seconds }: { seconds: number }) {
    const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    return (
        <span
            role="timer"
            aria-label="До закрытия оценивания"
            className={`whitespace-nowrap tabular-nums ${seconds <= 30 ? "font-semibold text-red-600 dark:text-red-300" : "text-app-muted"}`}
        >
            До закрытия {text}
        </span>
    );
}

function AssessmentToast({ deadline, onDismiss }: { deadline: number; onDismiss: () => void }) {
    const now = useExamClock();
    const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
    useEffect(() => {
        if (seconds === 0) onDismiss();
    }, [seconds, onDismiss]);
    if (!seconds) return null;
    return (
        <div className="flex w-[min(352px,calc(100vw-2rem))] items-start justify-between gap-4 rounded-xl border border-app-border bg-app-surface p-4 text-sm text-app-text shadow-lg">
            <div>
                <p className="font-semibold">Оцените команду в таблице</p>
                <AssessmentCountdown seconds={seconds} />
            </div>
            <button
                type="button"
                aria-label="Закрыть уведомление"
                className="pointer-events-auto cursor-pointer rounded-lg p-1 text-app-muted hover:bg-app-ghost"
                onClick={onDismiss}
            >
                <Icon name="cross" size={18} />
            </button>
        </div>
    );
}

export function ExamAssessmentNotification(
    props: AssessmentTarget & { closesAt: string; serverNow: number },
) {
    const form = useAssessmentForm(props, true);
    const notified = useRef(false);
    const { workspaceId, examId, attemptId, closesAt, serverNow } = props;
    useEffect(() => {
        if (
            notified.current ||
            !form.isSuccess ||
            form.data.assessor.excluded ||
            form.data.submission
        )
            return;
        const remaining = Date.parse(closesAt) - serverNow;
        if (remaining <= 0) return;
        notified.current = true;
        const deadline = Date.now() + remaining;
        toast.custom(
            (id) => <AssessmentToast deadline={deadline} onDismiss={() => toast.dismiss(id)} />,
            {
                id: `assessment-${workspaceId}-${examId}-${attemptId}`,
                duration: Infinity,
                position: "bottom-right",
                style: { pointerEvents: "none" },
                dismissible: false,
                closeButton: false,
            },
        );
    }, [form.isSuccess, form.data, workspaceId, examId, attemptId, closesAt, serverNow]);
    return null;
}

export function ExamAssessment(props: ExamAssessmentProps) {
    const [open, setOpen] = useState(false);
    const windowOpen = props.remainingSeconds > 0;
    const form = useAssessmentForm(props, windowOpen);

    if (isExamAccessDenied(form.error) || form.data?.assessor.excluded) return null;
    if (!form.data && windowOpen)
        return form.isError ? (
            <ExamErrorState
                message={getGradingError(form.error)}
                retry={() => void form.refetch()}
                pending={form.isFetching}
            />
        ) : (
            <span role="status" className="text-xs text-app-muted">
                Загружаем оценивание…
            </span>
        );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {windowOpen ? (
                <div className="flex flex-col items-end text-xs">
                    <DialogTrigger className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold text-app-blue hover:bg-app-ghost dark:text-blue-300">
                        Оценить
                    </DialogTrigger>
                    <AssessmentCountdown seconds={props.remainingSeconds} />
                </div>
            ) : (
                <Tooltip.Root>
                    <Tooltip.Trigger
                        render={<DialogTrigger />}
                        aria-label="Оценивание закрыто"
                        className="inline-grid size-8 cursor-pointer place-items-center rounded-lg text-app-muted hover:bg-app-ghost"
                    >
                        <Ban size={16} aria-hidden="true" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                        <Tooltip.Positioner
                            positionMethod="fixed"
                            align="end"
                            sideOffset={8}
                            className="z-[500]"
                        >
                            <Tooltip.Popup className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs text-app-text shadow-lg">
                                Оценивание закрыто
                            </Tooltip.Popup>
                        </Tooltip.Positioner>
                    </Tooltip.Portal>
                </Tooltip.Root>
            )}
            {open &&
                (windowOpen && form.data ? (
                    <AssessmentContent {...props} form={form.data} onClose={() => setOpen(false)} />
                ) : (
                    <ClosedAssessment
                        projectName={props.projectName}
                        closesAt={props.closesAt}
                        onClose={() => setOpen(false)}
                    />
                ))}
        </Dialog>
    );
}

function ClosedAssessment({
    projectName,
    closesAt,
    onClose,
}: {
    projectName: string;
    closesAt: string;
    onClose: () => void;
}) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[300] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-app-border bg-app-surface p-6 text-app-text shadow-xl">
                <DialogTitle className="text-xl font-semibold">Оценивание закрыто</DialogTitle>
                <DialogPrimitive.Description className="mt-3 break-words text-sm text-app-muted">
                    {projectName} · время на отправку оценки истекло {formatExamDate(closesAt)}.
                </DialogPrimitive.Description>
                <DialogPrimitive.Close
                    className="mt-4 rounded-lg border border-app-border px-3 py-2 text-sm"
                    onClick={onClose}
                >
                    Закрыть
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function AssessmentContent({
    workspaceId,
    examId,
    attemptId,
    projectName,
    remainingSeconds,
    closesAt,
    form,
    onClose,
}: ExamAssessmentProps & { form: AssessmentForm; onClose: () => void }) {
    const client = useQueryClient();
    const [answers, setAnswers] = useState<Answer[]>(() =>
        form.questions.map(
            (question) =>
                form.draft.answers.find((answer) => answer.question_id === question.id) ?? {
                    question_id: question.id,
                    score: null,
                    comment: null,
                },
        ),
    );
    const [saved, setSaved] = useState(answers);
    const submission = form.submission;
    const [error, setError] = useState<string>();
    const [tooltipContainer, setTooltipContainer] = useState<HTMLDivElement | null>(null);
    const errorId = useId();
    const sendRequested = useRef(false);
    const [closedByServer, setClosedByServer] = useState(false);
    const dirty = answers.some(
        (answer, index) =>
            answer.score !== saved[index].score || answer.comment !== saved[index].comment,
    );
    const key = [...gradingKey(workspaceId, examId), "assessment", attemptId];
    const mutation = useMutation({
        scope: { id: `assessment-${workspaceId}-${examId}-${attemptId}` },
        mutationFn: async ({
            submit,
            snapshot,
        }: {
            submit: boolean;
            snapshot: Answer[];
            closeAfterSave?: boolean;
        }) => {
            setError(undefined);
            return submit
                ? examGradingApi.submit(workspaceId, examId, attemptId, snapshot)
                : examGradingApi.draft(workspaceId, examId, attemptId, snapshot);
        },
        onSuccess: (result, { snapshot }) => {
            setSaved(snapshot);
            client.setQueryData<AssessmentForm>(key, (current) => {
                if (!current) return current;
                if ("version" in result) {
                    return {
                        ...current,
                        draft: { ...current.draft, answers: result.answers },
                        submission: {
                            version: result.version,
                            submitted_at: result.submitted_at,
                            has_unsubmitted_changes: false,
                        },
                    };
                }
                return { ...current, draft: result };
            });
            return client.invalidateQueries({ queryKey: key });
        },
        onError: (failure) => {
            if (getExamErrorCode(failure) === "assessment_window_closed") setClosedByServer(true);
            else setError(getGradingError(failure));
        },
    });
    const { mutate, isPending } = mutation;
    const sending = isPending && mutation.variables?.submit;
    const waitingToSend = sending && mutation.isPaused;
    const lockFields =
        isPending && (mutation.variables?.submit || mutation.variables?.closeAfterSave);
    const windowOpen = remainingSeconds > 0 && !closedByServer;
    useEffect(() => {
        if (!dirty || !windowOpen || isPending || error) return;
        const timeout = window.setTimeout(() => {
            if (!sendRequested.current) mutate({ submit: false, snapshot: answers });
        }, 700);
        return () => window.clearTimeout(timeout);
    }, [answers, dirty, error, isPending, mutate, windowOpen]);
    const updateAnswer = (id: number, patch: Partial<Pick<Answer, "score" | "comment">>) => {
        setError(undefined);
        setAnswers((old) =>
            old.map((answer) => (answer.question_id === id ? { ...answer, ...patch } : answer)),
        );
    };
    const points = answers.reduce((sum, answer) => sum + (answer.score ?? 0), 0);
    const maximum = form.questions.reduce(
        (sum, question) => sum + Math.max(0, ...question.levels.map((level) => level.score)),
        0,
    );
    const submitAssessment = () => {
        if (sendRequested.current) return;
        sendRequested.current = true;
        mutate(
            { submit: true, snapshot: answers },
            {
                onSettled: () => {
                    sendRequested.current = false;
                },
            },
        );
    };
    const requestClose = () => {
        if (isPending || sendRequested.current) return;
        if (dirty && windowOpen)
            mutate(
                { submit: false, snapshot: answers, closeAfterSave: true },
                { onSuccess: onClose },
            );
        else onClose();
    };
    if (!windowOpen)
        return <ClosedAssessment projectName={projectName} closesAt={closesAt} onClose={onClose} />;

    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                onEscapeKeyDown={(event) => {
                    event.preventDefault();
                    requestClose();
                }}
                onPointerDownOutside={(event) => {
                    event.preventDefault();
                    requestClose();
                }}
                className="fixed left-1/2 top-1/2 z-[300] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white dark:border dark:border-app-border dark:bg-app-surface p-4 shadow-xl sm:p-6"
            >
                <div className="flex shrink-0 items-start justify-between gap-3">
                    <DialogTitle
                        title={projectName}
                        className="min-w-0 line-clamp-2 text-[28px] font-semibold leading-tight text-[#0A0A0A] dark:text-app-text [overflow-wrap:anywhere]"
                    >
                        {projectName}
                    </DialogTitle>
                    <button
                        type="button"
                        onClick={requestClose}
                        disabled={isPending}
                        aria-label="Закрыть"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-[#4A5565] dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-app-ghost"
                    >
                        <Icon name="cross" size={20} />
                    </button>
                </div>
                <div className="mt-2 min-h-0 overflow-y-auto overscroll-contain px-1 pb-1">
                    <DialogPrimitive.Description className="mb-3 mt-3 text-[17px] text-[#4A5565] dark:text-slate-300">
                        Оцените команду по критериям ниже
                    </DialogPrimitive.Description>
                    <Tooltip.Provider delay={100}>
                        <div className="grid gap-6">
                            {form.questions.map((question) => (
                                <fieldset key={question.id} className="min-w-0">
                                    <legend className="break-words text-[18px] font-medium text-[#0A0A0A] dark:text-app-text">
                                        {question.text}
                                    </legend>
                                    {question.description && (
                                        <p className="mt-1 break-words text-[15px] text-[#4A5565] dark:text-slate-300">
                                            {question.description}
                                        </p>
                                    )}
                                    <div className="mt-3 grid grid-flow-col auto-cols-fr divide-x divide-[#0000001A] dark:divide-app-border overflow-hidden rounded-xl border border-[#CFCFCF] dark:border-app-border bg-[#F9FAFB] dark:bg-app-ghost">
                                        {question.levels.map((level) => (
                                            <Tooltip.Root
                                                key={level.score}
                                                disabled={!level.description}
                                            >
                                                <Tooltip.Trigger
                                                    type="button"
                                                    aria-pressed={
                                                        answers.find(
                                                            (answer) =>
                                                                answer.question_id === question.id,
                                                        )?.score === level.score
                                                    }
                                                    disabled={lockFields}
                                                    onClick={() =>
                                                        updateAnswer(question.id, {
                                                            score: level.score,
                                                        })
                                                    }
                                                    className="grid h-[49px] min-w-0 place-items-center text-[18px] text-[#0A0A0A] dark:text-app-text hover:bg-[#0000001A] dark:hover:bg-slate-700 focus-visible:-outline-offset-2 aria-pressed:bg-[#030213] dark:aria-pressed:bg-blue-600 aria-pressed:text-white"
                                                >
                                                    {level.score}
                                                </Tooltip.Trigger>
                                                {tooltipContainer && level.description && (
                                                    <Tooltip.Portal container={tooltipContainer}>
                                                        <Tooltip.Positioner
                                                            positionMethod="fixed"
                                                            sideOffset={8}
                                                            className="z-10"
                                                        >
                                                            <Tooltip.Popup className="max-w-[min(280px,var(--available-width))] rounded-lg border border-[#CFCFCF] dark:border-app-border bg-white dark:bg-app-surface px-3 py-2 text-[13px] text-[#0A0A0A] dark:text-app-text shadow-lg">
                                                                <Tooltip.Arrow className="data-[side=top]:-bottom-[5px] data-[side=bottom]:-top-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px]">
                                                                    <span className="block size-2 rotate-45 bg-white dark:bg-app-surface" />
                                                                </Tooltip.Arrow>
                                                                <div className="max-h-[min(12rem,var(--available-height))] overflow-auto [overflow-wrap:anywhere]">
                                                                    {level.description}
                                                                </div>
                                                            </Tooltip.Popup>
                                                        </Tooltip.Positioner>
                                                    </Tooltip.Portal>
                                                )}
                                            </Tooltip.Root>
                                        ))}
                                    </div>
                                    <textarea
                                        aria-label={`Комментарий к критерию «${question.text}»`}
                                        placeholder="Комментарий"
                                        maxLength={5000}
                                        data-save-error={Boolean(error && dirty)}
                                        readOnly={lockFields}
                                        rows={3}
                                        aria-describedby={error ? errorId : undefined}
                                        value={
                                            answers.find(
                                                (answer) => answer.question_id === question.id,
                                            )?.comment ?? ""
                                        }
                                        onChange={(event) =>
                                            updateAnswer(question.id, {
                                                comment: event.target.value || null,
                                            })
                                        }
                                        className="mt-3 block min-h-24 max-h-52 w-full resize-y overflow-y-auto rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-sm leading-6 text-app-text outline-none placeholder:text-app-muted focus:border-app-blue focus:ring-2 focus:ring-app-blue/25 data-[save-error=true]:border-red-500 read-only:opacity-70"
                                    />
                                </fieldset>
                            ))}
                        </div>
                    </Tooltip.Provider>
                </div>
                <div className="mt-5 shrink-0 border-t border-[#ECECF0] dark:border-app-border pt-4">
                    <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm font-medium text-[#182844] dark:text-blue-100">
                        {maximum > 0 && (
                            <output>
                                Баллы по критериям: {points} из {maximum}
                            </output>
                        )}
                        <AssessmentCountdown seconds={remainingSeconds} />
                    </div>
                    {error && (
                        <p
                            id={errorId}
                            role="alert"
                            className="mb-2 text-sm text-red-600 dark:text-red-300"
                        >
                            {error}
                        </p>
                    )}
                    <p role="status" className="mb-3 text-sm text-app-muted">
                        {waitingToSend
                            ? "Сохраняем черновик перед отправкой…"
                            : sending
                              ? "Отправляем оценку…"
                              : isPending
                                ? "Сохраняем черновик…"
                                : dirty
                                  ? "Есть несохранённые изменения"
                                  : submission
                                    ? submission.has_unsubmitted_changes
                                        ? "Правки сохранены в черновике"
                                        : "Оценка отправлена"
                                    : "Черновик сохранён"}
                    </p>
                    {submission && (
                        <p className="mb-3 text-sm text-app-muted">
                            До закрытия окна можно исправить оценку. В итог войдёт только последняя
                            отправленная оценка.
                        </p>
                    )}
                    <div className="flex flex-wrap justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setError(undefined);
                                setAnswers(
                                    answers.map((answer) => ({
                                        ...answer,
                                        score: null,
                                        comment: null,
                                    })),
                                );
                            }}
                            disabled={
                                lockFields ||
                                !answers.some((answer) => answer.score !== null || answer.comment)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-[#CFCFCF] dark:border-app-border bg-white dark:bg-app-surface px-3 py-2 text-sm font-medium text-[#0A0A0A] dark:text-app-text hover:bg-gray-50 dark:hover:bg-app-ghost disabled:opacity-50"
                        >
                            <Icon name="restart" size={16} /> Сбросить
                        </button>
                        {dirty && error && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={onClose}
                                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text"
                            >
                                Закрыть без сохранения
                            </button>
                        )}
                        {dirty && error && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => mutate({ submit: false, snapshot: answers })}
                                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text"
                            >
                                Повторить сохранение
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={
                                lockFields ||
                                !answers.length ||
                                answers.some((answer) => answer.score === null) ||
                                Boolean(
                                    submission &&
                                    !isPending &&
                                    !dirty &&
                                    !submission.has_unsubmitted_changes,
                                )
                            }
                            onClick={submitAssessment}
                            className="cursor-pointer rounded-lg bg-[#155DFC] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {sending
                                ? "Отправляем…"
                                : submission
                                  ? "Отправить правки"
                                  : "Отправить оценку"}
                        </button>
                    </div>
                </div>
                <div ref={setTooltipContainer} />
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}
