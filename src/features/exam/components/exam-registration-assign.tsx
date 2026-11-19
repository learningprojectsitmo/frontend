import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/dialog";
import { examApi, getExamErrorMessage, invalidateExam, useExamSlots } from "@/lib/exams";
import { useProject, useProjectsList } from "@/lib/projects";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Exam } from "@/types/exam";
import { formatExamDate } from "../exam-display";

export function ExamRegistrationAssign({ exam, assignedIds, onClose }: {
    exam: Exam;
    assignedIds: ReadonlySet<number>;
    onClose: () => void;
}) {
    const { workspace_id: workspaceId, id: examId } = exam;
    const client = useQueryClient();
    const [search, setSearch] = useState("");
    const [projectId, setProjectId] = useState(0);
    const [slotId, setSlotId] = useState(0);
    const filter = useDebouncedValue(search.trim());
    const projects = useProjectsList(String(workspaceId), { page: 1, limit: 100, search: filter || undefined });
    const project = useProject(projectId ? String(projectId) : "");
    const slots = useExamSlots(workspaceId, examId);
    const candidates = projects.data?.items.filter((item) => !assignedIds.has(item.id)) ?? [];
    const freeSlots = slots.data?.items.filter((slot) => slot.is_available) ?? [];
    const typeId = project.data?.project_type_id;
    const validProject = project.isSuccess && project.data.workspace_id === workspaceId &&
        typeId != null && exam.configuration.project_type_ids.includes(typeId) && !assignedIds.has(projectId);
    const canAssign = exam.status === "published" && validProject && slots.isSuccess &&
        (slots.data.items.length === 0 || freeSlots.some((slot) => slot.id === slotId));

    const assign = useMutation({
        mutationFn: () => examApi.register(workspaceId, examId, {
            project_id: projectId,
            slot_id: slots.data?.items.length ? slotId : null,
        }),
        onSuccess: async () => {
            await invalidateExam(client, workspaceId, examId);
            toast.success("Команда назначена");
            onClose();
        },
        onError: async () => {
            await invalidateExam(client, workspaceId, examId);
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (canAssign && !assign.isPending) assign.mutate();
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !assign.isPending) onClose(); }}>
            <DialogContent className="w-[calc(100%-2rem)]">
                <DialogHeader><DialogTitle>Назначить команду</DialogTitle></DialogHeader>
                <form className="mt-4 grid gap-4" onSubmit={submit}>
                    <label className="grid gap-1 text-sm">
                        Поиск проекта
                        <input value={search} disabled={assign.isPending} onChange={(event) => {
                            setSearch(event.target.value);
                            setProjectId(0);
                        }} className="rounded-lg border border-app-border bg-app-surface p-2" />
                    </label>
                    <label className="grid gap-1 text-sm">
                        Проект
                        <select value={projectId} disabled={assign.isPending} onChange={(event) => {
                            setProjectId(Number(event.target.value));
                            assign.reset();
                        }} className="rounded-lg border border-app-border bg-app-surface p-2">
                            <option value={0} disabled>Выберите проект</option>
                            {candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </label>
                    {projects.isLoading && <p role="status" className="text-sm text-app-muted">Загружаем проекты…</p>}
                    {projects.isError && <p role="alert" className="text-sm text-app-muted">Не удалось загрузить проекты.</p>}
                    {projects.isSuccess && !candidates.length && <p className="text-sm text-app-muted">Подходящих записей по этому поиску нет.</p>}
                    {projectId > 0 && project.isError && <p role="alert" className="text-sm text-app-muted">Не удалось проверить проект.</p>}
                    {projectId > 0 && project.isSuccess && !validProject && <p role="status" className="text-sm text-app-muted">Проект уже записан или его тип не включён в этот экзамен.</p>}
                    {slots.isLoading && <p role="status" className="text-sm text-app-muted">Проверяем слоты…</p>}
                    {slots.isError && <p role="alert" className="text-sm text-app-muted">Не удалось загрузить слоты.</p>}
                    {slots.isSuccess && (slots.data.items.length === 0 ? (
                        <p className="text-sm text-app-muted">Команда будет добавлена в очередь без места в расписании.</p>
                    ) : freeSlots.length ? (
                        <label className="grid gap-1 text-sm">
                            Свободный слот
                            <select value={slotId} disabled={assign.isPending} onChange={(event) => {
                                setSlotId(Number(event.target.value));
                                assign.reset();
                            }} className="rounded-lg border border-app-border bg-app-surface p-2">
                                <option value={0} disabled>Выберите время</option>
                                {freeSlots.map((slot) => <option key={slot.id} value={slot.id}>{formatExamDate(slot.starts_at)}</option>)}
                            </select>
                        </label>
                    ) : <p className="text-sm text-app-muted">Свободных слотов нет.</p>)}
                    {assign.isError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                        {getExamErrorMessage(assign.error) ?? "Не удалось назначить команду. Проверьте данные и попробуйте ещё раз."}
                    </p>}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" size="hug36" disabled={assign.isPending} onClick={onClose}>Отмена</Button>
                        <Button type="submit" variant="blue" size="hug36" loading={assign.isPending} disabled={!canAssign}>Назначить</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
