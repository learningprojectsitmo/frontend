import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_SUBTASKS_PER_TASK = 5;

interface SubtaskListProps {
    taskId?: number;
    subtasks: Array<{
        id?: number;
        title: string;
        isCompleted: boolean;
        position: number;
        taskId?: number;
        _tempId: string;
    }>;
    onAddSubtask: (title: string) => void;
    onUpdateSubtask: (
        index: number,
        subtask: Partial<{ title: string; isCompleted: boolean }>,
    ) => void;
    onDeleteSubtask: (index: number) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
    subtasks,
    onAddSubtask,
    onUpdateSubtask,
    onDeleteSubtask,
}) => {
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    const canAddSubtask = subtasks.length < MAX_SUBTASKS_PER_TASK;
    const remainingSlots = MAX_SUBTASKS_PER_TASK - subtasks.length;

    const handleAddSubtask = () => {
        if (!canAddSubtask) {
            toast.error(`Максимальное количество подзадач - ${MAX_SUBTASKS_PER_TASK}`);
            return;
        }

        if (!newSubtaskTitle.trim()) return;

        onAddSubtask(newSubtaskTitle.trim());
        setNewSubtaskTitle("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && newSubtaskTitle.trim() && canAddSubtask) {
            handleAddSubtask();
        }
    };

    const startEditing = (index: number, currentTitle: string) => {
        setEditingIndex(index);
        setEditingTitle(currentTitle);
    };

    const saveEditing = (index: number) => {
        if (editingTitle.trim()) {
            onUpdateSubtask(index, { title: editingTitle.trim() });
        }
        setEditingIndex(null);
        setEditingTitle("");
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setEditingTitle("");
    };

    const handleToggleSubtask = (index: number, currentCompleted: boolean) => {
        onUpdateSubtask(index, { isCompleted: !currentCompleted });
    };

    const handleKeyDownEdit = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Enter") {
            saveEditing(index);
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    return (
        <div className="space-y-3">
            {/* Список подзадач */}
            <div className="space-y-2">
                {subtasks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Нет подзадач</p>
                ) : (
                    subtasks.map((subtask, index) => (
                        <div
                            key={subtask._tempId}
                            className="flex items-center p-2 gap-2 border rounded-xl "
                        >
                            <Checkbox
                                checked={subtask.isCompleted}
                                onCheckedChange={() =>
                                    handleToggleSubtask(index, subtask.isCompleted)
                                }
                                className="w-[18px] h-[18px]"
                            />

                            {editingIndex === index ? (
                                <>
                                    <Input
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onKeyDown={(e) => handleKeyDownEdit(e, index)}
                                        className="flex-1 text-sm h-8"
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => saveEditing(index)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelEditing}
                                        className="h-6 w-6 p-0"
                                    >
                                        <X className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span
                                        className={cn(
                                            "flex-1 text-sm",
                                            subtask.isCompleted && "line-through text-gray-400",
                                        )}
                                    >
                                        {subtask.title}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => startEditing(index, subtask.title)}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                                    </Button>
                                </>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onDeleteSubtask(index)}
                                className="h-6 w-6 p-0"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Добавление новой подзадачи */}
            <div className="flex gap-2">
                <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Новая подзадача..."
                    className="flex-1 text-sm h-8"
                    disabled={!canAddSubtask}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="hug36"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim() || !canAddSubtask}
                    className="h-8"
                >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Добавить
                </Button>
            </div>

            {/* Сообщение о лимите */}
            {!canAddSubtask && (
                <p className="text-xs text-red-500">
                    Достигнут максимальный лимит подзадач ({MAX_SUBTASKS_PER_TASK})
                </p>
            )}
            {canAddSubtask && remainingSlots > 0 && remainingSlots <= 2 && (
                <p className="text-xs text-orange-500">
                    Можно добавить еще {remainingSlots} подзадач{remainingSlots === 1 ? "у" : "и"}
                </p>
            )}
        </div>
    );
};
