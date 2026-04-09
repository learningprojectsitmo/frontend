import type { ColumnWithTasksAndSubtasks, ColumnWithTasks, Task } from '@/types/tables/forTables';

export interface KanbanBoardProps {
    columns: ColumnWithTasksAndSubtasks[];
    isLoading?: boolean;
    onAddTask?: (columnId: number) => void;
    onTaskClick?: (task: Task) => void;
    onDeleteTask?: (taskId: number) => void;
    onTaskMove?: (taskId: number, targetColumnId: number, targetPosition: number) => void;
    onReorderColumns?: (columnOrders: { id: number; position: number }[]) => void; // Добавляем для переупорядочивания колонок
    onRenameColumn?: (columnId: number, newName: string) => void;
    onChangeColor?: (columnId: number, color: string) => void;
    onDeleteColumn?: (columnId: number) => void; 
    className?: string;
}

export interface KanbanColumnProps {
    column: ColumnWithTasks;
    onTaskClick?: (task: Task) => void;
    onAddTask?: (columnId: number) => void;
    onDeleteTask?: (taskId: number) => void;
    onTaskDragStart?: (event: React.DragEvent<HTMLDivElement>, taskId: number, taskTitle: string) => void;
    onTaskDragOver?: (event: React.DragEvent<HTMLElement>, taskId: number, taskTitle: string) => void;
    onTaskDropOnColumn?: (event: React.DragEvent<HTMLElement>, columnId: number, columnName: string) => void;
    onTaskDropOnTask?: (event: React.DragEvent<HTMLElement>, taskId: number) => void;
    onDragEnd?: () => void;
    activeTaskId?: number;
    isDragging?: boolean;
    onRenameColumn?: (columnId: number, newName: string) => void;
    onChangeColor?: (columnId: number, color: string) => void;
    onDeleteColumn?: (columnId: number) => void;
}

export interface KanbanTaskProps {
    task: Task;
    isDragging?: boolean;
    onClick?: (task: Task) => void;
    onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: number) => void;
    onToggleSubtask?: (subtaskId: number) => void;
}