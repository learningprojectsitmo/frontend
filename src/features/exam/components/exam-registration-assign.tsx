import { shareExamQueue } from "@/features/exam/exam-queue-snapshot";
import { useRef, useState, type FormEvent } from "react";
import {
    queryOptions,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/dialog";
import {
    examApi,
    getExamErrorCode,
    getExamErrorMessage,
    invalidateExam,
    useExamSlots,
} from "@/lib/exams";
import { getProject, getProjectsList } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import { ExamProjectSelect } from "./exam-project-select";
import type { Exam, ExamSlot } from "@/types/exam";
import { formatExamDate } from "../exam-display";
import { canBookExamSlot, getSlotInterval } from "../exam-schedule";

export function ExamRegistrationAssign({
    exam,
    assignedIds,
    onQueue,
    onClose,
}: {
    exam: Exam;
    assignedIds: ReadonlySet<number>;
    onQueue: () => void;
    onClose: () => void;
}) {
    const { workspace_id: workspaceId, id: examId } = exam;
    const client = useQueryClient();
    const [search, setSearch] = useState("");
    const [projectId, setProjectId] = useState(0);
    const [chosenSlot, setChosenSlot] = useState<ExamSlot>();
    const [selectOpen, setSelectOpen] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const exams = useQuery({
        queryKey: queryKeys.exams.list(workspaceId, "published"),
        queryFn: () => examApi.list(workspaceId, "published"),
        refetchOnMount: "always",
    });
    const otherQueues = useQueries({
        queries: (exams.data?.items ?? [])
            .filter((item) => item.id !== examId)
            .map((item) =>
                queryOptions({
                    queryKey: queryKeys.exams.queue(workspaceId, item.id),
                    queryFn: () => examApi.queue(workspaceId, item.id),
                    structuralSharing: shareExamQueue,
                    refetchOnMount: "always",
                    refetchInterval: 15_000,
                }),
            ),
    });
    const projects = useQuery({
        queryKey: [
            "exam-assignment-projects",
            workspaceId,
            examId,
            exam.configuration.project_type_ids,
            [...assignedIds].sort((a, b) => a - b),
        ],
        queryFn: async () => {
            const eligible = [];
            let hasAssigned = false;
            for (let page = 1, totalPages = 1; page <= totalPages; page++) {
                const list = await getProjectsList(String(workspaceId), { page, limit: 100 });
                totalPages = list.total_pages;
                const unassigned = list.items.filter((item) => !assignedIds.has(item.id));
                hasAssigned ||= unassigned.length < list.items.length;
                // The project list omits project_type_id, so check unassigned projects in batches.
                for (let offset = 0; offset < unassigned.length; offset += 8) {
                    const details = await Promise.all(
                        unassigned
                            .slice(offset, offset + 8)
                            .map((item) => getProject(String(item.id))),
                    );
                    eligible.push(
                        ...details
                            .filter(
                                (item) =>
                                    item.workspace_id === workspaceId &&
                                    item.project_type_id != null &&
                                    exam.configuration.project_type_ids.includes(
                                        item.project_type_id,
                                    ),
                            )
                            .map(({ id, name }) => ({ id, name })),
                    );
                }
            }
            return { eligible, hasAssigned };
        },
    });
    const slots = useExamSlots(workspaceId, examId, true, 5000);
    const otherAssignedIds = new Set(
        otherQueues.flatMap((query) => query.data?.items.map((item) => item.project_id) ?? []),
    );
    const eligible = projects.data?.eligible ?? [];
    const teams = eligible.filter((project) => !otherAssignedIds.has(project.id));
    const loading =
        projects.isPending ||
        slots.isPending ||
        !exams.isFetchedAfterMount ||
        otherQueues.some((query) => !query.isFetchedAfterMount);
    const loadFailed =
        projects.isError ||
        slots.isError ||
        exams.isError ||
        otherQueues.some((query) => query.isError);
    const selected = teams.find((team) => team.id === projectId);
    const term = search.trim().toLocaleLowerCase();
    const candidates = teams.filter((team) => team.name.toLocaleLowerCase().includes(term));
    const defenseSlots = slots.data?.items.filter((slot) => slot.kind !== "break") ?? [];
    const freeSlots = defenseSlots.filter((slot) => slot.is_available);
    const currentSlot = chosenSlot && freeSlots.find((slot) => canBookExamSlot(slot, chosenSlot));
    const canAssign =
        exam.status === "published" &&
        Boolean(selected) &&
        !loading &&
        !loadFailed &&
        slots.isSuccess &&
        (chosenSlot ? Boolean(currentSlot) : defenseSlots.length === 0);

    const assign = useMutation({
        mutationFn: () =>
            examApi.register(workspaceId, examId, {
                project_id: projectId,
                slot_id: chosenSlot?.id ?? null,
                ...(chosenSlot && { expected_slot: getSlotInterval(chosenSlot) }),
            }),
        onSuccess: async () => {
            await invalidateExam(client, workspaceId, examId);
            toast.success("Команда назначена");
            onClose();
        },
        onError: async (failure) => {
            await Promise.all([
                invalidateExam(client, workspaceId, examId),
                ...(getExamErrorCode(failure) === "project_already_registered"
                    ? otherQueues.map((query) => query.refetch())
                    : []),
            ]);
        },
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (canAssign && !assign.isPending) assign.mutate();
    };

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !assign.isPending) onClose();
            }}
        >
            <DialogContent
                ref={dialogRef}
                className="w-[calc(100%-2rem)]"
                onEscapeKeyDown={(event) => {
                    if (!selectOpen) return;
                    event.preventDefault();
                    setSelectOpen(false);
                }}
            >
                <DialogHeader>
                    <DialogTitle>Назначить команду</DialogTitle>
                </DialogHeader>
                {loadFailed ? (
                    <div className="mt-4 grid gap-4">
                        <p role="alert" className="text-sm text-app-muted">
                            Не удалось проверить доступность команд или слотов.
                        </p>
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() =>
                                void Promise.all([
                                    projects.refetch(),
                                    exams.refetch(),
                                    slots.refetch(),
                                    ...otherQueues.map((query) => query.refetch()),
                                ])
                            }
                        >
                            Повторить
                        </Button>
                    </div>
                ) : loading ? (
                    <p role="status" className="mt-4 text-sm text-app-muted">
                        Проверяем, какие команды можно назначить…
                    </p>
                ) : !teams.length || (defenseSlots.length && !freeSlots.length) ? (
                    <div className="mt-4 grid gap-4">
                        <p role="status" className="text-sm text-app-muted">
                            {teams.length
                                ? "Свободных слотов нет."
                                : eligible.length
                                  ? "Все подходящие команды уже записаны на экзамен."
                                  : projects.data?.hasAssigned
                                    ? "Все команды уже назначены"
                                    : "В пространстве нет команд подходящего типа."}
                        </p>
                        <Button type="button" variant="outline" size="hug36" onClick={onQueue}>
                            Перейти к очереди выступлений
                        </Button>
                    </div>
                ) : (
                    <form className="mt-4 grid min-w-0 grid-cols-1 gap-4" onSubmit={submit}>
                        <div
                            className="grid min-w-0 grid-cols-1 gap-1 text-sm"
                            role="group"
                            aria-label="Команда"
                        >
                            <span className="font-medium">Команда</span>
                            <ExamProjectSelect
                                open={selectOpen}
                                onOpenChange={(open) => {
                                    setSelectOpen(open);
                                    if (open) setSearch("");
                                }}
                                label={selected?.name ?? "Выберите команду"}
                                disabled={assign.isPending}
                                container={dialogRef}
                                search={search}
                                onSearch={setSearch}
                                projects={candidates}
                                selectedId={selected?.id}
                                onSelect={(id) => {
                                    setProjectId(id);
                                    setSelectOpen(false);
                                    assign.reset();
                                }}
                            />
                        </div>
                        {slots.isSuccess &&
                            (defenseSlots.length === 0 ? (
                                <p className="text-sm text-app-muted">
                                    Команда будет добавлена в очередь без места в расписании.
                                </p>
                            ) : (
                                <label className="grid min-w-0 grid-cols-1 gap-1 text-sm">
                                    Свободный слот
                                    <select
                                        value={currentSlot?.id ?? 0}
                                        disabled={assign.isPending}
                                        onChange={(event) => {
                                            setChosenSlot(
                                                freeSlots.find(
                                                    (slot) =>
                                                        slot.id === Number(event.target.value),
                                                ),
                                            );
                                            assign.reset();
                                        }}
                                        className="w-full min-w-0 rounded-lg border border-app-border bg-app-surface p-2"
                                    >
                                        <option value={0} disabled>
                                            Выберите время
                                        </option>
                                        {freeSlots.map((slot) => (
                                            <option key={slot.id} value={slot.id}>
                                                {formatExamDate(slot.starts_at)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        {chosenSlot && !currentSlot && (
                            <p role="status" className="text-sm text-app-muted">
                                Время слота изменилось. Выберите слот заново.
                            </p>
                        )}
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="hug36"
                                disabled={assign.isPending}
                                onClick={onClose}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                variant="blue"
                                size="hug36"
                                loading={assign.isPending}
                                disabled={!canAssign}
                            >
                                Назначить
                            </Button>
                        </div>
                    </form>
                )}
                {assign.isError && (
                    <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">
                        {getExamErrorMessage(assign.error) ??
                            "Не удалось назначить команду. Проверьте данные и попробуйте ещё раз."}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
