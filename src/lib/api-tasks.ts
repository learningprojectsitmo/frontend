import { api } from "./api-client";
import type { ApiTask, ApiColumn, ApiColumnWithTasks,ApiTaskHistory } from "@/types/api";
import type { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto,TaskFilters,CreateColumnDto,UpdateColumnDto} from "@/types/kanban";

const TASKS_URL = '/tasks';

// Тип для ответа с пагинацией (как в бекенде)
interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export const tasksApi = {
    // === ЗАДАЧИ ===

    /**
     * Получить задачи проекта с фильтрацией
     */
    getProjectTasks: (
        projectId: number, 
        filters?: TaskFilters,
        page: number = 1,
        pageSize: number = 50
    ): Promise<PaginatedResponse<ApiTask>> => {
        const params = new URLSearchParams();
        
        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.assigneeId) params.append('assignee_id', filters.assigneeId.toString());
        if (filters?.createdById) params.append('created_by_id', filters.createdById.toString());
        if (filters?.tag) params.append('tag', filters.tag);
        if (filters?.search) params.append('search', filters.search);
        
        params.append('page', page.toString());
        params.append('page_size', pageSize.toString());

        return api.get(`${TASKS_URL}/project/${projectId}?${params}`);
    },

    /**
     * Получить задачу по ID
     */
    getTaskById: (taskId: number): Promise<ApiTask> => {
        return api.get(`${TASKS_URL}/${taskId}`);
    },

    /**
     * Создать новую задачу
     */
    createTask: (data: CreateTaskDto): Promise<ApiTask> => {
        // Конвертируем camelCase в snake_case для бекенда
        const payload = {
            title: data.title,
            description: data.description,
            priority: data.priority,
            project_id: data.projectId,
            assignee_ids: data.assigneeIds,
            due_date: data.dueDate,
            tags: data.tags,
        };
        return api.post(TASKS_URL, payload);
    },

    /**
     * Обновить задачу
     */
    updateTask: (taskId: number, data: UpdateTaskDto): Promise<ApiTask> => {
        const payload: Record<string, any> = {};
        
        if (data.title !== undefined) payload.title = data.title;
        if (data.description !== undefined) payload.description = data.description;
        if (data.priority !== undefined) payload.priority = data.priority;
        if (data.assigneeIds !== undefined) payload.assignee_ids = data.assigneeIds;
        if (data.dueDate !== undefined) payload.due_date = data.dueDate;
        if (data.tags !== undefined) payload.tags = data.tags;

        return api.put(`${TASKS_URL}/${taskId}`, payload);
    },

    /**
     * Обновить статус задачи (для drag-and-drop)
     */
    updateTaskStatus: (taskId: number, data: UpdateTaskStatusDto): Promise<ApiTask> => {
        return api.patch(`${TASKS_URL}/${taskId}/status`, data);
    },

    /**
     * Удалить задачу
     */
    deleteTask: (taskId: number): Promise<void> => {
        return api.delete(`${TASKS_URL}/${taskId}`);
    },

    /**
     * Получить историю изменений задачи
     */
    getTaskHistory: (taskId: number, limit: number = 50): Promise<ApiTaskHistory[]> => {
        return api.get(`${TASKS_URL}/${taskId}/history?limit=${limit}`);
    },

    // === КОЛОНКИ ===

    /**
     * Получить все колонки проекта
     */
    getProjectColumns: (projectId: number): Promise<{ items: ApiColumn[]; total: number }> => {
        return api.get(`${TASKS_URL}/columns/project/${projectId}`);
    },

    /**
     * Получить колонки с задачами (для канбан-доски)
     */
    getColumnsWithTasks: (projectId: number): Promise<ApiColumnWithTasks[]> => {
        return api.get(`${TASKS_URL}/columns/project/${projectId}/with-tasks`);
    },

    /**
     * Создать новую колонку (только магистр/преподаватель)
     */
    createColumn: (data: CreateColumnDto): Promise<ApiColumn> => {
        const payload = {
            project_id: data.projectId,
            name: data.name,
            color: data.color,
            task_status: data.taskStatus,
            allowed_roles: data.allowedRoles?.join(','),
        };
        return api.post(`${TASKS_URL}/columns/`, payload);
    },

    /**
     * Обновить колонку
     */
    updateColumn: (columnId: number, data: UpdateColumnDto): Promise<ApiColumn> => {
        const payload: Record<string, any> = {};
        
        if (data.name !== undefined) payload.name = data.name;
        if (data.color !== undefined) payload.color = data.color;
        if (data.taskStatus !== undefined) payload.task_status = data.taskStatus;
        if (data.allowedRoles !== undefined) payload.allowed_roles = data.allowedRoles.join(',');
        if (data.order !== undefined) payload.order = data.order;

        return api.put(`${TASKS_URL}/columns/${columnId}`, payload);
    },

    /**
     * Удалить колонку
     */
    deleteColumn: (columnId: number): Promise<void> => {
        return api.delete(`${TASKS_URL}/columns/${columnId}`);
    },

    /**
     * Изменить порядок колонок
     */
    reorderColumns: (projectId: number, columnOrders: { id: number; order: number }[]): Promise<void> => {
        return api.post(`${TASKS_URL}/columns/project/${projectId}/reorder`, { 
            tasks: columnOrders 
        });
    },

    // === СТАТИСТИКА ===

    /**
     * Получить статистику по задачам проекта
     */
    getProjectStats: (projectId: number): Promise<{
        total: number;
        by_status: Record<string, number>;
        by_priority: Record<string, number>;
        overdue: number;
    }> => {
        return api.get(`${TASKS_URL}/project/${projectId}/stats`);
    },
};

// Типы для React Query (как в react-query.ts)
export type TasksApiFnReturnType<T extends (...args: unknown[]) => Promise<unknown>> = Awaited<
    ReturnType<T>
>;

export type TasksQueryConfig<T extends (...args: unknown[]) => unknown> = Omit<
    ReturnType<T>,
    "queryKey" | "queryFn"
>;