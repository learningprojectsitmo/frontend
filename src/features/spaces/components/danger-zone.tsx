import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";

interface DangerZoneProps {
    title?: string;
    description?: string;
    deleteLabel?: string;
    confirmTitle?: string;
    confirmDescription?: string;
    confirmDeleteLabel?: string;
    /** Название сущности — пользователь должен ввести его для подтверждения */
    confirmationName: string;
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
    confirmationName,
    onDelete,
    isPending = false,
}: DangerZoneProps) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [typedName, setTypedName] = useState("");
    const [nameCopied, setNameCopied] = useState(false);

    const handleCopyName = async () => {
        try {
            await navigator.clipboard.writeText(confirmationName);
        } catch {
            const el = document.createElement("textarea");
            el.value = confirmationName;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
        }
        setNameCopied(true);
        setTimeout(() => setNameCopied(false), 1500);
    };

    const handleOpenChange = (open: boolean) => {
        setConfirmOpen(open);
        if (!open) setTypedName("");
    };

    const isConfirmed = typedName === confirmationName;

    return (
        <>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-800">{title}</h3>
                <p className="mt-1 text-sm text-red-600">{description}</p>
                <Button
                    type="button"
                    variant="outline"
                    size="hug36"
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => setConfirmOpen(true)}
                >
                    {deleteLabel}
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={handleOpenChange}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>{confirmTitle}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">{confirmDescription}</p>
                    <div className="mt-4 space-y-2">
                        <Label className="inline-flex items-center gap-1.5">
                            Введите{" "}
                            <span className="font-semibold text-red-600">{confirmationName}</span>{" "}
                            <button
                                type="button"
                                onClick={handleCopyName}
                                className="inline-flex items-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                title="Скопировать название"
                                aria-label="Скопировать название"
                            >
                                {nameCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            для подтверждения:
                        </Label>
                        <Input
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            placeholder={confirmationName}
                            className="border-red-300 focus-visible:border-red-500 focus-visible:ring-red-200"
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="hug36"
                            onClick={() => handleOpenChange(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            variant="dark"
                            size="hug36"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={onDelete}
                            disabled={!isConfirmed || isPending}
                        >
                            {isPending ? "Удаление..." : confirmDeleteLabel}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
