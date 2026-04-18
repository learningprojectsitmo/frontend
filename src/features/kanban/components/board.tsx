import React, { useCallback, useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanColumn } from "./column";
import {
    DndMonitorProvider,
    useAnnouncement,
    useDndEvents,
    LiveRegion,
    HiddenInstructions,
} from "./accessibility";
import type { KanbanBoardProps } from "../types";
import type { ColumnWithTasksAndSubtasks, Task } from "@/types/tables/forTables";

const DATA_TRANSFER_TYPES = {
    TASK: "kanban-board-task",
    COLUMN: "kanban-board-column",
};

const KanbanBoardInner: React.FC<KanbanBoardProps> = ({
    columns,
    onTaskMove,
    onTaskClick,
    onDeleteTask,
    onAddTask,
    onRenameColumn,
    onChangeColor,
    onDeleteColumn,
    onReorderColumns,
    onCreateColumn,
    isLoading,
    className,
}) => {
    const [activeTaskId, setActiveTaskId] = useState<number | undefined>(undefined);
    const [activeTaskTitle, setActiveTaskTitle] = useState<string>("");
    const [activeColumnId, setActiveColumnId] = useState<number | undefined>(undefined);
    const [activeColumnTitle, setActiveColumnTitle] = useState<string>("");
    const [dropDirectionForColumn, setDropDirectionForColumn] = useState<Map<number, "left" | "right">>(new Map());
    const [draggableColumnId, setDraggableColumnId] = useState<number | null>(null);
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");
    const { announce, announcement } = useAnnouncement();

    // Автофокус на инпут при открытии формы
    const newColumnInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isAddingColumn) {
            newColumnInputRef.current?.focus();
        }
    }, [isAddingColumn]);

    const handleConfirmNewColumn = useCallback(() => {
        const name = newColumnName.trim();
        if (name) {
            onCreateColumn?.(name);
        }
        setIsAddingColumn(false);
        setNewColumnName("");
    }, [newColumnName, onCreateColumn]);

    const handleCancelNewColumn = useCallback(() => {
        setIsAddingColumn(false);
        setNewColumnName("");
    }, []);

    const newColumnContainerRef = useRef<HTMLDivElement>(null);

    const { onDragStart, onDragOver, onDragEnd, onDragCancel } = useDndEvents();
    const activeIdRef = useRef<string | null>(null);

    // Поиск колонки по ID
    const findColumn = useCallback(
        (columnId: number): ColumnWithTasksAndSubtasks | undefined => {
            return columns.find((col) => col.id === columnId);
        },
        [columns],
    );

    // Поиск задачи по ID
    const findTask = useCallback(
        (taskId: number): Task | undefined => {
            for (const column of columns) {
                const task = column.tasks?.find((t) => t.id === taskId);
                if (task) return task;
            }
            return undefined;
        },
        [columns],
    );

    // ========== ОБРАБОТЧИКИ ДЛЯ КОЛОНОК ==========

    // Обработка начала перетаскивания колонки
    const handleColumnDragStart = useCallback(
        (event: React.DragEvent<HTMLElement>, columnId: number, columnName: string) => {
            if (draggableColumnId !== columnId) {
                event.preventDefault();
                return;
            }
            if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.TASK)) {
                event.preventDefault();
                return;
            }

            event.stopPropagation();

            setActiveColumnId(columnId);
            setActiveColumnTitle(columnName);
            activeIdRef.current = `column-${columnId}`;

            event.dataTransfer.setData(
                DATA_TRANSFER_TYPES.COLUMN,
                JSON.stringify({ id: columnId, name: columnName }),
            );
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.dropEffect = "move";

            onDragStart(`column-${columnId}`);
            announce(`Начато перетаскивание колонки "${columnName}"`);
        },
        [onDragStart, announce, draggableColumnId],
    );

    // Функция для установки направления для колонки
    const setDropDirection = useCallback((columnId: number, direction: "left" | "right" | null) => {
        setDropDirectionForColumn((prev) => {
            const newMap = new Map(prev);
            if (direction === null) {
                newMap.delete(columnId);
            } else {
                newMap.set(columnId, direction);
            }
            return newMap;
        });
    }, []);

    // Обработка перетаскивания колонки над другой колонкой
    const handleColumnDragOver = useCallback(
        (event: React.DragEvent<HTMLElement>, columnId: number, columnName: string) => {
            if (!event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.COLUMN)) {
                return;
            }
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";

            if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.COLUMN)) {
                const rect = event.currentTarget.getBoundingClientRect();
                const mouseX = event.clientX;
                const midpoint = (rect.left + rect.right) / 2;
                const direction = mouseX <= midpoint ? "left" : "right";

                setDropDirection(columnId, direction);
                onDragOver(activeIdRef.current || "", `column-${columnId}`);
                announce(
                    `Колонка будет перемещена ${direction === "left" ? "перед" : "после"} колонки "${columnName}"`,
                );
            }
        },
        [onDragOver, announce, setDropDirection],
    );

    // Обработка падения колонки
    const handleColumnDrop = useCallback(
        (event: React.DragEvent<HTMLElement>, targetColumnId: number, targetColumnName: string) => {
            event.preventDefault();
            setDropDirection(targetColumnId, null);

            if (!event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.COLUMN)) return;

            const columnData = event.dataTransfer.getData(DATA_TRANSFER_TYPES.COLUMN);
            if (!columnData || !onReorderColumns) return;

            try {
                const sourceColumn = JSON.parse(columnData);

                const oldIndex = columns.findIndex((col) => col.id === sourceColumn.id);
                const targetIndex = columns.findIndex((col) => col.id === targetColumnId);

                if (oldIndex !== -1 && targetIndex !== -1 && oldIndex !== targetIndex) {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const midpoint = (rect.left + rect.right) / 2;
                    const direction = event.clientX <= midpoint ? "left" : "right";

                    const newColumns = [...columns];
                    const [movedColumn] = newColumns.splice(oldIndex, 1);
                    const targetIndexAfterRemoval = newColumns.findIndex(
                        (col) => col.id === targetColumnId,
                    );
                    const insertAt =
                        direction === "left"
                            ? targetIndexAfterRemoval
                            : targetIndexAfterRemoval + 1;
                    newColumns.splice(insertAt, 0, movedColumn);

                    const columnOrders = newColumns.map((col, index) => ({
                        id: col.id,
                        position: index,
                    }));

                    onReorderColumns(columnOrders);
                    onDragEnd(`column-${sourceColumn.id}`, `column-${targetColumnId}`);
                    announce(
                        `Колонка "${sourceColumn.name}" перемещена ${direction === "left" ? "перед" : "после"} колонкой "${targetColumnName}"`,
                    );
                }
            } catch {
                // console.error('Failed to parse column data:', error);
            }

            setActiveColumnId(undefined);
            setActiveColumnTitle("");
        },
        [columns, onReorderColumns, onDragEnd, announce, setDropDirection],
    );

    // ========== ОБРАБОТЧИКИ ДЛЯ ЗАДАЧ ==========

    // Обработка начала перетаскивания задачи
    const handleTaskDragStart = useCallback(
        (event: React.DragEvent<HTMLDivElement>, taskId: number, taskTitle: string) => {
            const task = findTask(taskId);
            if (!task) return;

            event.stopPropagation();

            setActiveTaskId(taskId);
            setActiveTaskTitle(taskTitle);
            activeIdRef.current = `task-${taskId}`;

            event.dataTransfer.setData(DATA_TRANSFER_TYPES.TASK, JSON.stringify(task));
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.dropEffect = "move";

            onDragStart(`task-${taskId}`);
            announce(`Начато перетаскивание задачи "${taskTitle}"`);
        },
        [findTask, onDragStart, announce],
    );

    // Обработка перетаскивания задачи над задачей
    const handleTaskDragOver = useCallback(
        (event: React.DragEvent<HTMLElement>, taskId: number, taskTitle: string) => {
            if (!event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.TASK)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "move";

            const rect = event.currentTarget.getBoundingClientRect();
            const mouseY = event.clientY;
            const midpoint = (rect.top + rect.bottom) / 2;
            const direction = mouseY <= midpoint ? "top" : "bottom";

            onDragOver(activeIdRef.current || "", `task-${taskId}`);
            announce(
                `Задача будет перемещена ${direction === "top" ? "перед" : "после"} задачи "${taskTitle}"`,
            );
        },
        [onDragOver, announce],
    );

    // Обработка падения задачи на колонку
    const handleTaskDropOnColumn = useCallback(
        (event: React.DragEvent<HTMLElement>, columnId: number, columnName: string) => {
            event.preventDefault();

            const taskData = event.dataTransfer.getData(DATA_TRANSFER_TYPES.TASK);
            if (!taskData || !onTaskMove) return;

            try {
                const task = JSON.parse(taskData) as Task;
                const targetColumn = findColumn(columnId);

                if (targetColumn) {
                    // Проверка WIP лимита
                    const wipLimit = targetColumn.wipLimit;
                    const currentTaskCount = targetColumn.tasks?.length || 0;

                    if (wipLimit && currentTaskCount >= wipLimit) {
                        announce(
                            `Невозможно переместить задачу. В колонке "${columnName}" достигнут лимит задач (${wipLimit})`,
                        );
                        setActiveTaskId(undefined);
                        setActiveTaskTitle("");
                        return;
                    }

                    const taskCount = targetColumn.tasks?.length || 0;
                    const isSameColumn = task.columnId === columnId;
                    const newPosition = isSameColumn ? Math.max(0, taskCount - 1) : taskCount;

                    if (isSameColumn && task.position === newPosition) {
                        setActiveTaskId(undefined);
                        setActiveTaskTitle("");
                        return;
                    }

                    onTaskMove(task.id, columnId, newPosition);
                    onDragEnd(`task-${task.id}`, `column-${columnId}`);
                    announce(`Задача "${task.title}" помещена в колонку "${columnName}"`);
                }
            } catch {
                // console.error('Failed to parse task data:', error);
            }

            setActiveTaskId(undefined);
            setActiveTaskTitle("");
        },
        [onTaskMove, findColumn, onDragEnd, announce],
    );

    // Обработка падения задачи на задачу
    const handleTaskDropOnTask = useCallback(
        (event: React.DragEvent<HTMLElement>, targetTaskId: number) => {
            event.preventDefault();
            event.stopPropagation();

            const taskData = event.dataTransfer.getData(DATA_TRANSFER_TYPES.TASK);

            if (!taskData || !onTaskMove) return;

            const rect = event.currentTarget.getBoundingClientRect();
            const midpoint = (rect.top + rect.bottom) / 2;
            const direction = event.clientY <= midpoint ? "top" : "bottom";

            try {
                const activeTask = JSON.parse(taskData) as Task;

                let targetColumn: ColumnWithTasksAndSubtasks | undefined;
                let targetTask: Task | undefined;

                for (const column of columns) {
                    const task = column.tasks?.find((t) => t.id === targetTaskId);
                    if (task) {
                        targetColumn = column;
                        targetTask = task;
                        break;
                    }
                }

                if (targetColumn && targetTask) {
                    // Проверка WIP лимита при перемещении в другую колонку
                    const isMovingToDifferentColumn = activeTask.columnId !== targetColumn.id;

                    if (isMovingToDifferentColumn && targetColumn.wipLimit) {
                        const currentTaskCount = targetColumn.tasks?.length || 0;
                        if (currentTaskCount >= targetColumn.wipLimit) {
                            announce(
                                `Невозможно переместить задачу. В колонке "${targetColumn.name}" достигнут лимит задач (${targetColumn.wipLimit})`,
                            );
                            setActiveTaskId(undefined);
                            setActiveTaskTitle("");
                            return;
                        }
                    }

                    let newPosition = targetTask.position;
                    if (direction === "bottom") {
                        newPosition = targetTask.position + 1;
                    }

                    onTaskMove(activeTask.id, targetColumn.id, newPosition);
                    onDragEnd(`task-${activeTask.id}`, `task-${targetTaskId}`);
                    announce(
                        `Задача "${activeTask.title}" перемещена ${direction === "top" ? "перед" : "после"} задачи "${targetTask.title}"`,
                    );
                }
            } catch {
                // console.error('Failed to parse task data:', error);
            }

            setActiveTaskId(undefined);
            setActiveTaskTitle("");
        },
        [columns, onTaskMove, onDragEnd, announce],
    );

    // ========== ОСТАЛЬНОЕ ==========

    // Обработка отмены перетаскивания
    const handleDragEnd = useCallback(() => {
        if (activeTaskId) {
            const task = findTask(activeTaskId);
            announce(`Перемещение задачи "${task?.title || activeTaskTitle}" отменено`);
            onDragCancel(`task-${activeTaskId}`);
        }
        if (activeColumnId) {
            announce(`Перемещение колонки "${activeColumnTitle}" отменено`);
            onDragCancel(`column-${activeColumnId}`);
        }
        setDropDirectionForColumn(new Map());
        setActiveTaskId(undefined);
        setActiveTaskTitle("");
        setActiveColumnId(undefined);
        setActiveColumnTitle("");
    }, [
        activeTaskId,
        activeTaskTitle,
        activeColumnId,
        activeColumnTitle,
        findTask,
        onDragCancel,
        announce,
    ]);

    // Генерируем уникальный ID для инструкций
    const instructionsId = React.useId();

    // Состояние загрузки
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    // Пустое состояние
    if (!columns.length) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                Нет колонок. Создайте первую колонку, чтобы начать работу.
            </div>
        );
    }

    return (
        <>
            <HiddenInstructions id={instructionsId} />
            <LiveRegion announcement={announcement} />

            <div
                className={cn("flex overflow-x-auto", className)}
                aria-label="Канбан-доска"
                aria-describedby={instructionsId}
            >
                {columns.map((column) => (
                    <div
                        key={column.id}
                        draggable={draggableColumnId === column.id}
                        onMouseDown={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-drag-handle="column"]')) {
                                setDraggableColumnId(column.id);
                            } else {
                                setDraggableColumnId(null);
                            }
                        }}
                        onMouseUp={() => setDraggableColumnId(null)}
                        onDragStart={(e) => handleColumnDragStart(e, column.id, column.name)}
                        onDragOver={(e) => handleColumnDragOver(e, column.id, column.name)}
                        onDragLeave={(e) => {
                            const related = e.relatedTarget as Node | null;
                            if (!related || !e.currentTarget.contains(related)) {
                                setDropDirection(column.id, null);
                            }
                        }}
                        onDrop={(e) => handleColumnDrop(e, column.id, column.name)}
                        className={cn(
                            "first:pl-0 -mr-[2px] px-2 border-r-2 border-l-2 border-r-transparent border-l-transparent",
                            activeColumnId === column.id,
                            dropDirectionForColumn.get(column.id) === "left" && "border-l-blue-500",
                            dropDirectionForColumn.get(column.id) === "right" && "border-r-blue-500",
                        )}
                    >
                        <KanbanColumn
                            column={column}
                            onAddTask={onAddTask}
                            onTaskClick={onTaskClick}
                            onDeleteTask={onDeleteTask}
                            onTaskDragStart={handleTaskDragStart}
                            onTaskDragOver={handleTaskDragOver}
                            onTaskDropOnColumn={handleTaskDropOnColumn}
                            onTaskDropOnTask={handleTaskDropOnTask}
                            onDragEnd={handleDragEnd}
                            activeTaskId={activeTaskId}
                            onRenameColumn={onRenameColumn}
                            onChangeColor={onChangeColor}
                            onDeleteColumn={onDeleteColumn}
                        />
                    </div>
                ))}

                {/* Кнопка "Добавить колонку" */}
                {onCreateColumn && (
                    <div className="ml-2 w-[260px] flex-shrink-0" ref={newColumnContainerRef}>
                        {isAddingColumn ? (
                            <div
                                className={cn(
                                    "w-[260px] flex-shrink-0 rounded-2xl flex flex-col",
                                    "border shadow-sm overflow-hidden",
                                    "h-[70vh] bg-white",
                                )}
                                onBlur={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                        handleCancelNewColumn();
                                    }
                                }}
                            >
                                {/* Заголовок */}
                                <div className="p-3 border-b flex-shrink-0 bg-[hsl(218,45%,94%)]">
                                    <div className="flex items-center justify-between gap-2">
                                        <Input
                                            ref={newColumnInputRef}
                                            value={newColumnName}
                                            onChange={(e) => setNewColumnName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleConfirmNewColumn();
                                                if (e.key === "Escape") handleCancelNewColumn();
                                            }}
                                            placeholder="Название колонки..."
                                            // className="h-auto py-0 px-0 text-sm font-semibold flex-1 min-w-0 border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
                                            className="h-6 py-1 px-2 text-sm font-semibold flex-1 min-w-0"
                                        />
                                        <button
                                            onClick={handleConfirmNewColumn}
                                            className="p-1 rounded-md hover:bg-black/10 text-gray-700 flex-shrink-0"
                                            aria-label="Создать колонку"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Тело колонки — пустое */}
                                <div className="flex-1" />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsAddingColumn(true)}
                                className="w-full justify-between text-sm text-black"
                                aria-label="Создать новую колонку"
                            >
                                Добавить колонку
                                <Plus className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}

                <div className="w-4 flex-shrink-0" aria-hidden="true" />
            </div>
        </>
    );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = (props) => {
    return (
        <DndMonitorProvider>
            <KanbanBoardInner {...props} />
        </DndMonitorProvider>
    );
};

export default KanbanBoard;
