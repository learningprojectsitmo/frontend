import { useId, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { Textarea } from "@/components/ui/textarea/textarea";
import { examApi, getExamErrorMessage, invalidateExam, useExams, useExamSlots } from "@/lib/exams";
import { useProject } from "@/lib/projects";
import type { Exam, Registration } from "@/types/exam";
import { formatExamDate, isExamRegistrationOpen } from "../exam-display";

const selectTriggerClass =
    "min-w-0 gap-2 rounded-[12px] border-app-border text-app-text [&>svg]:shrink-0";
const selectContentClass =
    "z-[400] w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)] rounded-[12px] border-app-border text-app-text [&>[data-radix-select-viewport]]:h-auto";

type Props = {
    registration: Registration;
    sourceExam: Exam;
    projectName?: string;
    self: boolean;
    sourceOpen: boolean;
    now: number;
    onClose: () => void;
};

export function ExamRegistrationTransfer({
    registration,
    sourceExam,
    projectName,
    self,
    sourceOpen,
    now,
    onClose,
}: Props) {
    const fieldId = useId();
    const { workspace_id: workspaceId, exam_id: examId } = registration;
    const exams = useExams(workspaceId, "published");
    const project = useProject(String(registration.project_id));
    const projectType = project.data?.project_type_id;
    const [targetId, setTargetId] = useState(examId);
    const [slotId, setSlotId] = useState(0);
    const [reason, setReason] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string>();
    const client = useQueryClient();
    const destinations =
        exams.data?.items.filter(
            (exam) =>
                exam.id !== examId &&
                projectType != null &&
                exam.configuration.project_type_ids.includes(projectType) &&
                (!self || isExamRegistrationOpen(exam, now)),
        ) ?? [];
    const target =
        targetId === examId ? sourceExam : destinations.find((exam) => exam.id === targetId);
    const validType =
        projectType != null && sourceExam.configuration.project_type_ids.includes(projectType);
    const slots = useExamSlots(workspaceId, target?.id ?? 0);
    const freeSlots =
        slots.data?.items.filter(
            (slot) =>
                slot.is_available && (targetId !== examId || slot.id !== registration.slot_id),
        ) ?? [];
    const canSubmit =
        sourceOpen &&
        validType &&
        !project.isError &&
        !registration.started_at &&
        registration.status === "active" &&
        target &&
        slots.data &&
        !slots.isError &&
        reason.trim() &&
        (slots.data.items.length
            ? freeSlots.some((slot) => slot.id === slotId)
            : targetId !== examId);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit || pending) return;
        setPending(true);
        setError(undefined);
        try {
            await examApi.moveRegistration(workspaceId, examId, registration, slotId || null, {
                targetExamId: target.id,
                self,
                reason: reason.trim(),
            });
            toast.success("Запись перенесена");
            onClose();
        } catch (failure) {
            setError(
                getExamErrorMessage(failure) ??
                    "Не удалось перенести запись. Проверьте, что экзамен и слот ещё доступны.",
            );
        } finally {
            await Promise.all([
                invalidateExam(client, workspaceId, examId),
                ...(targetId === examId ? [] : [invalidateExam(client, workspaceId, targetId)]),
            ]);
            setPending(false);
        }
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !pending) onClose();
            }}
        >
            <DialogContent className="w-[calc(100%-2rem)]">
                <DialogHeader>
                    <DialogTitle>Перенести запись</DialogTitle>
                </DialogHeader>
                <form className="mt-4 grid gap-4" onSubmit={submit}>
                    {projectName && <p className="text-sm text-app-muted">{projectName}</p>}

                    <div className="grid min-w-0 gap-1.5">
                        <Label htmlFor={`${fieldId}-exam`}>Куда перенести</Label>
                        <Select
                            value={target ? String(targetId) : ""}
                            disabled={pending}
                            onValueChange={(value) => {
                                setTargetId(Number(value));
                                setSlotId(0);
                                setError(undefined);
                            }}
                        >
                            <SelectTrigger id={`${fieldId}-exam`} className={selectTriggerClass}>
                                <span className="min-w-0 truncate">
                                    <SelectValue placeholder="Выберите экзамен" />
                                </span>
                            </SelectTrigger>
                            <SelectContent className={selectContentClass}>
                                {[sourceExam, ...destinations].map((exam) => (
                                    <SelectItem
                                        key={exam.id}
                                        value={String(exam.id)}
                                        className="break-words"
                                    >
                                        {exam.configuration.title} ·{" "}
                                        {formatExamDate(exam.configuration.starts_at)}
                                        {exam.id === examId ? " (текущий)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {project.isLoading && (
                        <p role="status" className="text-sm text-app-muted">
                            Проверяем тип проекта…
                        </p>
                    )}
                    {project.isError && (
                        <p role="alert" className="text-sm text-app-muted">
                            Не удалось проверить тип проекта.
                        </p>
                    )}
                    {project.isSuccess && !validType && (
                        <p role="status" className="text-sm text-app-muted">
                            Тип проекта больше не подходит для исходного экзамена.
                        </p>
                    )}
                    {exams.isLoading && (
                        <p role="status" className="text-sm text-app-muted">
                            Загружаем другие экзамены…
                        </p>
                    )}
                    {exams.isError && (
                        <p role="alert" className="text-sm text-app-muted">
                            Не удалось загрузить другие экзамены.
                        </p>
                    )}
                    {target &&
                        (slots.isLoading ? (
                            <p role="status" className="text-sm text-app-muted">
                                Проверяем слоты…
                            </p>
                        ) : slots.isError ? (
                            <p role="alert" className="text-sm text-app-muted">
                                Не удалось загрузить слоты.
                            </p>
                        ) : !slots.data?.items.length ? (
                            <p className="text-sm text-app-muted">
                                {targetId === examId
                                    ? "В текущем экзамене слотов нет. Чтобы перенести запись, выберите другой экзамен."
                                    : "Команда будет добавлена в очередь без места в расписании."}
                            </p>
                        ) : freeSlots.length ? (
                            <div className="grid min-w-0 gap-1.5">
                                <Label htmlFor={`${fieldId}-slot`}>Новое время защиты</Label>
                                <Select
                                    value={
                                        freeSlots.some((slot) => slot.id === slotId)
                                            ? String(slotId)
                                            : ""
                                    }
                                    disabled={pending}
                                    onValueChange={(value) => {
                                        setSlotId(Number(value));
                                        setError(undefined);
                                    }}
                                >
                                    <SelectTrigger
                                        id={`${fieldId}-slot`}
                                        className={selectTriggerClass}
                                    >
                                        <span className="min-w-0 truncate">
                                            <SelectValue placeholder="Выберите время" />
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClass}>
                                        {freeSlots.map((slot) => (
                                            <SelectItem key={slot.id} value={String(slot.id)}>
                                                {formatExamDate(slot.starts_at)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <p className="text-sm text-app-muted">Свободных слотов нет.</p>
                        ))}
                    {target && (targetId !== examId || freeSlots.length > 0) && (
                        <div className="grid gap-1.5">
                            <Label htmlFor={`${fieldId}-reason`}>Причина переноса</Label>
                            <Textarea
                                id={`${fieldId}-reason`}
                                required
                                maxLength={1000}
                                rows={3}
                                value={reason}
                                disabled={pending}
                                onChange={(event) => setReason(event.target.value)}
                                className="min-h-24 resize-y"
                            />
                        </div>
                    )}
                    {!sourceOpen && (
                        <p role="status" className="text-sm text-app-muted">
                            Период записи исходного экзамена закончился.
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                            {error}
                        </p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="hug36"
                            disabled={pending}
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="blue"
                            size="hug36"
                            loading={pending}
                            disabled={!canSubmit}
                        >
                            Перенести
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
