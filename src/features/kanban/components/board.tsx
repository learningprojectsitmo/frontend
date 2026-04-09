import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { KanbanColumn } from './column';
import { DndMonitorProvider, useAnnouncement, useDndEvents, LiveRegion, HiddenInstructions } from './accessibility';
import type { KanbanBoardProps } from '../types';
import type { ColumnWithTasksAndSubtasks, Task } from '@/types/tables/forTables';

const DATA_TRANSFER_TYPES = {
    TASK: 'kanban-board-task',
    COLUMN: 'kanban-board-column',
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
    isLoading,
    className,
}) => {
    const [activeTaskId, setActiveTaskId] = useState<number | undefined>(undefined);
    const [activeTaskTitle, setActiveTaskTitle] = useState<string>('');
    const [activeColumnId, setActiveColumnId] = useState<number | undefined>(undefined);
    const [activeColumnTitle, setActiveColumnTitle] = useState<string>('');
    const [dropDirectionForColumn, setDropDirectionForColumn] = useState<Map<number, 'left' | 'right'>>(new Map());
    const { announce, announcement } = useAnnouncement();
    const { onDragStart, onDragOver, onDragEnd, onDragCancel } = useDndEvents();
    const activeIdRef = useRef<string | null>(null);

    // Поиск колонки по ID
    const findColumn = useCallback(
        (columnId: number): ColumnWithTasksAndSubtasks | undefined => {
            return columns.find((col) => col.id === columnId);
        },
        [columns]
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
        [columns]
    );

    // ========== ОБРАБОТЧИКИ ДЛЯ КОЛОНОК ==========

    // Обработка начала перетаскивания колонки
    const handleColumnDragStart = useCallback(
        (event: React.DragEvent<HTMLElement>, columnId: number, columnName: string) => {
            if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.TASK)) {
                event.preventDefault();
                return;
            }
            
            event.stopPropagation();
            
            setActiveColumnId(columnId);
            setActiveColumnTitle(columnName);
            activeIdRef.current = `column-${columnId}`;

            event.dataTransfer.setData(DATA_TRANSFER_TYPES.COLUMN, JSON.stringify({ id: columnId, name: columnName }));
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';

            onDragStart(`column-${columnId}`);
            announce(`Начато перетаскивание колонки "${columnName}"`);
        },
        [onDragStart, announce]
    );

    // Функция для установки направления для колонки
    const setDropDirection = useCallback((columnId: number, direction: 'left' | 'right' | null) => {
        setDropDirectionForColumn(prev => {
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
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';

            if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.COLUMN)) {
                const rect = event.currentTarget.getBoundingClientRect();
                const mouseX = event.clientX;
                const midpoint = (rect.left + rect.right) / 2;
                const direction = mouseX <= midpoint ? 'left' : 'right';
                
                setDropDirection(columnId, direction);
                onDragOver(activeIdRef.current || '', `column-${columnId}`);
                announce(`Колонка будет перемещена ${direction === 'left' ? 'перед' : 'после'} колонки "${columnName}"`);
            }
        },
        [onDragOver, announce, setDropDirection]
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
                
                const oldIndex = columns.findIndex(col => col.id === sourceColumn.id);
                const newIndex = columns.findIndex(col => col.id === targetColumnId);
                
                if (oldIndex !== -1 && newIndex !== -1) {
                    const newColumns = [...columns];
                    const [movedColumn] = newColumns.splice(oldIndex, 1);
                    newColumns.splice(newIndex, 0, movedColumn);
                    
                    const columnOrders = newColumns.map((col, index) => ({
                        id: col.id,
                        position: index,
                    }));
                    
                    onReorderColumns(columnOrders);
                    onDragEnd(`column-${sourceColumn.id}`, `column-${targetColumnId}`);
                    announce(`Колонка "${sourceColumn.name}" перемещена ${oldIndex < newIndex ? 'после' : 'перед'} колонкой "${targetColumnName}"`);
                }
            } catch (error) {
                console.error('Failed to parse column data:', error);
            }

            setActiveColumnId(undefined);
            setActiveColumnTitle('');
        },
        [columns, onReorderColumns, onDragEnd, announce, setDropDirection]
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
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';

            onDragStart(`task-${taskId}`);
            announce(`Начато перетаскивание задачи "${taskTitle}"`);
        },
        [findTask, onDragStart, announce]
    );

    // Обработка перетаскивания задачи над задачей
    const handleTaskDragOver = useCallback(
        (event: React.DragEvent<HTMLElement>, taskId: number, taskTitle: string) => {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'move';

            if (event.dataTransfer.types.includes(DATA_TRANSFER_TYPES.TASK)) {
                const rect = event.currentTarget.getBoundingClientRect();
                const mouseY = event.clientY;
                const midpoint = (rect.top + rect.bottom) / 2;
                const direction = mouseY <= midpoint ? 'top' : 'bottom';

                onDragOver(activeIdRef.current || '', `task-${taskId}`);
                announce(`Задача будет перемещена ${direction === 'top' ? 'перед' : 'после'} задачи "${taskTitle}"`);

                event.dataTransfer.setData('text/plain', direction);
            }
        },
        [onDragOver, announce]
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
                        announce(`Невозможно переместить задачу. В колонке "${columnName}" достигнут лимит задач (${wipLimit})`);
                        setActiveTaskId(undefined);
                        setActiveTaskTitle('');
                        return;
                    }
                    
                    const newPosition = targetColumn.tasks?.length || 0;
                    onTaskMove(task.id, columnId, newPosition);
                    onDragEnd(`task-${task.id}`, `column-${columnId}`);
                    announce(`Задача "${task.title}" помещена в колонку "${columnName}"`);
                }
            } catch (error) {
                console.error('Failed to parse task data:', error);
            }

            setActiveTaskId(undefined);
            setActiveTaskTitle('');
        },
        [onTaskMove, findColumn, onDragEnd, announce]
    );

    // Обработка падения задачи на задачу
    const handleTaskDropOnTask = useCallback(
        (event: React.DragEvent<HTMLElement>, targetTaskId: number) => {
            event.preventDefault();
            event.stopPropagation();

            const taskData = event.dataTransfer.getData(DATA_TRANSFER_TYPES.TASK);
            const direction = event.dataTransfer.getData('text/plain');

            if (!taskData || !onTaskMove) return;

            try {
                const activeTask = JSON.parse(taskData) as Task;

                let targetColumn: ColumnWithTasksAndSubtasks | undefined;
                let targetTask: Task | undefined;

                for (const column of columns) {
                    const task = column.tasks?.find(t => t.id === targetTaskId);
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
                            announce(`Невозможно переместить задачу. В колонке "${targetColumn.name}" достигнут лимит задач (${targetColumn.wipLimit})`);
                            setActiveTaskId(undefined);
                            setActiveTaskTitle('');
                            return;
                        }
                    }
                    
                    let newPosition = targetTask.position;
                    if (direction === 'bottom') {
                        newPosition = targetTask.position + 1;
                    }

                    onTaskMove(activeTask.id, targetColumn.id, newPosition);
                    onDragEnd(`task-${activeTask.id}`, `task-${targetTaskId}`);
                    announce(`Задача "${activeTask.title}" перемещена ${direction === 'top' ? 'перед' : 'после'} задачи "${targetTask.title}"`);
                }
            } catch (error) {
                console.error('Failed to parse task data:', error);
            }

            setActiveTaskId(undefined);
            setActiveTaskTitle('');
        },
        [columns, onTaskMove, onDragEnd, announce]
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
        setActiveTaskTitle('');
        setActiveColumnId(undefined);
        setActiveColumnTitle('');
    }, [activeTaskId, activeTaskTitle, activeColumnId, activeColumnTitle, findTask, onDragCancel, announce]);

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
                className={cn(
                    'flex gap-4 pb-4 overflow-x-auto min-h-[500px]',
                    className
                )}
                role="region"
                aria-label="Канбан-доска"
                aria-describedby={instructionsId}
            >
                {columns.map((column) => (
                    <div
                        key={column.id}
                        draggable
                        onDragStart={(e) => handleColumnDragStart(e, column.id, column.name)}
                        onDragOver={(e) => handleColumnDragOver(e, column.id, column.name)}
                        onDrop={(e) => handleColumnDrop(e, column.id, column.name)}
                        className={cn(
                            'relative transition-all duration-200',
                            activeColumnId === column.id && 'opacity-50'
                        )}
                    >
                        {dropDirectionForColumn.get(column.id) === 'left' && (
                            <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full shadow-lg z-10" />
                        )}
                        {dropDirectionForColumn.get(column.id) === 'right' && (
                            <div className="absolute -right-2 top-0 bottom-0 w-0.5 bg-blue-500 rounded-full shadow-lg z-10" />
                        )}
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