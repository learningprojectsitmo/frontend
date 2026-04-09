import { api } from "./api-client";
import type {
    ApiBoard,
    ApiColumn,
    ApiTask,
    ApiSubtask,
    ApiSubtaskListResponse,
    ApiTaskHistory,
    ApiProjectStats,
} from "@/types/api";
import type {
    CreateColumnDto,
    UpdateColumnDto,
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    TaskFilters,
    CreateSubtaskDto,
    UpdateSubtaskDto,
} from "@/types/tables/forTables";

const KANBAN_URL = "/kanban";

// Тип для ответа с пагинацией
interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Тип для ответа /users
interface UsersResponse {
    items: Array<{
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        middle_name: string;
        isu_number: number;
        tg_nickname: string | null;
    }>;
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

// Тип для создания колонки (преобразование snake_case в camelCase)
interface CreateColumnPayload {
    project_id: number;
    name: string;
    color: string;
    wip_limit?: number;
}

// Тип для обновления колонки
interface UpdateColumnPayload {
    name?: string;
    color?: string;
    position?: number;
    wip_limit?: number;
}

// Тип для создания задачи
interface CreateTaskPayload {
    title: string;
    description?: string;
    column_id: number;
    priority?: string;
    assignee_ids?: number[];
    due_date?: string;
    tags?: string[];
}

// Тип для обновления задачи
interface UpdateTaskPayload {
    title?: string;
    description?: string;
    priority?: string;
    assignee_ids?: number[];
    due_date?: string;
    tags?: string[];
}

// Тип для перемещения задачи
interface MoveTaskPayload {
    column_id: number;
    position: number;
}

// Тип для создания подзадачи
interface CreateSubtaskPayload {
    task_id: number;
    title: string;
    is_completed?: boolean;
}

// Тип для обновления подзадачи
interface UpdateSubtaskPayload {
    title?: string;
    is_completed?: boolean;
    position?: number;
}

// Тип для переупорядочивания
interface ReorderPayload {
    tasks?: { id: number; position: number }[];
    subtasks?: { id: number; position: number }[];
}

export const kanbanApi = {
    // Todo нужны участники команды, а не все пользователи
    getAllUsers: (): Promise<UsersResponse> => {
        return api.get("/users");
    },

    // ========== ДОСКА ==========

    getBoard: (projectId: number): Promise<ApiBoard> => {
        return api.get(`${KANBAN_URL}/${projectId}`);
    },

    // ========== КОЛОНКИ ==========

    getProjectColumns: (projectId: number): Promise<{ items: ApiColumn[]; total: number }> => {
        return api.get(`${KANBAN_URL}/columns/project/${projectId}`);
    },

    createColumn: (data: CreateColumnDto): Promise<ApiColumn> => {
        const payload: CreateColumnPayload = {
            project_id: data.projectId,
            name: data.name,
            color: data.color,
        };

        if (data.wipLimit !== undefined && data.wipLimit !== null) {
            payload.wip_limit = data.wipLimit;
        }

        return api.post(`${KANBAN_URL}/columns`, payload);
    },

    updateColumn: (columnId: number, data: UpdateColumnDto): Promise<ApiColumn> => {
        const payload: UpdateColumnPayload = {};

        if (data.name !== undefined) payload.name = data.name;
        if (data.color !== undefined) payload.color = data.color;
        if (data.position !== undefined) payload.position = data.position;
        if (data.wipLimit !== undefined) payload.wip_limit = data.wipLimit;

        return api.put(`${KANBAN_URL}/columns/${columnId}`, payload);
    },

    deleteColumn: (columnId: number): Promise<void> => {
        return api.delete(`${KANBAN_URL}/columns/${columnId}`);
    },

    reorderColumns: (
        projectId: number,
        columnOrders: { id: number; position: number }[],
    ): Promise<void> => {
        const payload: ReorderPayload = { tasks: columnOrders };
        return api.post(`${KANBAN_URL}/columns/project/${projectId}/reorder`, payload);
    },

    // ========== ЗАДАЧИ ==========

    getTaskById: (taskId: number): Promise<ApiTask> => {
        return api.get(`${KANBAN_URL}/tasks/${taskId}`);
    },

    createTask: (data: CreateTaskDto): Promise<ApiTask> => {
        const payload: CreateTaskPayload = {
            title: data.title,
            description: data.description,
            column_id: data.columnId,
        };

        if (data.priority) payload.priority = data.priority;
        if (data.assigneeIds?.length) payload.assignee_ids = data.assigneeIds;
        if (data.dueDate && data.dueDate !== "") {
            payload.due_date = data.dueDate;
        }
        if (data.tags?.length) payload.tags = data.tags;

        return api.post(`${KANBAN_URL}/tasks`, payload);
    },

    updateTask: (taskId: number, data: UpdateTaskDto): Promise<ApiTask> => {
        const payload: UpdateTaskPayload = {};

        if (data.title !== undefined) payload.title = data.title;
        if (data.description !== undefined) payload.description = data.description;
        if (data.priority !== undefined) payload.priority = data.priority;
        if (data.assigneeIds !== undefined) payload.assignee_ids = data.assigneeIds;
        if (data.dueDate !== undefined && data.dueDate !== "") {
            payload.due_date = data.dueDate;
        }
        if (data.tags !== undefined) payload.tags = data.tags;

        return api.put(`${KANBAN_URL}/tasks/${taskId}`, payload);
    },

    deleteTask: (taskId: number): Promise<void> => {
        return api.delete(`${KANBAN_URL}/tasks/${taskId}`);
    },

    moveTask: (taskId: number, data: MoveTaskDto): Promise<ApiTask> => {
        const payload: MoveTaskPayload = {
            column_id: data.columnId,
            position: data.position,
        };

        return api.patch(`${KANBAN_URL}/tasks/${taskId}/move`, payload);
    },

    reorderTasksInColumn: (
        columnId: number,
        taskOrders: { id: number; position: number }[],
    ): Promise<void> => {
        const payload: ReorderPayload = { tasks: taskOrders };
        return api.post(`${KANBAN_URL}/tasks/column/${columnId}/reorder`, payload);
    },

    // ========== ПОДЗАДАЧИ ==========

    getSubtasksByTask: (taskId: number): Promise<ApiSubtaskListResponse> => {
        return api.get(`${KANBAN_URL}/tasks/${taskId}/subtasks`);
    },

    getSubtaskById: (subtaskId: number): Promise<ApiSubtask> => {
        return api.get(`${KANBAN_URL}/subtasks/${subtaskId}`);
    },

    createSubtask: (data: CreateSubtaskDto): Promise<ApiSubtask> => {
        const payload: CreateSubtaskPayload = {
            task_id: data.taskId,
            title: data.title,
        };
        if (data.isCompleted !== undefined) payload.is_completed = data.isCompleted;

        return api.post(`${KANBAN_URL}/subtasks`, payload);
    },

    updateSubtask: (subtaskId: number, data: UpdateSubtaskDto): Promise<ApiSubtask> => {
        const payload: UpdateSubtaskPayload = {};

        if (data.title !== undefined) payload.title = data.title;
        if (data.isCompleted !== undefined) payload.is_completed = data.isCompleted;
        if (data.position !== undefined) payload.position = data.position;

        return api.put(`${KANBAN_URL}/subtasks/${subtaskId}`, payload);
    },

    toggleSubtaskCompletion: (subtaskId: number): Promise<ApiSubtask> => {
        return api.patch(`${KANBAN_URL}/subtasks/${subtaskId}/toggle`);
    },

    deleteSubtask: (subtaskId: number): Promise<void> => {
        return api.delete(`${KANBAN_URL}/subtasks/${subtaskId}`);
    },

    reorderSubtasks: (
        taskId: number,
        subtaskOrders: { id: number; position: number }[],
    ): Promise<void> => {
        const payload: ReorderPayload = { subtasks: subtaskOrders };
        return api.post(`${KANBAN_URL}/tasks/${taskId}/subtasks/reorder`, payload);
    },

    // ========== ФИЛЬТРЫ ==========

    filterTasks: (
        projectId: number,
        filters?: TaskFilters,
        page: number = 1,
        pageSize: number = 50,
    ): Promise<PaginatedResponse<ApiTask>> => {
        const params = new URLSearchParams();

        if (filters?.columnId) params.append("column_id", filters.columnId.toString());
        if (filters?.priority) params.append("priority", filters.priority);
        if (filters?.assigneeId) params.append("assignee_id", filters.assigneeId.toString());
        if (filters?.createdById) params.append("created_by_id", filters.createdById.toString());
        if (filters?.tag) params.append("tag", filters.tag);
        if (filters?.search) params.append("search", filters.search);
        if (filters?.dueBefore) params.append("due_before", filters.dueBefore);
        if (filters?.dueAfter) params.append("due_after", filters.dueAfter);

        params.append("page", page.toString());
        params.append("page_size", pageSize.toString());

        return api.get(`${KANBAN_URL}/tasks/filter/${projectId}?${params}`);
    },

    // ========== ИСТОРИЯ ==========

    getTaskHistory: (taskId: number, limit: number = 50): Promise<ApiTaskHistory[]> => {
        return api.get(`${KANBAN_URL}/tasks/${taskId}/history?limit=${limit}`);
    },

    // ========== СТАТИСТИКА ==========

    getProjectStats: (projectId: number): Promise<ApiProjectStats> => {
        return api.get(`${KANBAN_URL}/stats/${projectId}`);
    },
};

// Типы для React Query
export type KanbanApiFnReturnType<T extends (...args: unknown[]) => Promise<unknown>> = Awaited<
    ReturnType<T>
>;

export type KanbanQueryConfig<T extends (...args: unknown[]) => unknown> = Omit<
    ReturnType<T>,
    "queryKey" | "queryFn"
>;
