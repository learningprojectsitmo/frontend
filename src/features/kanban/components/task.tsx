import React, { useState } from "react";
import { AlarmClockCheck, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanTaskProps } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const KanbanTask: React.FC<KanbanTaskProps> = ({
    task,
    isDragging = false,
    onClick,
    onDragStart,
    onDelete,
    onToggleSubtask,
}) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Обработчик начала перетаскивания
    const handleTaskDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart?.(event);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.dropEffect = "move";
    };

    // Обработчик клика по задаче
    const handleClick = () => {
        onClick?.(task);
    };

    // Обработчик удаления (открывает диалог)
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleteDialogOpen(true);
    };

    // Подтверждение удаления
    const handleDeleteConfirm = () => {
        onDelete?.(task.id);
        setIsDeleteDialogOpen(false);
    };

    // Отмена удаления
    const handleDeleteCancel = () => {
        setIsDeleteDialogOpen(false);
    };

    // Форматирование даты в формат DD.MM.YYYY
    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Проверка просрочки
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    // Обработка тегов (если строка)
    const tagsArray = task.tags ? task.tags.split(",").map((tag) => tag.trim()) : [];

    return (
        <>
            <div
                draggable
                onDragStart={handleTaskDragStart}
                onClick={handleClick}
                className={cn(
                    "bg-gray-50 rounded-lg shadow-sm border border-gray-200",
                    "hover:shadow-md transition-all",
                    "relative group cursor-grab active:cursor-grabbing",
                    isDragging && "cursor-grabbing",
                    "overflow-hidden",
                )}
            >
                <div
                    className={cn(
                        task.priority === "urgent" && "bg-red-100",
                        task.priority === "high" && "bg-orange-100",
                        task.priority === "medium" && "bg-yellow-100",
                        task.priority === "low" && "bg-green-100",
                        task.priority === "default" && "bg-gray-100",
                        "p-3",
                    )}
                >
                    {/* Верхняя строка: дедлайн + drag handle */}
                    <div className="flex items-center justify-between mb-2">
                        {/* Дедлайн */}
                        {task.dueDate && (
                            <div
                                className={cn(
                                    "flex items-center",
                                    "px-1 py-0.5 rounded-lg text-xs font-medium",
                                    isOverdue
                                        ? "bg-red-400 text-white"
                                        : "bg-orange-400 text-white",
                                )}
                            >
                                <AlarmClockCheck className="mr-1 h-3.5 w-3.5" />
                                {formatDate(task.dueDate)}
                            </div>
                        )}
                        {!task.dueDate && <div />}

                        {/* Drag Handle */}
                        <div data-drag-handle="task" className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Название задачи */}
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>

                    {/* Ответственные (аватарки) */}
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-1">
                            {task.assignees.map((assignee) => (
                                <div
                                    key={assignee.id}
                                    className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700"
                                    title={`${assignee.firstName} ${assignee.lastName}`}
                                >
                                    {assignee.firstName?.[0]}
                                    {assignee.lastName?.[0]}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Подзадачи */}
                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="bg-white border-t border-b border-gray-100 py-3 px-3">
                        <div className="space-y-2">
                            {task.subtasks.slice(0, 3).map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={subtask.isCompleted}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onToggleSubtask?.(subtask.id);
                                        }}
                                        className="w-3.5 h-3.5 rounded border-gray-300"
                                    />
                                    <span
                                        className={cn(
                                            "text-sm text-gray-600",
                                            subtask.isCompleted && "line-through text-gray-400",
                                        )}
                                    >
                                        {subtask.title}
                                    </span>
                                </div>
                            ))}
                            {task.subtasks.length > 3 && (
                                <div className="text-sm text-gray-400 pl-5">
                                    + еще {task.subtasks.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Теги (нижняя часть) - показываем только если есть теги */}
                {tagsArray.length > 0 && (
                    <div className="p-3 pt-2 bg-gray-100">
                        <div className="flex flex-wrap gap-2">
                            {tagsArray.slice(0, 3).map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs px-1.5 py-0.5 bg-gray-400 text-white rounded-lg"
                                >
                                    {tag}
                                </span>
                            ))}
                            {tagsArray.length > 3 && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-400 text-white rounded-lg">
                                    +{tagsArray.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Кнопки действий (при наведении) */}
                <div className="hidden group-hover:flex absolute top-2 right-8 gap-1">
                    {onDelete && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDeleteClick}
                            className="h-7 w-7 p-0"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Диалог подтверждения удаления */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Удалить задачу?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Вы действительно хотите удалить задачу "{task.title}"?
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="hug36" onClick={handleDeleteCancel}>
                            Отмена
                        </Button>
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={handleDeleteConfirm}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            Удалить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default KanbanTask;
