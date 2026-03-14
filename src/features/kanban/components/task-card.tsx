import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { priorityColors } from '../utils/column-styles';
import type { KanbanCardProps } from '../types';

export const TaskCard: React.FC<KanbanCardProps> = ({ 
    task, 
    isDragging, 
    onClick,
    onEdit,
    onDelete 
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const dragging = isDragging || isSortableDragging;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "bg-white rounded-lg p-4 shadow-sm border border-gray-200",
                "hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                "relative group", // добавили group для hover эффектов
                dragging && "opacity-50 shadow-lg rotate-[2deg] scale-105",
                "mb-2"
            )}
            onClick={() => onClick?.(task)}
        >
            {/* Заголовок */}
            <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
            
            {/* Описание (если есть) */}
            {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Нижняя панель */}
            <div className="flex items-center justify-between">
                {/* Приоритет */}
                <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    priorityColors[task.priority]
                )}>
                    {task.priority === 'low' && 'Низкий'}
                    {task.priority === 'medium' && 'Средний'}
                    {task.priority === 'high' && 'Высокий'}
                    {task.priority === 'urgent' && 'Срочно'}
                </span>

                {/* Ответственные */}
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-2">
                        {task.assignees.slice(0, 3).map((assignee) => (
                            <div
                                key={assignee.id}
                                className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium"
                                title={`${assignee.first_name} ${assignee.last_name}`}
                            >
                                {assignee.first_name?.[0]}{assignee.last_name?.[0]}
                            </div>
                        ))}
                        {task.assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                                +{task.assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Дедлайн (если есть) */}
            {task.due_date && (
                <div className="mt-2 text-xs text-gray-500">
                    📅 {new Date(task.due_date).toLocaleDateString()}
                </div>
            )}

            {/* Кнопки действий (при наведении) */}
            <div className="hidden group-hover:flex absolute top-2 right-2 gap-1">
                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                    >
                        ✏️
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                    >
                        🗑️
                    </button>
                )}
            </div>
        </div>
    );
};