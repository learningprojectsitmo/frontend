import { Tooltip } from "@base-ui/react/tooltip";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useId, useState } from "react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog/dialog";
import { Icon } from "@/components/ui/icons";
import { useProjectTypeQuestions } from "@/lib/exams";
import type { QuestionLevel } from "@/types/exam";

type ExamAssessmentProps = {
    workspaceId: number;
    typeId: number;
    projectName: string;
};

export function ExamAssessment(props: ExamAssessmentProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="cursor-pointer rounded-lg bg-transparent px-3 py-2 text-[13px] font-semibold text-[#155DFC] hover:bg-[#155DFC12]">
                Оценить
            </DialogTrigger>
            {open && <AssessmentContent {...props} />}
        </Dialog>
    );
}

function AssessmentContent({ workspaceId, typeId, projectName }: ExamAssessmentProps) {
    const submitNoteId = useId();
    const criteriaQuery = useProjectTypeQuestions(workspaceId, typeId);
    const [scores, setScores] = useState<Record<number, QuestionLevel["score"]>>({});
    const [tooltipContainer, setTooltipContainer] = useState<HTMLDivElement | null>(null);

    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[300] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-8 shadow-xl">
                <DialogClose aria-label="Закрыть" className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg text-[#4A5565] hover:bg-gray-100">
                    <Icon name="cross" size={20} />
                </DialogClose>
                <div className="min-h-0 overflow-y-auto">
                    <DialogTitle className="break-words pr-4 text-[28px] font-semibold leading-tight text-[#0A0A0A]">
                        {projectName}
                    </DialogTitle>
                    <DialogPrimitive.Description className="mb-3 mt-3 text-[17px] text-[#4A5565]">
                        Оцените команду по критериям ниже
                    </DialogPrimitive.Description>
                    {criteriaQuery.isPending ? (
                        <p role="status" className="text-[#4A5565]">Загружаем критерии…</p>
                    ) : criteriaQuery.isError ? (
                        <p role="alert" className="text-[#4A5565]">Не удалось загрузить критерии оценивания.</p>
                    ) : !criteriaQuery.data.questions.length ? (
                        <p className="text-[#4A5565]">Для этого типа проекта пока нет критериев.</p>
                    ) : (
                        <Tooltip.Provider delay={100}>
                            <div className="grid gap-6">
                                {criteriaQuery.data.questions.map((question) => (
                                    <fieldset key={question.id} className="min-w-0">
                                        <legend className="break-words text-[18px] font-medium text-[#0A0A0A]">{question.text}</legend>
                                        {question.description && <p className="mt-1 break-words text-[15px] text-[#4A5565]">{question.description}</p>}
                                        <div className="mt-3 grid grid-cols-5 divide-x divide-[#0000001A] overflow-hidden rounded-xl border border-[#CFCFCF] bg-[#F9FAFB]">
                                            {question.levels.map((level) => (
                                                <Tooltip.Root key={level.score} disabled={!level.description}>
                                                    <Tooltip.Trigger
                                                        type="button"
                                                        aria-pressed={scores[question.id] === level.score}
                                                        onClick={() => setScores((current) => ({ ...current, [question.id]: level.score }))}
                                                        className="grid h-[49px] min-w-0 place-items-center text-[18px] text-[#0A0A0A] hover:bg-[#0000001A] focus-visible:-outline-offset-2 aria-pressed:bg-[#030213] aria-pressed:text-white"
                                                    >
                                                        {level.score}
                                                    </Tooltip.Trigger>
                                                    {tooltipContainer && level.description && (
                                                        <Tooltip.Portal container={tooltipContainer}>
                                                            <Tooltip.Positioner positionMethod="fixed" sideOffset={8} className="z-10">
                                                                <Tooltip.Popup className="max-w-[min(280px,var(--available-width))] rounded-lg border border-[#CFCFCF] bg-white px-3 py-2 text-[13px] text-[#0A0A0A] shadow-lg">
                                                                    <Tooltip.Arrow className="data-[side=top]:-bottom-[5px] data-[side=bottom]:-top-[5px] data-[side=left]:-right-[5px] data-[side=right]:-left-[5px]">
                                                                        <span className="block size-2 rotate-45 bg-white" />
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
                <div className="mt-5 shrink-0 border-t border-[#ECECF0] pt-4">
                    <p id={submitNoteId} className="mb-3 text-sm text-[#4A5565]">Отправка оценок пока недоступна.</p>
                    <div className="flex flex-wrap justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => setScores({})}
                            disabled={!Object.keys(scores).length}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#CFCFCF] bg-white px-3 py-2 text-sm font-medium text-[#0A0A0A] hover:bg-gray-50 disabled:opacity-50"
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
