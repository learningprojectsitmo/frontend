import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog/dialog";

interface DangerZoneProps {
    title?: string;
    description?: string;
    deleteLabel?: string;
    confirmTitle?: string;
    confirmDescription?: string;
    confirmDeleteLabel?: string;
    onDelete: () => void;
    isPending?: boolean;
}

export const DangerZone = ({
    title = "Удаление пространства",
    description = "Все проекты и данные будут удалены без возможности восстановления",
    deleteLabel = "Удалить пространство",
    confirmTitle = "Вы уверены?",
    confirmDescription = "Это действие необратимо. Все проекты и данные будут удалены.",
    confirmDeleteLabel = "Удалить",
    onDelete,
    isPending = false,
}: DangerZoneProps) => {
    const [confirmOpen, setConfirmOpen] = useState(false);

    return (
        <>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-800">{title}</h3>
                <p className="mt-1 text-sm text-red-600">{description}</p>
                <Button
                    variant="outline"
                    size="hug36"
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => setConfirmOpen(true)}
                >
                    {deleteLabel}
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title={confirmTitle}>
                <p className="text-sm text-gray-600">{confirmDescription}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" size="hug36" onClick={() => setConfirmOpen(false)}>
                        Отмена
                    </Button>
                    <Button
                        variant="dark"
                        size="hug36"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={onDelete}
                        disabled={isPending}
                    >
                        {isPending ? "Удаление..." : confirmDeleteLabel}
                    </Button>
                </div>
            </Dialog>
        </>
    );
};
