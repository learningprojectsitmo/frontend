import React from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import type { KanbanBoardProps } from '../types';
import type { ApiTask } from '@/types/api';

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    // projectId пока не используем, но может понадобиться позже
    columns,
    isLoading,
    onTaskClick,
    onTaskDrop,
    // onColumnDrop пока не используем
}) => {
    const [activeTask, setActiveTask] = React.useState<ApiTask | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;

        // Находим активную задачу
        for (const column of columns) {
            const task = column.tasks.find(t => t.id === active.id);
            if (task) {
                setActiveTask(task);
                break;
            }
        }
    };

    const handleDragOver = (_event: DragOverEvent) => {
        // Здесь можно добавить логику подсветки колонки при перетаскивании
        // Пока оставляем пустым
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!over) return;

        // Преобразуем ID в число (так как наша задача использует number)
        const activeId = active.id as number;
        
        if (!activeTask) return;

        // Проверяем, является ли целью колонка или задача
        const isOverColumn = columns.some(col => col.task_status === over.id);

        if (isOverColumn && onTaskDrop) {
            // Перетаскивание в колонку
            const targetColumn = columns.find(col => col.task_status === over.id);
            if (targetColumn) {
                onTaskDrop(
                    activeId,
                    targetColumn.task_status,
                    targetColumn.tasks.length // новый порядок - в конец
                );
            }
        } else if (!isOverColumn && onTaskDrop) {
            // Перетаскивание на другую задачу (для изменения порядка)
            const overTaskId = over.id as number;
            
            // Находим задачу, на которую перетащили
            for (const column of columns) {
                const overTask = column.tasks.find(t => t.id === overTaskId);
                if (overTask) {
                    onTaskDrop(
                        activeId,
                        overTask.status,
                        overTask.order
                    );
                    break;
                }
            }
        }

        setActiveTask(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-100px)]">
                <SortableContext
                    items={columns.map(col => col.task_status)}
                    strategy={horizontalListSortingStrategy}
                >
                    {columns.map((column) => (
                        <KanbanColumn
                            key={column.task_status}
                            column={column}
                            onTaskClick={onTaskClick}
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
};