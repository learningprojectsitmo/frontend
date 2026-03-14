import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { TaskCard } from './task-card';
import { columnColors, statusLabels } from '../utils/column-styles';
import type { KanbanColumnProps } from '../types';

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    column,
    onTaskClick,
    // onTaskDrop пока не используем
    isDropDisabled = false
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: column.task_status,
        disabled: isDropDisabled,
    });

    const colors = columnColors[column.color as keyof typeof columnColors] || columnColors.gray;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-1 min-w-[280px] rounded-lg transition-colors",
                colors.bg,
                isOver && !isDropDisabled && "ring-2 ring-blue-400 ring-opacity-50"
            )}
        >
            {/* Заголовок колонки */}
            <div className={cn("p-3 rounded-t-lg", colors.header)}>
                <div className="flex items-center justify-between">
                    <h3 className={cn("font-medium", colors.text)}>
                        {column.name}
                        <span className="ml-2 text-sm opacity-75">
                            ({column.task_count})
                        </span>
                    </h3>
                    
                    {/* Статус (для отладки) */}
                    <span className="text-xs opacity-50">
                        {statusLabels[column.task_status]}
                    </span>
                </div>
            </div>

            {/* Список задач */}
            <div className="p-2 min-h-[200px] max-h-[calc(100vh-200px)] overflow-y-auto">
                <SortableContext
                    items={column.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {column.tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onClick={onTaskClick}
                        />
                    ))}
                </SortableContext>

                {/* Пустое состояние */}
                {column.tasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                        Перетащите задачу сюда
                    </div>
                )}
            </div>
        </div>
    );
};