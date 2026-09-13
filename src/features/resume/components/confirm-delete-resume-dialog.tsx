import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resumeTitle: string;
    onDelete: () => void;
    isPending?: boolean;
};

export const ConfirmDeleteResumeDialog = ({
    open,
    onOpenChange,
    resumeTitle,
    onDelete,
    isPending = false,
}: Props) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Удалить резюме?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-600">
                    Резюме «{resumeTitle}» будет удалено без возможности восстановления.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="hug36"
                        onClick={() => onOpenChange(false)}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        variant="dark"
                        size="hug36"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={onDelete}
                        disabled={isPending}
                    >
                        {isPending ? "Удаление..." : "Удалить"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
