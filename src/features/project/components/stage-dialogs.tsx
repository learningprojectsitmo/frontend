import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ApproveStageDialogProps {
    stageName: string;
    onConfirm: () => void;
}

export const ApproveStageDialog = ({ stageName, onConfirm }: ApproveStageDialogProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="dark"
                size="hug36"
                className="font-sans text-[13px] font-semibold"
                onClick={() => setOpen(true)}
            >
                Утвердить этап
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Утвердить этап «{stageName}»?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 mt-2">
                        После утверждения проект перейдёт на следующий этап.
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" size="hug36" onClick={() => setOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            onClick={() => {
                                setOpen(false);
                                onConfirm();
                            }}
                        >
                            Утвердить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

interface RejectStageDialogProps {
    stageName: string;
    onConfirm: (comment?: string | null) => void;
}

export const RejectStageDialog = ({ stageName, onConfirm }: RejectStageDialogProps) => {
    const [open, setOpen] = useState(false);
    const [comment, setComment] = useState("");

    return (
        <>
            <Button
                variant="ghost"
                size="hug36"
                className="font-sans text-[13px] font-semibold text-red-600"
                onClick={() => {
                    setComment("");
                    setOpen(true);
                }}
            >
                Отклонить
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>Отклонить этап «{stageName}»?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600 mt-2">
                        Проект будет возвращён на предыдущий этап. Укажите причину отклонения
                        (необязательно).
                    </p>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        placeholder="Причина отклонения..."
                        className="w-full mt-3 p-2 rounded-lg border border-gray-300 bg-app-surface text-sm focus:border-[#2B7FFF] focus:outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" size="hug36" onClick={() => setOpen(false)}>
                            Закрыть
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            className="text-red-600"
                            onClick={() => {
                                setOpen(false);
                                onConfirm(comment.trim() || null);
                            }}
                        >
                            Отклонить и вернуть
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
