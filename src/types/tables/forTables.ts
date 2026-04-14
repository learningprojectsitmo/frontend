export interface Member {
    id: number;
    name: string;
    role: string;
    contacts: string;
    resumeUrl: string;
    dateAdded: string;
    avatarUrl?: string;
    status: "default" | "delete";
}

export interface Replycant {
    id: number;
    name: string;
    priority: number;
    contacts: string;
    resumeUrl: string;
    responseDate: string;
    avatarUrl?: string;
    status: "invite" | "invited";
}

export interface Role {
    nameRole: string;
    responsibilities: string[];
    numberOfMembers: number;
}

export interface Platform {
    name: string;
    description: string;
    status: string;
    progressInPercent: number;
    due: string;
    tags: string[];
    members: number;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";

// Участник команды
export interface ProjectMember {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
}

// ========== ДОСКА ==========

export interface Board {
    projectId: number;
    projectName: string;
    columns: ColumnWithTasksAndSubtasks[];
}

// ========== КОЛОНКА ==========

export interface Column {
    id: number;
    projectId: number;
    name: string;
    color: string;
    position: number;
    wipLimit?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ColumnWithTasks extends Column {
    tasks: Task[];
    taskCount: number;
}

export interface ColumnWithTasksAndSubtasks extends Column {
    tasks: TaskWithSubtasks[];
    taskCount: number;
}

export interface CreateColumnDto {
    projectId: number;
    name: string;
    color: string;
    wipLimit?: number;
}

export interface UpdateColumnDto {
    name?: string;
    color?: string;
    position?: number;
    wipLimit?: number;
}

// ========== ЗАДАЧА ==========

export interface Task {
    id: number;
    title: string;
    description?: string;
    priority?: TaskPriority;
    position: number;
    columnId: number;
    projectId: number;
    createdById: number;
    assignees: ProjectMember[];
    createdBy?: ProjectMember;
    dueDate?: string;
    tags?: string;
    createdAt: string;
    updatedAt: string;
    subtasks?: Subtask[];
    subtaskCount?: number;
}

export interface TaskWithSubtasks extends Task {
    subtasks: Subtask[];
    subtaskCount: number;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: TaskPriority;
    columnId: number;
    assigneeIds?: number[];
    dueDate?: string;
    tags?: string[];
}

export interface UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    columnId?: number;
    position?: number;
    assigneeIds?: number[];
    dueDate?: string;
    tags?: string[];
}

export interface MoveTaskDto {
    columnId: number;
    position: number;
}

// ========== ПОДЗАДАЧИ ==========

export interface Subtask {
    id: number;
    taskId: number;
    title: string;
    isCompleted: boolean;
    position: number;
    createdById: number;
    createdBy?: ProjectMember;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSubtaskDto {
    taskId: number;
    title: string;
    isCompleted?: boolean;
}

export interface UpdateSubtaskDto {
    title?: string;
    isCompleted?: boolean;
    position?: number;
}

export interface SubtaskListResponse {
    items: Subtask[];
    total: number;
}

export interface SubtaskReorderDto {
    subtasks: { id: number; position: number }[];
}

// ========== ФИЛЬТРЫ ==========

export interface TaskFilters {
    columnId?: number;
    priority?: TaskPriority;
    assigneeId?: number;
    createdById?: number;
    tag?: string;
    search?: string;
    dueBefore?: string;
    dueAfter?: string;
}

// ========== ИСТОРИЯ ==========

export interface TaskHistory {
    id: number;
    taskId: number;
    changedBy: ProjectMember;
    oldColumnId?: number;
    newColumnId?: number;
    changeType: "move" | "title" | "description" | "assignees";
    changeData?: Record<string, unknown>;
    createdAt: string;
}

// ========== СТАТИСТИКА ==========

export interface ProjectStats {
    total: number;
    byColumn: Record<number, number>;
    byPriority: {
        low: number;
        medium: number;
        high: number;
        urgent: number;
    };
    overdue: number;
    withoutAssignee: number;
    columnNames: Record<number, string>;
}

// ========== DRAG AND DROP ==========

export interface DragItem {
    id: number;
    type: "task" | "column";
    columnId?: number;
    position?: number;
}
