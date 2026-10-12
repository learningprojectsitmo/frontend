import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/** Лимит причины: зеркалит `Field(max_length=200)` на бэкенде. */
export const REJECTION_REASON_MAX_LENGTH = 200;

interface RejectResponseDialogProps {
    open: boolean;
    /** Имя заявника — подставляется в текст, чтобы не отклонить «не того». */
    applicantName?: string;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * Подтверждение. `reason` — обрезанная строка или `null`, если причина
     * не указана: бэкенд в обоих случаях пишет `rejection_reason = NULL`.
     */
    onConfirm: (reason: string | null) => void;
}

/**
 * Отказ на отклик с опциональной причиной.
 *
 * Кнопка «Отклонить» в таблицах открывает этот диалог: причина не обязательна,
 * поэтому основное действие — «Отклонить» и без неё. Текст очищается при
 * каждом открытии, чтобы случайно не отправить прошлую причину.
 */
export function RejectResponseDialog({
    open,
    applicantName,
    loading = false,
    onOpenChange,
    onConfirm,
}: RejectResponseDialogProps) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    const trimmed = reason.trim();

    const handleConfirm = () => {
        onConfirm(trimmed ? trimmed : null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Отклонить отклик</DialogTitle>
                </DialogHeader>
                <p className="text-[13px] text-app-muted">
                    {applicantName ? `Заявка от «${applicantName}». ` : ""}
                    Причина необязательна: отказ можно оставить без объяснений.
                </p>

                <label className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium text-app-text">
                        Причина отказа{" "}
                        <span className="text-app-muted font-normal">(необязательно)</span>
                    </span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={REJECTION_REASON_MAX_LENGTH}
                        rows={3}
                        placeholder="Например: не хватает опыта по стеку проекта"
                        className="w-full resize-none rounded-lg border border-app-border bg-app-surface px-3 py-2 text-[14px] text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="self-end text-[12px] text-app-muted">
                        {trimmed.length}/{REJECTION_REASON_MAX_LENGTH}
                    </span>
                </label>

                <div className="flex justify-end gap-3 mt-2">
                    <DialogClose asChild>
                        <Button variant="outline" size="hug36" disabled={loading}>
                            Отмена
                        </Button>
                    </DialogClose>
                    <Button variant="dark" size="hug36" onClick={handleConfirm} disabled={loading}>
                        {loading ? "..." : "Отклонить"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
