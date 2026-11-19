import { Tooltip } from "@base-ui/react/tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog/dialog";
import { Icon } from "@/components/ui/icons";
import { useProjectTypeQuestions } from "@/lib/exams";
import { useUser } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import { canPreviewExamAssessment } from "../exam-display";
import type { QuestionLevel } from "@/types/exam";

type ExamAssessmentProps = {
    workspaceId: number;
    typeId: number;
    projectId: number;
    projectName: string;
    remainingSeconds: number;
};

export function ExamAssessment(props: ExamAssessmentProps) {
    const userId = useUser().data?.id;
    const project = useQuery({
        queryKey: [...queryKeys.project.detail(props.projectId), "exam-assessment", userId],
        queryFn: () => getProject(String(props.projectId)),
        enabled: userId !== undefined,
        retry: false,
    });
    if (!project.isSuccess || !canPreviewExamAssessment(project.data, props.workspaceId, userId)) return null;
    return <AssessmentDialog {...props} />;
}

function AssessmentDialog(props: ExamAssessmentProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="cursor-pointer rounded-lg bg-transparent px-3 py-2 text-[13px] font-semibold text-[#155DFC] dark:text-blue-300 hover:bg-[#155DFC12] dark:hover:bg-blue-400/15">
                Оценить
            </DialogTrigger>
            {open && <AssessmentContent {...props} />}
        </Dialog>
    );
}

function AssessmentContent({ workspaceId, typeId, projectName, remainingSeconds }: ExamAssessmentProps) {
    const submitNoteId = useId();
    const criteriaQuery = useProjectTypeQuestions(workspaceId, typeId);
    const [scores, setScores] = useState<Record<number, QuestionLevel["score"]>>({});
    const questions = criteriaQuery.data?.questions ?? [];
    const points = questions.reduce((sum, question) => sum + (scores[question.id] ?? 0), 0);
    const maximum = questions.length * (criteriaQuery.data?.max_score ?? 0);
    const timeLeft = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;
    const [tooltipContainer, setTooltipContainer] = useState<HTMLDivElement | null>(null);

    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[300] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white dark:border dark:border-app-border dark:bg-app-surface p-8 shadow-xl">
                <DialogClose aria-label="Закрыть" className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg text-[#4A5565] dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-app-ghost">
                    <Icon name="cross" size={20} />
                </DialogClose>
                <div className="min-h-0 overflow-y-auto">
                    <DialogTitle className="break-words pr-4 text-[28px] font-semibold leading-tight text-[#0A0A0A] dark:text-app-text">
                        {projectName}
                    </DialogTitle>
                    <DialogPrimitive.Description className="mb-3 mt-3 text-[17px] text-[#4A5565] dark:text-slate-300">
                        Оцените команду по критериям ниже
                    </DialogPrimitive.Description>
                    {criteriaQuery.isPending ? (
                        <p role="status" className="text-[#4A5565] dark:text-slate-300">Загружаем критерии…</p>
                    ) : criteriaQuery.isError ? (
                        <p role="alert" className="text-[#4A5565] dark:text-slate-300">Не удалось загрузить критерии оценивания.</p>
                    ) : !criteriaQuery.data.questions.length ? (
                        <p className="text-[#4A5565] dark:text-slate-300">Для этого типа проекта пока нет критериев.</p>
                    ) : (
                        <Tooltip.Provider delay={100}>
                            <div className="grid gap-6">
                                {criteriaQuery.data.questions.map((question) => (
                                    <fieldset key={question.id} className="min-w-0">
                                        <legend className="break-words text-[18px] font-medium text-[#0A0A0A] dark:text-app-text">{question.text}</legend>
                                        {question.description && <p className="mt-1 break-words text-[15px] text-[#4A5565] dark:text-slate-300">{question.description}</p>}
                                        <div className="mt-3 grid grid-cols-5 divide-x divide-[#0000001A] dark:divide-app-border overflow-hidden rounded-xl border border-[#CFCFCF] dark:border-app-border bg-[#F9FAFB] dark:bg-app-ghost">
                                            {question.levels.map((level) => (
                                                <Tooltip.Root key={level.score} disabled={!level.description}>
                                                    <Tooltip.Trigger
                                                        type="button"
                                                        aria-pressed={scores[question.id] === level.score}
                                                        onClick={() => setScores((current) => ({ ...current, [question.id]: level.score }))}
                                                        className="grid h-[49px] min-w-0 place-items-center text-[18px] text-[#0A0A0A] dark:text-app-text hover:bg-[#0000001A] dark:hover:bg-slate-700 focus-visible:-outline-offset-2 aria-pressed:bg-[#030213] dark:aria-pressed:bg-blue-600 aria-pressed:text-white"
                                                    >
                                                        {level.score}
                                                    </Tooltip.Trigger>
                                                    {tooltipContainer && level.description && (
                                                        <Tooltip.Portal container={tooltipContainer}>
                                                            <Tooltip.Positioner positionMethod="fixed" sideOffset={8} className="z-10">
                                                                <Tooltip.Popup className="max-w-[min(280px,var(--available-width))] rounded-lg border border-[#CFCFCF] dark:border-app-border bg-white dark:bg-app-surface px-3 py-2 text-[13px] text-[#0A0A0A] dark:text-app-text shadow-lg">
                                                                    <Tooltip.Arrow className="data-[side=top]:-bottom-[5px] data-[side=bottom]:-top-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px]">
                                                                        <span className="block size-2 rotate-45 bg-white dark:bg-app-surface" />
                                                                    </Tooltip.Arrow>
                                                                    {level.description}
                                                                </Tooltip.Popup>
                                                            </Tooltip.Positioner>
                                                        </Tooltip.Portal>
                                                    )}
                                                </Tooltip.Root>
                                            ))}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        </Tooltip.Provider>
                    )}
                </div>
                <div className="mt-5 shrink-0 border-t border-[#ECECF0] dark:border-app-border pt-4">
                    <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm font-medium text-[#182844] dark:text-blue-100">
                        {maximum > 0 && <output>Баллы по критериям: {points} из {maximum}</output>}
                        <span role="timer" aria-label="До закрытия оценивания" className="tabular-nums">До закрытия: {timeLeft}</span>
                    </div>
                    <p id={submitNoteId} className="mb-3 text-sm text-[#4A5565] dark:text-slate-300">Отправка оценок пока недоступна.</p>
                    <div className="flex flex-wrap justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => setScores({})}
                            disabled={!Object.keys(scores).length}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#CFCFCF] dark:border-app-border bg-white dark:bg-app-surface px-3 py-2 text-sm font-medium text-[#0A0A0A] dark:text-app-text hover:bg-gray-50 dark:hover:bg-app-ghost disabled:opacity-50"
                        >
                            <Icon name="restart" size={16} /> Сбросить
                        </button>
                        <button type="button" disabled aria-describedby={submitNoteId} className="rounded-lg bg-[#155DFC] px-3 py-2 text-sm font-medium text-white opacity-60">
                            Отправить
                        </button>
                    </div>
                </div>
                <div ref={setTooltipContainer} />
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}
