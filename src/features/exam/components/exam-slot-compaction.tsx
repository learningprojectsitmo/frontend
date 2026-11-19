import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/dialog";
import { paths } from "@/config/paths";
import {
    examApi,
    getExamErrorMessage,
    invalidateExam,
    useExamRegistrations,
    useExamSlots,
} from "@/lib/exams";
import { formatExamTime } from "../exam-display";
import { hasEarlierFreeSlots, planSlotCompaction } from "../exam-schedule";

type MovePlan = ReturnType<typeof planSlotCompaction>;

export function ExamSlotCompaction({
    workspaceId,
    examId,
    now,
    disabled,
    projectName,
}: {
    workspaceId: number;
    examId: number;
    now: number;
    disabled: boolean;
    projectName: (id: number) => string | undefined;
}) {
    const client = useQueryClient();
    const slots = useExamSlots(workspaceId, examId);
    const hasGap = hasEarlierFreeSlots(slots.data?.items ?? []);
    const registrations = useExamRegistrations(workspaceId, examId, false, hasGap);
    const [preview, setPreview] = useState<MovePlan | null>(null);
    const currentPlan = planSlotCompaction(
        slots.data?.items ?? [],
        registrations.data?.items ?? [],
        now,
    );
    const mutation = useMutation({
        mutationFn: async (confirmed: MovePlan) => {
            let moved = 0;
            try {
                const [freshSlots, freshRegistrations] = await Promise.all([
                    examApi.slots(workspaceId, examId),
                    examApi.registrations(workspaceId, examId),
                ]);
                const freshPlan = planSlotCompaction(
                    freshSlots.items,
                    freshRegistrations.items,
                    Date.now(),
                );
                if (!samePlan(confirmed, freshPlan)) {
                    toast.error(
                        "Расписание изменилось. Откройте предварительный просмотр ещё раз.",
                    );
                    return;
                }
                for (const { registration, to } of confirmed) {
                    await examApi.moveRegistration(workspaceId, examId, registration, to.id);
                    moved += 1;
                }
                toast.success("Очередь уплотнена");
            } catch (error) {
                const message = getExamErrorMessage(error) ?? "Не удалось перенести команду.";
                toast.error(
                    moved
                        ? `Перенесено команд: ${moved} из ${confirmed.length}. ${message}`
                        : message,
                );
            } finally {
                await invalidateExam(client, workspaceId, examId);
                setPreview(null);
            }
        },
    });
    const canPreview =
        !disabled && !slots.isError && !registrations.isError && currentPlan.length > 0;

    return (
        <>
            {currentPlan.length > 0 && !slots.isError && !registrations.isError && (
                <div className="mb-4 space-y-2 rounded-xl border border-app-border bg-app-badge-amber p-4 text-sm text-app-badge-amber-fg">
                    <p className="font-semibold">Есть свободные слоты раньше записанных</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            size="hug36"
                            disabled={!canPreview || mutation.isPending}
                            onClick={() => setPreview(currentPlan)}
                        >
                            Уплотнить очередь
                        </Button>
                        <Link
                            className="font-semibold underline underline-offset-4"
                            to={`${paths.app.examEdit.getHref(workspaceId, examId)}&section=queue`}
                        >
                            Перейти к слотам
                        </Link>
                    </div>
                </div>
            )}
            <Dialog
                open={preview !== null}
                onOpenChange={(open) => {
                    if (!open && !mutation.isPending) setPreview(null);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Уплотнить очередь?</DialogTitle>
                    </DialogHeader>
                    <p className="mt-3 text-sm text-app-muted">
                        Проверьте новое время защиты каждой команды.
                    </p>
                    <ul className="mt-3 divide-y divide-gray-200 text-sm">
                        {preview?.map(({ registration, from, to }) => (
                            <li
                                key={registration.id}
                                className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2"
                            >
                                <span>
                                    {projectName(registration.project_id) ??
                                        `Проект №${registration.project_id}`}
                                </span>
                                <span className="whitespace-nowrap tabular-nums">
                                    {formatExamTime(from.starts_at)} →{" "}
                                    {formatExamTime(to.starts_at)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            disabled={mutation.isPending}
                            onClick={() => setPreview(null)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            loading={mutation.isPending}
                            disabled={disabled}
                            onClick={() => {
                                if (preview && !mutation.isPending) mutation.mutate(preview);
                            }}
                        >
                            Подтвердить перенос
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function samePlan(confirmed: MovePlan, fresh: MovePlan) {
    return (
        confirmed.length === fresh.length &&
        confirmed.every(({ registration, from, to }, index) => {
            const current = fresh[index];
            return (
                current.registration.id === registration.id &&
                current.registration.version === registration.version &&
                current.from.id === from.id &&
                current.to.id === to.id
            );
        })
    );
}
