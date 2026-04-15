import React, { useState, useCallback, useRef, useEffect } from "react";
import { KanbanTask } from "./task";
import type { KanbanColumnProps } from "../types";
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Palette,
    Trash2,
    Check,
    X,
    GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { columnColors, baseColor } from "../utils/column-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    column,
    onAddTask,
    onTaskClick,
    onDeleteTask,
    onTaskDragStart,
    onTaskDragOver,
    onTaskDropOnColumn,
    onTaskDropOnTask,
    onDragEnd,
    activeTaskId,
    onRenameColumn,
    onChangeColor,
    onDeleteColumn,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isDraggingTask, setIsDraggingTask] = useState(false);
    const [dropDirectionMap, setDropDirectionMap] = useState<Map<number, "top" | "bottom">>(new Map(),);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(column.name);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Функция для установки направления для конкретной задачи: (верх/низ) при перетаскивании
    const setDropDirectionForTask = useCallback(
        (taskId: number, direction: "top" | "bottom" | null) => {
            setDropDirectionMap((prev) => {
                const newMap = new Map(prev);
                if (direction === null) {
                    newMap.delete(taskId);
                } else {
                    newMap.set(taskId, direction);
                }
                return newMap;
            });
        },
        [],
    );

    // Сортировка задач по позиции
    const sortedTasks = [...(column.tasks || [])].sort((a, b) => a.position - b.position);

    // Проверка WIP лимита
    const isWipLimitReached = column.wipLimit && (column.tasks?.length || 0) >= column.wipLimit;

    // Получаем стили для цвета колонки
    const colorStyle = columnColors[column.color as keyof typeof columnColors] || baseColor.white;

    // Автофокус при открытии редактирования
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Обработчик перетаскивания задачи над колонкой
    const handleTaskDragOver = useCallback(
        (event: React.DragEvent<HTMLElement>) => {
            if (!event.dataTransfer.types.includes("kanban-board-task")) {
                return;
            }
            event.preventDefault();
            if (!isDragOver) {
                setIsDragOver(true);
            }
            setIsDraggingTask(true);
        },
        [isDragOver],
    );

    // Обработчик падения задачи на колонку
    const handleTaskDrop = useCallback(
        (event: React.DragEvent<HTMLElement>) => {
            if (!event.dataTransfer.types.includes("kanban-board-task")) {
                return;
            }
            event.preventDefault();
            setIsDragOver(false);
            onTaskDropOnColumn?.(event, column.id, column.name);
        },
        [onTaskDropOnColumn, column.id, column.name],
    );

    // Обработчик ухода мыши с колонки
    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
        setIsDraggingTask(false);
    }, []);

    // Обработчик глобального завершения перетаскивания
    const handleDragEnd = useCallback(() => {
        setIsDragOver(false);
        onDragEnd?.();
    }, [onDragEnd]);

    // Слушаем глобальное событие завершения перетаскивания
    React.useEffect(() => {
        window.addEventListener("dragend", handleDragEnd);
        return () => {
            window.removeEventListener("dragend", handleDragEnd);
        };
    }, [handleDragEnd]);

    // Обработчик клика на кнопку "Добавить задачу"
    const handleAddTask = useCallback(() => {
        onAddTask?.(column.id);
    }, [onAddTask, column.id]);

    // Обработчики для переименования
    const handleStartRename = useCallback(() => {
        setEditName(column.name);
        setIsEditing(true);
        setIsSettingsOpen(false);
    }, [column.name]);

    const handleSaveRename = useCallback(() => {
        const trimmedName = editName.trim();
        if (trimmedName && trimmedName !== column.name) {
            onRenameColumn?.(column.id, trimmedName);
        }
        setIsEditing(false);
    }, [editName, column.id, column.name, onRenameColumn]);

    const handleCancelRename = useCallback(() => {
        setIsEditing(false);
        setEditName(column.name);
    }, [column.name]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleSaveRename();
            } else if (e.key === "Escape") {
                handleCancelRename();
            }
        },
        [handleSaveRename, handleCancelRename],
    );

    const handleColorSelect = useCallback(
        (color: string) => {
            onChangeColor?.(column.id, color);
            setIsSettingsOpen(false);
        },
        [column.id, onChangeColor],
    );

    const handleDelete = useCallback(() => {
        setIsSettingsOpen(false);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        onDeleteColumn?.(column.id);
        setIsDeleteDialogOpen(false);
    }, [column.id, onDeleteColumn]);

    return (
        <>
            <div
                className={cn(
                    "w-80 flex-shrink-0 rounded-lg flex flex-col",
                    "border shadow-sm transition-all duration-200 overflow-hidden",
                    "h-[70vh]",
                    baseColor.white.bg,
                )}
                onDragOver={handleTaskDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleTaskDrop}
            >
                {/* Заголовок колонки - добавляем drag handle для перетаскивания колонки */}
                <div className={cn("p-3 border-b flex-shrink-0", colorStyle.header)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Drag Handle для перетаскивания колонки */}
                            <div
                                data-drag-handle="column"
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <GripVertical className={cn("h-4 w-4", colorStyle.text)} />
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-1 flex-1">
                                    <Input
                                        ref={inputRef}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="h-8 py-1 px-2 text-sm font-semibold"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveRename}
                                        className="p-1 rounded-md hover:bg-black/10 text-green-600"
                                        aria-label="Сохранить"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={handleCancelRename}
                                        className="p-1 rounded-md hover:bg-black/10 text-red-600"
                                        aria-label="Отменить"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3 className={cn("font-semibold truncate", colorStyle.text)}>
                                        {column.name}
                                    </h3>
                                    {/* WIP лимит */}
                                    {column.wipLimit && (
                                        <span
                                            className={cn(
                                                "text-xs px-1.5 py-0.5 rounded-full",
                                                isWipLimitReached
                                                    ? "bg-red-100 text-red-700"
                                                    : "bg-white/50 text-gray-700",
                                            )}
                                        >
                                            {column.tasks?.length || 0}/{column.wipLimit}
                                        </span>
                                    )}

                                    {/* Если нет WIP лимита, показываем только количество задач */}
                                    {!column.wipLimit && (
                                        <span className="text-xs text-gray-500 flex-shrink-0 bg-white/50 px-1.5 py-0.5 rounded-full">
                                            {column.tasks?.length || 0}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="flex items-center gap-1">
                                {/* Настройки колонки */}
                                <DropdownMenu
                                    open={isSettingsOpen}
                                    onOpenChange={setIsSettingsOpen}
                                >
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className={cn(
                                                "p-1 rounded-md transition-colors",
                                                "hover:bg-black/10 focus:outline-none",
                                            )}
                                            aria-label="Настройки колонки"
                                        >
                                            <MoreHorizontal
                                                className={cn("h-4 w-4", colorStyle.text)}
                                            />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        {/* Переименовать */}
                                        <DropdownMenuItem
                                            onClick={handleStartRename}
                                            className="cursor-pointer"
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Переименовать</span>
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        {/* Выбор цвета */}
                                        <div className="py-2 w-full">
                                            <div className="flex items-center justify-between px-2 py-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Palette className="mr-2 h-4 w-4" />
                                                    <span className="text-sm focus:text-accent-foreground">
                                                        Выбрать цвет
                                                    </span>
                                                </div>
                                                {/* Белый цвет */}
                                                <button
                                                    onClick={() => handleColorSelect("white")}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full transition-all",
                                                        baseColor.white.header,
                                                        "border border-gray-300",
                                                        column.color === "white" &&
                                                            "ring-2 ring-blue-500 ring-offset-1",
                                                    )}
                                                    title="Белый"
                                                    aria-label="Белый цвет"
                                                />
                                            </div>
                                            <div className="grid grid-cols-7 gap-2 px-2 pt-2 pb-1">
                                                {Object.entries(columnColors).map(
                                                    ([colorName, styles]) => (
                                                        <button
                                                            key={colorName}
                                                            onClick={() =>
                                                                handleColorSelect(colorName)
                                                            }
                                                            className={cn(
                                                                "w-6 h-6 rounded-full transition-all mx-auto",
                                                                "hover:scale-110 hover:shadow-md",
                                                                styles.header,
                                                                column.color === colorName &&
                                                                    "ring-2 ring-blue-500 ring-offset-1",
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        <DropdownMenuSeparator />

                                        {/* Удалить */}
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            className="cursor-pointer text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Удалить</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </div>

                {/* Кнопка добавления задачи */}
                <div className={cn("p-2 border-t border-gray-200 flex-shrink-0")}>
                    <Button
                        variant="outline"
                        size="hug36"
                        className="w-full justify-between text-gray-400 hover:text-gray-600 font-light"
                        onClick={handleAddTask}
                    >
                        <span>Добавить задачу...</span>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Список задач */}
                <div
                    className="flex-1 overflow-y-auto"
                    onDragLeave={() => setDropDirectionMap(new Map())}
                >
                    {sortedTasks.map((task) => (
                        <div
                            key={task.id}
                            onDragOver={(e) => {
                                if (!e.dataTransfer.types.includes("kanban-board-task")) {
                                    return;
                                }
                                e.preventDefault();
                                e.stopPropagation();

                                const rect = e.currentTarget.getBoundingClientRect();
                                const mouseY = e.clientY;
                                const midpoint = (rect.top + rect.bottom) / 2;
                                const direction = mouseY <= midpoint ? "top" : "bottom";

                                setDropDirectionForTask(task.id, direction);
                                onTaskDragOver?.(e, task.id, task.title);
                            }}
                            onDragLeave={() => {
                                setDropDirectionForTask(task.id, null);
                            }}
                            onDrop={(e) => {
                                if (!e.dataTransfer.types.includes("kanban-board-task")) {
                                    return;
                                }
                                e.preventDefault();
                                e.stopPropagation();
                                setDropDirectionForTask(task.id, null);
                                onTaskDropOnTask?.(e, task.id);
                            }}
                            className={cn(
                                "-mb-[2px] py-2 px-2 border-b-2 border-t-2 border-b-transparent border-t-transparent last:mb-0",
                                dropDirectionMap.get(task.id) === "top" && "border-t-blue-500",
                                dropDirectionMap.get(task.id) === "bottom" && "border-b-blue-500",
                            )}
                        >
                            <KanbanTask
                                task={task}
                                onClick={onTaskClick}
                                isDragging={activeTaskId === task.id}
                                onDragStart={(e: React.DragEvent<HTMLDivElement>) =>
                                    onTaskDragStart?.(e, task.id, task.title)
                                }
                                onDelete={onDeleteTask}
                            />
                        </div>
                    ))}

                    {/* Пустое состояние с индикатором */}
                    {sortedTasks.length === 0 && (
                        <div
                            className={cn(
                                "text-center py-8 text-gray-400 text-sm rounded-lg transition-all duration-200",
                                isDragOver &&
                                    isDraggingTask &&
                                    "border-2 border-blue-400 border-dashed bg-blue-50 text-blue-500",
                            )}
                        >
                            {isDragOver && isDraggingTask
                                ? "Отпустите для добавления задачи"
                                : "Нет задач"}
                        </div>
                    )}
                </div>
            </div>

            {/* Диалог подтверждения удаления */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Удалить колонку?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Вы действительно хотите удалить колонку "{column.name}"?
                        </p>
                        {column.tasks && column.tasks.length > 0 && (
                            <p className="mt-2 text-red-600">
                                Вместе с колонкой будет удалено {column.tasks.length} задач
                                {column.tasks.length === 1 ? "а" : ""}. Это действие нельзя
                                отменить.
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
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

export default KanbanColumn;
