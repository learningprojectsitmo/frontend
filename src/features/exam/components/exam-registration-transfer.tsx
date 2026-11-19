import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/dialog";
import { examApi, getExamErrorMessage, invalidateExam, useExams, useExamSlots } from "@/lib/exams";
import type { Registration } from "@/types/exam";
import { formatExamDate, isExamRegistrationOpen } from "../exam-display";

type Props = {
    registration: Registration;
    projectName?: string;
    self: boolean;
    sourceOpen: boolean;
    now: number;
    onClose: () => void;
};

export function ExamRegistrationTransfer({ registration, projectName, self, sourceOpen, now, onClose }: Props) {
    const { workspace_id: workspaceId, exam_id: examId } = registration;
    const exams = useExams(workspaceId, "published");
    const [targetId, setTargetId] = useState(0);
    const [slotId, setSlotId] = useState(0);
    const [reason, setReason] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string>();
    const client = useQueryClient();
    const eligible = exams.data?.items.filter((exam) =>
        (self || exam.id !== examId) &&
        exam.configuration.project_type_ids.includes(registration.project_type_id_at_registration) &&
        (!self || isExamRegistrationOpen(exam, now)),
    ) ?? [];
    const target = eligible.find((exam) => exam.id === targetId);
    const slots = useExamSlots(workspaceId, target?.id ?? 0);
    const freeSlots = slots.data?.items.filter((slot) => slot.is_available &&
        (targetId !== examId || slot.id !== registration.slot_id)) ?? [];
    const canSubmit = sourceOpen && !registration.started_at && registration.status === "active" && target && slots.data && !slots.isError && reason.trim() &&
        (slots.data.items.length ? freeSlots.some((slot) => slot.id === slotId) : targetId !== examId);

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
            setError(getExamErrorMessage(failure) ?? "Не удалось перенести запись. Проверьте, что экзамен и слот ещё доступны.");
        } finally {
            await Promise.all([
                invalidateExam(client, workspaceId, examId),
                ...(targetId === examId ? [] : [invalidateExam(client, workspaceId, targetId)]),
            ]);
            setPending(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
            <DialogContent className="w-[calc(100%-2rem)]">
                <DialogHeader><DialogTitle>Перенести запись</DialogTitle></DialogHeader>
                <form className="mt-4 grid gap-4" onSubmit={submit}>
                    {projectName && <p className="text-sm text-app-muted">{projectName}</p>}
                    {exams.isLoading ? <p role="status" className="text-sm text-app-muted">Загружаем экзамены…</p>
                        : exams.isError ? <p role="alert" className="text-sm text-app-muted">Не удалось загрузить экзамены.</p>
                        : !eligible.length ? <p className="text-sm text-app-muted">Нет доступных экзаменов для переноса.</p>
                        : (
                            <label className="grid gap-1 text-sm">
                                Экзамен
                                <select value={targetId} disabled={pending} onChange={(event) => {
                                    setTargetId(Number(event.target.value));
                                    setSlotId(0);
                                    setError(undefined);
                                }} className="min-w-0 rounded-lg border border-app-border bg-app-surface p-2">
                                    <option value={0} disabled>Выберите экзамен</option>
                                    {eligible.map((exam) => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.configuration.title} · {formatExamDate(exam.configuration.starts_at)}
                                            {exam.id === examId ? " (текущий)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                    {target && (
                        slots.isLoading ? <p role="status" className="text-sm text-app-muted">Проверяем слоты…</p>
                            : slots.isError ? <p role="alert" className="text-sm text-app-muted">Не удалось загрузить слоты.</p>
                            : !slots.data?.items.length ? <p className="text-sm text-app-muted">
                                {targetId === examId ? "В этом экзамене нет слотов для переноса." : "Команда будет добавлена в очередь без места в расписании."}
                            </p>
                            : freeSlots.length ? (
                                <label className="grid gap-1 text-sm">
                                    Свободный слот
                                    <select value={slotId} disabled={pending} onChange={(event) => setSlotId(Number(event.target.value))}
                                        className="rounded-lg border border-app-border bg-app-surface p-2">
                                        <option value={0} disabled>Выберите время</option>
                                        {freeSlots.map((slot) => <option key={slot.id} value={slot.id}>{formatExamDate(slot.starts_at)}</option>)}
                                    </select>
                                </label>
                            ) : <p className="text-sm text-app-muted">Свободных слотов нет.</p>
                    )}
                    {target && (
                        <label className="grid gap-1 text-sm">
                            Причина переноса
                            <textarea required maxLength={1000} rows={2} value={reason} disabled={pending}
                                onChange={(event) => setReason(event.target.value)}
                                className="rounded-lg border border-app-border bg-app-surface p-2" />
                        </label>
                    )}
                    {!sourceOpen && <p role="status" className="text-sm text-app-muted">Период записи исходного экзамена закончился.</p>}
                    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="hug36" disabled={pending} onClick={onClose}>Отмена</Button>
                        <Button type="submit" variant="blue" size="hug36" loading={pending} disabled={!canSubmit}>Перенести</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
