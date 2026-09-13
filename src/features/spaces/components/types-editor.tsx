import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { Switch } from "@/components/ui/switch/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, X } from "lucide-react";
import { Calendar } from "@/features/spaces/components/filters/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    useProjectTypes,
    useCreateProjectType,
    useUpdateProjectType,
    useDeleteProjectType,
    useCreateProjectStage,
    useUpdateProjectStage,
    useDeleteProjectStage,
} from "@/lib/projects";
import type { BackendProjectStage, BackendProjectType } from "@/types/api";

interface TypesEditorProps {
    workspaceId: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfToday = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

const formatDate = (d: Date): string =>
    `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;

const isoFromDate = (d: Date): string =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const parseIso = (value: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
};

const durationToIso = (days: number | null): string | null => {
    if (!days) return null;
    const d = startOfToday();
    d.setDate(d.getDate() + Math.max(1, days));
    return isoFromDate(d);
};

const isoToDuration = (value: string | null): number | null => {
    const picked = parseIso(value);
    if (!picked) return null;
    const days = Math.round((picked.getTime() - startOfToday().getTime()) / DAY_MS);
    return Math.max(1, days);
};

interface StageDatePickerProps {
    value: string | null;
    onChange: (iso: string | null) => void;
    placeholder?: string;
    className?: string;
}

const StageDatePicker = ({
    value,
    onChange,
    placeholder = "Не указан",
    className,
}: StageDatePickerProps) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const selected = parseIso(value);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
                return;
            }
            setOpen(false);
        }
        function handleKeydown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeydown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeydown);
        };
    }, [open]);

    return (
        <div className={cn("relative", className)}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full h-9 px-3 flex items-center justify-between gap-1 bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-gray-900 hover:border-gray-300 outline-none transition-colors"
            >
                <span className={cn("whitespace-nowrap", !selected && "text-gray-400")}>
                    {selected ? formatDate(selected) : placeholder}
                </span>
                {selected ? (
                    <span className="flex items-center gap-1">
                        <CalendarIcon size={15} className="text-gray-400 shrink-0" />
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange(null);
                                }
                            }}
                            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label="Сбросить дату"
                        >
                            <X size={14} className="h-3.5 w-3.5" />
                        </span>
                    </span>
                ) : (
                    <CalendarIcon size={15} className="text-gray-400 shrink-0" />
                )}
            </button>
            {open && (
                <div ref={popoverRef} className="absolute top-full left-0 mt-2 z-30">
                    <Calendar
                        selected={selected}
                        onSelect={(date) => {
                            onChange(isoFromDate(date));
                            setOpen(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export const TypesEditor = ({ workspaceId }: TypesEditorProps) => {
    const { data: types, isLoading } = useProjectTypes(workspaceId);
    const createType = useCreateProjectType();
    const updateType = useUpdateProjectType();
    const deleteType = useDeleteProjectType();
    const createStage = useCreateProjectStage();
    const updateStage = useUpdateProjectStage();
    const deleteStage = useDeleteProjectStage();

    const [newTypeOpen, setNewTypeOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [newTypeDescription, setNewTypeDescription] = useState("");
    const [newStageForType, setNewStageForType] = useState<number | null>(null);
    const [newStageName, setNewStageName] = useState("");
    const [newStageDuration, setNewStageDuration] = useState("");

    const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
    const [editingTypeName, setEditingTypeName] = useState("");
    const [editingTypeDescription, setEditingTypeDescription] = useState("");

    const sorted = (t: BackendProjectType) => [...t.stages].sort((a, b) => a.order - b.order);

    const handleCreateType = () => {
        if (!newTypeName.trim()) {
            toast.error("Укажите название типа");
            return;
        }
        createType.mutate(
            {
                name: newTypeName.trim(),
                description: newTypeDescription.trim() || null,
                workspace_id: workspaceId,
            },
            {
                onSuccess: () => {
                    toast.success("Тип создан");
                    setNewTypeOpen(false);
                    setNewTypeName("");
                    setNewTypeDescription("");
                },
                onError: (error) => toast.error(error?.message || "Не удалось создать тип"),
            },
        );
    };

    const handleSaveTypeName = (t: BackendProjectType) => {
        if (editingTypeName.trim() === t.name && editingTypeDescription === (t.description ?? "")) {
            setEditingTypeId(null);
            return;
        }
        updateType.mutate(
            {
                typeId: t.id,
                data: {
                    name: editingTypeName.trim() || t.name,
                    description: editingTypeDescription.trim() || null,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Тип обновлён");
                    setEditingTypeId(null);
                },
                onError: (error) => toast.error(error?.message || "Не удалось обновить тип"),
            },
        );
    };

    const handleAddStage = (typeId: number) => {
        const name = newStageName.trim();
        if (!name) {
            toast.error("Укажите название этапа");
            return;
        }
        const type = types?.find((t) => t.id === typeId);
        const nextOrder = type ? type.stages.length : 0;
        const durationDays = isoToDuration(newStageDuration || null);
        createStage.mutate(
            {
                typeId,
                data: {
                    name,
                    order: nextOrder,
                    requires_approval: false,
                    duration_days: durationDays,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Этап добавлен");
                    setNewStageForType(null);
                    setNewStageName("");
                    setNewStageDuration("");
                },
                onError: (error) => toast.error(error?.message || "Не удалось добавить этап"),
            },
        );
    };

    const handleToggleApproval = (typeId: number, stage: BackendProjectStage) => {
        updateStage.mutate(
            {
                typeId,
                stageId: stage.id,
                data: { requires_approval: !stage.requires_approval },
            },
            { onError: (error) => toast.error(error?.message || "Не удалось обновить этап") },
        );
    };

    const handleRenameStage = (typeId: number, stage: BackendProjectStage, name: string) => {
        const trimmed = name.trim();
        if (!trimmed || trimmed === stage.name) return;
        updateStage.mutate(
            {
                typeId,
                stageId: stage.id,
                data: { name: trimmed },
            },
            { onError: (error) => toast.error(error?.message || "Не удалось переименовать этап") },
        );
    };

    const handleDeleteStage = (typeId: number, stage: BackendProjectStage) => {
        deleteStage.mutate(
            { typeId, stageId: stage.id },
            { onError: (error) => toast.error(error?.message || "Не удалось удалить этап") },
        );
    };

    const handleMoveStage = (typeId: number, index: number, delta: -1 | 1) => {
        const type = types?.find((t) => t.id === typeId);
        if (!type) return;
        const stages = sorted(type);
        const target = index + delta;
        if (target < 0 || target >= stages.length) return;
        const a = stages[index];
        const b = stages[target];
        const onError = (error: unknown) =>
            toast.error(
                error instanceof Error ? error.message : "Не удалось изменить порядок этапов",
            );
        updateStage.mutate({ typeId, stageId: a.id, data: { order: b.order } }, { onError });
        updateStage.mutate({ typeId, stageId: b.id, data: { order: a.order } }, { onError });
    };

    const handleDurationChange = (
        typeId: number,
        stage: BackendProjectStage,
        iso: string | null,
    ) => {
        const next = isoToDuration(iso);
        if (next === stage.duration_days) return;
        updateStage.mutate(
            { typeId, stageId: stage.id, data: { duration_days: next } },
            { onError: (error) => toast.error(error?.message || "Не удалось обновить срок этапа") },
        );
    };

    const handleDeleteType = (t: BackendProjectType) => {
        deleteType.mutate(t.id, {
            onSuccess: () => toast.success("Тип удалён"),
            onError: (error) => toast.error(error?.message || "Не удалось удалить тип"),
        });
    };

    if (isLoading) {
        return <div className="text-center py-12 text-sm text-gray-500">Загрузка типов...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Типы проектов определяют набор этапов. Системные типы копируются сюда при
                    создании пространства и доступны для изменения.
                </p>
                <Button
                    variant="dark"
                    size="hug36"
                    onClick={() => setNewTypeOpen(true)}
                    className="whitespace-nowrap"
                >
                    Добавить тип
                </Button>
            </div>

            {!types || types.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">
                    Пока нет ни одного типа проекта.
                </div>
            ) : (
                types.map((t) => (
                    <div
                        key={t.id}
                        className="border border-gray-200 rounded-2xl bg-app-surface p-4 flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-2 flex-wrap">
                            {editingTypeId === t.id ? (
                                <>
                                    <Input
                                        value={editingTypeName}
                                        onChange={(e) => setEditingTypeName(e.target.value)}
                                        className="max-w-[240px]"
                                    />
                                    <Textarea
                                        value={editingTypeDescription}
                                        onChange={(e) => setEditingTypeDescription(e.target.value)}
                                        rows={1}
                                        className="max-w-[320px]"
                                        placeholder="Описание"
                                    />
                                    <Button
                                        variant="blue"
                                        size="hug36"
                                        onClick={() => handleSaveTypeName(t)}
                                    >
                                        Сохранить
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="hug36"
                                        onClick={() => setEditingTypeId(null)}
                                    >
                                        Отмена
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span className="text-[15px] font-semibold text-gray-900">
                                        {t.name}
                                    </span>
                                    {t.description && (
                                        <span className="text-[12px] text-gray-500">
                                            — {t.description}
                                        </span>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="hug36"
                                        onClick={() => {
                                            setEditingTypeId(t.id);
                                            setEditingTypeName(t.name);
                                            setEditingTypeDescription(t.description ?? "");
                                        }}
                                    >
                                        Переименовать
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="hug36"
                                        className="text-red-600"
                                        onClick={() => handleDeleteType(t)}
                                    >
                                        Удалить
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="border-t border-gray-100" />
                        <div className="text-[13px] font-medium text-gray-700">Этапы:</div>
                        {sorted(t).length === 0 ? (
                            <div className="text-sm text-gray-400">Этапов пока нет.</div>
                        ) : (
                            <ol className="flex flex-col gap-2">
                                {sorted(t).map((stage, idx) => (
                                    <li
                                        key={stage.id}
                                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                                    >
                                        <div className="flex flex-col shrink-0">
                                            <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => handleMoveStage(t.id, idx, -1)}
                                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-0.5"
                                                aria-label="Переместить этап выше"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={idx === sorted(t).length - 1}
                                                onClick={() => handleMoveStage(t.id, idx, 1)}
                                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-0.5"
                                                aria-label="Переместить этап ниже"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>
                                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[12px] font-semibold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <Input
                                            key={stage.id}
                                            defaultValue={stage.name}
                                            onBlur={(e) =>
                                                handleRenameStage(t.id, stage, e.target.value)
                                            }
                                            className="flex-1 min-w-0"
                                            aria-label="Название этапа"
                                        />
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <Switch
                                                checked={stage.requires_approval}
                                                onCheckedChange={() =>
                                                    handleToggleApproval(t.id, stage)
                                                }
                                            />
                                            <span className="text-[12px] text-gray-600 whitespace-nowrap">
                                                утверждение
                                            </span>
                                        </label>
                                        <StageDatePicker
                                            value={durationToIso(stage.duration_days)}
                                            onChange={(iso) =>
                                                handleDurationChange(t.id, stage, iso)
                                            }
                                            className="w-[160px] shrink-0"
                                            placeholder="дата"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="hug36"
                                            className="text-red-600 !px-2"
                                            onClick={() => handleDeleteStage(t.id, stage)}
                                        >
                                            Удалить
                                        </Button>
                                    </li>
                                ))}
                            </ol>
                        )}

                        {newStageForType === t.id ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    placeholder="Название нового этапа"
                                />
                                <StageDatePicker
                                    value={newStageDuration || null}
                                    onChange={(iso) => setNewStageDuration(iso ?? "")}
                                    className="w-[160px]"
                                    placeholder="дата"
                                />
                                <Button
                                    variant="blue"
                                    size="hug36"
                                    onClick={() => handleAddStage(t.id)}
                                >
                                    Добавить
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="hug36"
                                    onClick={() => {
                                        setNewStageForType(null);
                                        setNewStageName("");
                                        setNewStageDuration("");
                                    }}
                                >
                                    Отмена
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="hug36"
                                onClick={() => {
                                    setNewStageForType(t.id);
                                    setNewStageName("");
                                    setNewStageDuration("");
                                }}
                            >
                                + Добавить этап
                            </Button>
                        )}
                    </div>
                ))
            )}

            <Dialog open={newTypeOpen} onOpenChange={setNewTypeOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>Новый тип проекта</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        <Input
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            placeholder="Название (например, Курсовая работа)"
                        />
                        <Textarea
                            value={newTypeDescription}
                            onChange={(e) => setNewTypeDescription(e.target.value)}
                            rows={2}
                            placeholder="Описание (необязательно)"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" size="hug36" onClick={() => setNewTypeOpen(false)}>
                            Отмена
                        </Button>
                        <Button variant="dark" size="hug36" onClick={handleCreateType}>
                            Создать
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
