// Типы для канбан-доски (как в forTables.ts - для бизнес-логики)

// Статусы задач (должны совпадать с бекендом)
export type TaskStatus = 'not_started' | 'in_progress' | 'review' | 'done';

// Приоритеты задач
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Цвета для колонок
export type ColumnColor = 'gray' | 'blue' | 'yellow' | 'green' | 'purple' | 'red';

// Участник команды (для назначения ответственных)
export interface Member {
    id: number;
    first_name: string;
    last_name: string;
    middleName?: string;
    email?: string;
    role: string; // bachelor, master, teacher
    avatarUrl?: string;
}

// Задача
export interface Task {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    order: number;
    projectId: number;
    createdById: number;
    assignees: Member[];
    dueDate?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

// Создание задачи
export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: TaskPriority;
    projectId: number;
    assigneeIds?: number[];
    dueDate?: string;
    tags?: string[];
}

// Обновление задачи
export interface UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeIds?: number[];
    dueDate?: string;
    tags?: string[];
}

// Обновление статуса (drag-and-drop)
export interface UpdateTaskStatusDto {
    status: TaskStatus;
    order: number;
}

// Колонка канбан-доски
export interface Column {
    id: number;
    projectId: number;
    name: string;
    color: ColumnColor;
    order: number;
    taskStatus: TaskStatus;
    allowedRoles: string; // "bachelor" или "master,teacher"
    createdAt: string;
    updatedAt: string;
}

// Колонка с задачами (для отображения)
export interface ColumnWithTasks extends Column {
    tasks: Task[];
    taskCount: number;
}

// Создание колонки
export interface CreateColumnDto {
    projectId: number;
    name: string;
    color: ColumnColor;
    taskStatus: TaskStatus;
    allowedRoles?: string[]; // ['bachelor'] или ['master', 'teacher']
}

// Обновление колонки
export interface UpdateColumnDto {
    name?: string;
    color?: ColumnColor;
    taskStatus?: TaskStatus;
    allowedRoles?: string[];
    order?: number;
}

// Фильтры для задач
export interface TaskFilters {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: number;
    createdById?: number;
    tag?: string;
    search?: string;
}

// Ответ с пагинацией
export interface PaginatedTasksResponse {
    items: Task[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// История задачи
export interface TaskHistory {
    id: number;
    taskId: number;
    changedBy: Member;
    oldStatus?: TaskStatus;
    newStatus?: TaskStatus;
    changeType: string; // 'status' | 'title' | 'description' | 'assignees'
    createdAt: string;
}

// Статистика проекта
export interface ProjectStats {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdue: number;
}

// Для drag-and-drop (dnd-kit)
export interface DragItem {
    id: number;
    type: 'task' | 'column';
    status?: TaskStatus;
    order: number;
}