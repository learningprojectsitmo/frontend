import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface JoinWarningDialogProps {
    open: boolean;
    projectName: string;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function JoinWarningDialog({
    open,
    projectName,
    loading = false,
    onOpenChange,
    onConfirm,
}: JoinWarningDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Вступление в команду</DialogTitle>
                </DialogHeader>
                <p className="text-[14px] leading-relaxed text-gray-600">
                    Вы вступаете в команду проекта «{projectName}». Если в этом пространстве
                    запрещено участие в нескольких проектах одновременно, другие ваши отклики и
                    приглашения будут отменены.
                </p>
                <div className="flex justify-end gap-3 mt-4">
                    <DialogClose asChild>
                        <Button variant="outline" size="hug36" disabled={loading}>
                            Отмена
                        </Button>
                    </DialogClose>
                    <Button variant="dark" size="hug36" onClick={onConfirm} disabled={loading}>
                        {loading ? "..." : "Вступить в команду"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
