import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button/button";

interface ImagePromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (url: string) => void;
}

export const ImagePrompt = ({
    open,
    onOpenChange,
    onSubmit,
}: ImagePromptProps) => {
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim());
            setUrl("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Вставьте URL изображения</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        autoFocus
                        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-blue/30"
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="hug36"
                            onClick={() => onOpenChange(false)}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" disabled={!url.trim()}>
                            Вставить
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

let resolvePromise: ((url: string | null) => void) | null = null;
let isOpen = false;
let setIsOpen: ((open: boolean) => void) | null = null;

export function ImagePromptProvider() {
    const [open, setOpen] = useState(false);

    isOpen = open;
    setIsOpen = setOpen;

    return (
        <ImagePrompt
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o && resolvePromise) {
                    resolvePromise(null);
                    resolvePromise = null;
                }
            }}
            onSubmit={(url) => {
                if (resolvePromise) {
                    resolvePromise(url);
                    resolvePromise = null;
                }
            }}
        />
    );
}

export function showImagePrompt(): Promise<string | null> {
    return new Promise((resolve) => {
        resolvePromise = resolve;
        if (setIsOpen) setIsOpen(true);
    });
}
