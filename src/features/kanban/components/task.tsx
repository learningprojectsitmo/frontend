import React, { useState } from "react";
import { AlarmClockCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanTaskProps } from "../types";

export const KanbanTask: React.FC<KanbanTaskProps> = ({
    task,
    isDragging = false,
    onClick,
    onDragStart,
    onToggleSubtask,
}) => {
    const [isDraggable, setIsDraggable] = useState(false);

    // Обработчик начала перетаскивания
    const handleTaskDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isDraggable) {
            event.preventDefault();
            return;
        }
        onDragStart?.(event);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.dropEffect = "move";
    };

    // Активируем draggable только если mousedown пришёл от drag-handle
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        setIsDraggable(!!target.closest('[data-drag-handle="task"]'));
    };

    // Сбрасываем флаг после завершения или отмены перетаскивания
    const handleDragEnd = () => setIsDraggable(false);

    // Обработчик клика по задаче
    const handleClick = () => {
        onClick?.(task);
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

    // Дни до дедлайна: положительное — осталось, 0 — сегодня, отрицательное — просрочено
    const getDaysUntilDueDate = (dueDate?: string): number | null => {
        if (!dueDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diffMs = due.getTime() - today.getTime();
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    };

    const daysLeft = getDaysUntilDueDate(task.dueDate);
    const isOverdue = daysLeft !== null && daysLeft < 0;

    // Подпись «N дн.» — показываем только при |daysLeft| ≤ 7 (включая 0 и просрочку)
    let dueLabel: string | null = null;
    if (daysLeft !== null) {
        if (daysLeft >= 0 && daysLeft <= 7) {
            dueLabel = `${daysLeft} дн.`;
        } else if (daysLeft < 0) {
            dueLabel = `${-daysLeft} дн.`;
        }
        // daysLeft > 7 → null (ничего не показываем)
    }

    // Обработка тегов (если строка)
    const tagsArray = task.tags ? task.tags.split(",").map((tag) => tag.trim()) : [];

    return (
        <>
            <div
                draggable={isDraggable}
                onMouseDown={handleMouseDown}
                onDragStart={handleTaskDragStart}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                className={cn(
                    "rounded-lg shadow-sm border border-gray-200",
                    "hover:shadow-md transition-all",
                    "relative group cursor-pointer",
                    isDragging && "cursor-grabbing",
                    "overflow-hidden",
                )}
            >
                <div
                    className={cn(
                        task.priority === "urgent" && "bg-red-50",
                        task.priority === "high" && "bg-orange-50",
                        task.priority === "medium" && "bg-yellow-50",
                        task.priority === "low" && "bg-green-50",
                        task.priority === "default" && "bg-[hsl(218,45%,94%)]",
                        "p-3",
                    )}
                >
                    {/* Верхняя строка: id + дедлайн + drag handle */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {/* ID задачи */}
                            <div className="px-1 py-0.5 rounded-lg text-xs font-medium bg-white text-black">
                                {"#" + task.id}
                            </div>
                            {/* Дедлайн */}
                            {task.dueDate && (
                                <div
                                    className={cn(
                                        "flex items-center",
                                        "px-1 py-0.5 rounded-lg text-xs font-medium",
                                        isOverdue
                                            ? "bg-red-100 text-red-700"
                                            : "bg-white text-black",
                                    )}
                                >
                                    <AlarmClockCheck className="mr-1 h-3.5 w-3.5" />
                                    {formatDate(task.dueDate)}
                                </div>
                            )}
                            {dueLabel && (
                                <span
                                    className={cn(
                                        "flex items-center px-1 py-0.5 rounded-lg text-xs font-medium",
                                        isOverdue
                                            ? "bg-red-600 text-white"
                                            : daysLeft! <= 3
                                                ? "bg-red-200 text-orange-900"
                                                : "bg-orange-200 text-orange-900",
                                    )}
                                >
                                    {dueLabel}
                                </span>
                            )}
                        </div>

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
                    <div className="p-3 bg-white border-t border-gray-200">
                        <div className="space-y-2">
                            {task.subtasks.slice(0, 3).map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={subtask.isCompleted}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onToggleSubtask?.(subtask.id);
                                        }}
                                        className="w-4 h-4 rounded border-gray-200 flex-shrink-0"
                                    />
                                    <span
                                        className={cn(
                                            "text-sm text-gray-600 truncate",
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
                    <div className="px-3 py-2 bg-[hsl(218,45%,94%)] border-t border-gray-200">
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

            </div>
        </>
    );
};

export default KanbanTask;
