import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog/dialog";
import { examApi, getExamErrorMessage, invalidateExam } from "@/lib/exams";
import { queryKeys } from "@/lib/query-keys";
import type { Exam } from "@/types/exam";

export const examRemovalLabel = (exam: Exam) =>
    exam.status === "published" ? "Архивировать экзамен" : "Удалить или архивировать";

export function ExamRemovalDialog({
    exam,
    onClose,
    onRemoved,
}: {
    exam: Exam;
    onClose: () => void;
    onRemoved?: () => void;
}) {
    const client = useQueryClient();
    const published = exam.status === "published";
    const mutation = useMutation({
        mutationFn: () => examApi.remove(exam.workspace_id, exam.id),
        onSuccess: async () => {
            onClose();
            onRemoved?.();
            toast.success(published ? "Экзамен перенесён в архив" : "Экзамен убран из списка");
            await invalidateExam(client, exam.workspace_id, exam.id);
            client.removeQueries({
                queryKey: queryKeys.exams.detail(exam.workspace_id, exam.id),
                type: "inactive",
            });
        },
    });

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !mutation.isPending) onClose();
            }}
        >
            <DialogContent withDescription className="grid w-[calc(100%-2rem)] max-w-[440px] gap-4">
                <DialogHeader className="pr-8">
                    <DialogTitle>{examRemovalLabel(exam)}?</DialogTitle>
                </DialogHeader>
                <p className="text-sm font-medium text-app-text [overflow-wrap:anywhere]">
                    {exam.configuration.title}
                </p>
                <DialogDescription className="text-sm text-app-muted">
                    {published
                        ? "Экзамен исчезнет из текущего списка. История, записи команд и результаты сохранятся. Экзамен можно будет открыть через фильтр «Архив»."
                        : "Пустой черновик без слотов и записей команд будет удалён без восстановления. Если есть слоты или записи, экзамен переместится в архив, а его история сохранится."}
                </DialogDescription>
                {mutation.isError && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-300">
                        {getExamErrorMessage(mutation.error) ?? "Не удалось выполнить действие."}
                    </p>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="hug36"
                        disabled={mutation.isPending}
                        onClick={onClose}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        variant="dark"
                        size="hug36"
                        loading={mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {published ? "Архивировать" : "Подтвердить"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
