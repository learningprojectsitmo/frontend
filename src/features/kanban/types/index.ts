import type { ApiColumnWithTasks, ApiTask } from '@/types/api';

export interface KanbanCardProps {
    task: ApiTask;
    isDragging?: boolean;
    onEdit?: (task: ApiTask) => void;
    onDelete?: (taskId: number) => void;
    onClick?: (task: ApiTask) => void;  // Добавили onClick
}

export interface KanbanColumnProps {
    column: ApiColumnWithTasks;
    onTaskClick?: (task: ApiTask) => void;
    onTaskDrop?: (taskId: number, newStatus: string, newOrder: number) => void;
    isDropDisabled?: boolean;
}

export interface KanbanBoardProps {
    projectId: number;
    columns: ApiColumnWithTasks[];
    isLoading?: boolean;
    onTaskClick?: (task: ApiTask) => void;
    onTaskDrop?: (taskId: number, newStatus: string, newOrder: number) => void;
    onColumnDrop?: (activeId: number, overId: number) => void;
}