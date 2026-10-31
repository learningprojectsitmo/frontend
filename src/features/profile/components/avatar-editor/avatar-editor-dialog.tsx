import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { isAxiosError } from "axios";
import { Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteAvatar, useUploadAvatar } from "@/lib/avatar";
import { drawCrop, MAX_ZOOM, MIN_ZOOM, panBy, withZoom, type CropState } from "./crop-math";
import { loadImageBitmap, renderAvatarBlob } from "./image-utils";

/** Логический размер вьюпорта кадрирования; CSS может масштабировать его вниз. */
const VIEWPORT_SIZE = 288;
const NUDGE_STEP = 12;

const INITIAL_CROP: CropState = { zoom: MIN_ZOOM, center: { x: 0.5, y: 0.5 } };

const describeError = (error: unknown): string => {
    if (isAxiosError(error)) {
        const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
        if (typeof detail === "string") return detail;
    }
    if (error instanceof Error) return error.message;
    return "Не удалось сохранить фото";
};

type AvatarEditorDialogProps = {
    open: boolean;
    file: File | null;
    hasAvatar: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * Кадрирование фото «как в Telegram»: круглое превью, перетаскивание и зум.
 * На сервер уходит уже готовый квадрат 512×512.
 */
export const AvatarEditorDialog = ({
    open,
    file,
    hasAvatar,
    onOpenChange,
}: AvatarEditorDialogProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

    const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
    const [crop, setCrop] = useState<CropState>(INITIAL_CROP);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const uploadAvatar = useUploadAvatar();
    const deleteAvatar = useDeleteAvatar();
    const busy = uploadAvatar.isPending || deleteAvatar.isPending;

    // Декодируем выбранный файл. `cancelled` защищает от гонки, если пользователь
    // быстро закрыл диалог или выбрал другой файл.
    useEffect(() => {
        if (!open || !file) return;

        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        setCrop(INITIAL_CROP);

        loadImageBitmap(file)
            .then((decoded) => {
                if (cancelled) {
                    decoded.close();
                    return;
                }
                setBitmap(decoded);
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setLoadError(
                        error instanceof Error ? error.message : "Не удалось открыть фото",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, file]);

    // Закрытие диалога освобождает память декодированного оригинала.
    useEffect(() => {
        if (open) return;
        setBitmap(null);
        setCrop(INITIAL_CROP);
        setLoadError(null);
    }, [open]);

    useEffect(
        () => () => {
            bitmap?.close();
        },
        [bitmap],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !bitmap) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        drawCrop(ctx, bitmap, crop, VIEWPORT_SIZE);
    }, [bitmap, crop]);

    // Колесо мыши: нативный слушатель, потому что React делает wheel пассивным
    // и preventDefault в onWheel не останавливает прокрутку страницы.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !bitmap) return;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            setCrop((previous) =>
                withZoom(previous, previous.zoom - event.deltaY * 0.002, bitmap, VIEWPORT_SIZE),
            );
        };

        canvas.addEventListener("wheel", handleWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", handleWheel);
    }, [bitmap]);

    const toLogicalDelta = useCallback((clientDelta: number, rectWidth: number) => {
        const scale = rectWidth / VIEWPORT_SIZE;
        return scale > 0 ? clientDelta / scale : clientDelta;
    }, []);

    const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (!bitmap) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !bitmap) return;

        const rectWidth = event.currentTarget.getBoundingClientRect().width;
        const dx = toLogicalDelta(event.clientX - drag.x, rectWidth);
        const dy = toLogicalDelta(event.clientY - drag.y, rectWidth);
        dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
        setCrop((previous) => panBy(previous, dx, dy, bitmap, VIEWPORT_SIZE));
    };

    const endDrag = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
        if (!bitmap) return;
        const deltas: Record<string, [number, number]> = {
            ArrowLeft: [NUDGE_STEP, 0],
            ArrowRight: [-NUDGE_STEP, 0],
            ArrowUp: [0, NUDGE_STEP],
            ArrowDown: [0, -NUDGE_STEP],
        };
        const delta = deltas[event.key];
        if (!delta) return;
        event.preventDefault();
        setCrop((previous) => panBy(previous, delta[0], delta[1], bitmap, VIEWPORT_SIZE));
    };

    const handleZoomChange = (zoom: number) => {
        if (!bitmap) return;
        setCrop((previous) => withZoom(previous, zoom, bitmap, VIEWPORT_SIZE));
    };

    const handleSave = async () => {
        if (!bitmap) return;
        try {
            const blob = await renderAvatarBlob(bitmap, crop);
            await uploadAvatar.mutateAsync(blob);
            toast.success("Фото профиля обновлено");
            onOpenChange(false);
        } catch (error) {
            toast.error(describeError(error));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteAvatar.mutateAsync();
            toast.success("Фото профиля удалено");
            onOpenChange(false);
        } catch (error) {
            toast.error(describeError(error));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Фото профиля</DialogTitle>
                </DialogHeader>

                {loadError ? (
                    <p className="py-10 text-center text-sm text-red-600">{loadError}</p>
                ) : (
                    <>
                        <div className="relative mx-auto mt-2 w-full max-w-[288px]">
                            <canvas
                                ref={canvasRef}
                                width={VIEWPORT_SIZE}
                                height={VIEWPORT_SIZE}
                                tabIndex={0}
                                aria-label="Кадрирование фото: перетаскивайте мышью или стрелками, масштаб — колесом"
                                className="block aspect-square w-full cursor-grab touch-none rounded-full bg-gray-100 outline-none ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-app-blue active:cursor-grabbing"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                                onKeyDown={handleKeyDown}
                            />
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                    <span className="size-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs text-muted-foreground">
                            Перетащите фото, чтобы выбрать центр
                        </p>

                        <div className="flex items-center gap-3">
                            <ZoomOut className="size-4 shrink-0 text-gray-400" aria-hidden />
                            <input
                                type="range"
                                min={MIN_ZOOM}
                                max={MAX_ZOOM}
                                step={0.01}
                                value={crop.zoom}
                                onChange={(event) => handleZoomChange(Number(event.target.value))}
                                disabled={!bitmap}
                                aria-label="Масштаб фото"
                                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-[color:var(--app-primary)]"
                            />
                            <ZoomIn className="size-4 shrink-0 text-gray-400" aria-hidden />
                        </div>
                    </>
                )}

                <div className="mt-2 flex items-center gap-2">
                    {hasAvatar && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="hug36"
                            icon={<Trash2 className="size-4" />}
                            onClick={() => void handleDelete()}
                            loading={deleteAvatar.isPending}
                            disabled={busy}
                            className="text-red-600 hover:text-red-700"
                        >
                            Удалить фото
                        </Button>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="hug36"
                            onClick={() => onOpenChange(false)}
                            disabled={busy}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="button"
                            variant="dark"
                            size="hug36"
                            onClick={() => void handleSave()}
                            loading={uploadAvatar.isPending}
                            disabled={!bitmap || busy || !!loadError}
                        >
                            Сохранить
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
