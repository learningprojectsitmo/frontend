import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { Switch } from "@/components/ui/switch/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        createStage.mutate(
            { typeId, data: { name, order: nextOrder, requires_approval: false } },
            {
                onSuccess: () => {
                    toast.success("Этап добавлен");
                    setNewStageForType(null);
                    setNewStageName("");
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
