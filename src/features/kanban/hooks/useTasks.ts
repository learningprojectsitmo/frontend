import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api-tasks';
import type { 
    CreateTaskDto, 
    UpdateTaskDto, 
    UpdateTaskStatusDto,
    TaskFilters,
    CreateColumnDto,
    UpdateColumnDto 
} from '@/types/kanban';

// ===== Ключи для кэширования =====
export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (projectId: number, filters?: TaskFilters) => 
        [...taskKeys.lists(), projectId, filters] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: number) => [...taskKeys.details(), id] as const,
    columns: (projectId: number) => ['columns', projectId] as const,
    history: (taskId: number) => ['task-history', taskId] as const,
    stats: (projectId: number) => ['task-stats', projectId] as const,
};

// ===== Хуки для задач =====

/**
 * Получить задачи проекта с фильтрацией
 */
export const useProjectTasks = (
    projectId: number,
    filters?: TaskFilters,
    page: number = 1,
    pageSize: number = 50
) => {
    return useQuery({
        queryKey: taskKeys.list(projectId, filters),
        queryFn: () => tasksApi.getProjectTasks(projectId, filters, page, pageSize),
        enabled: !!projectId,
    });
};

/**
 * Получить задачу по ID
 */
export const useTask = (taskId: number) => {
    return useQuery({
        queryKey: taskKeys.detail(taskId),
        queryFn: () => tasksApi.getTaskById(taskId),
        enabled: !!taskId,
    });
};

/**
 * Создать новую задачу
 */
export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskDto) => tasksApi.createTask(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: taskKeys.list(variables.projectId)
            });
            queryClient.invalidateQueries({
                queryKey: taskKeys.columns(variables.projectId)
            });
        },
    });
};

/**
 * Обновить задачу
 */
export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskDto }) =>
            tasksApi.updateTask(taskId, data),
        onSuccess: (updatedTask, variables) => {
            queryClient.setQueryData(
                taskKeys.detail(variables.taskId),
                updatedTask
            );
            queryClient.invalidateQueries({
                queryKey: taskKeys.lists()
            });
        },
    });
};

/**
 * Обновить статус задачи (drag-and-drop)
 */
export const useUpdateTaskStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskStatusDto }) =>
            tasksApi.updateTaskStatus(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: taskKeys.lists()
            });
            queryClient.invalidateQueries({
                queryKey: ['columns']
            });
        },
    });
};

/**
 * Удалить задачу
 */
export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskId: number) => tasksApi.deleteTask(taskId),
        onSuccess: (_, taskId) => {
            queryClient.removeQueries({
                queryKey: taskKeys.detail(taskId)
            });
            queryClient.invalidateQueries({
                queryKey: taskKeys.lists()
            });
        },
    });
};

/**
 * Получить историю задачи
 */
export const useTaskHistory = (taskId: number, limit: number = 50) => {
    return useQuery({
        queryKey: taskKeys.history(taskId),
        queryFn: () => tasksApi.getTaskHistory(taskId, limit),
        enabled: !!taskId,
    });
};

// ===== Хуки для колонок =====

/**
 * Получить колонки проекта
 */
export const useProjectColumns = (projectId: number) => {
    return useQuery({
        queryKey: taskKeys.columns(projectId),
        queryFn: () => tasksApi.getProjectColumns(projectId),
        enabled: !!projectId,
    });
};

/**
 * Получить колонки с задачами (для канбан-доски)
 */
export const useColumnsWithTasks = (projectId: number) => {
    return useQuery({
        queryKey: [...taskKeys.columns(projectId), 'with-tasks'],
        queryFn: () => tasksApi.getColumnsWithTasks(projectId),
        enabled: !!projectId,
    });
};

/**
 * Создать колонку (только магистр/преподаватель)
 */
export const useCreateColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateColumnDto) => tasksApi.createColumn(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: taskKeys.columns(variables.projectId)
            });
        },
    });
};

/**
 * Обновить колонку
 */
export const useUpdateColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ columnId, data }: { columnId: number; data: UpdateColumnDto }) =>
            tasksApi.updateColumn(columnId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['columns']
            });
        },
    });
};

/**
 * Удалить колонку
 */
export const useDeleteColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (columnId: number) => tasksApi.deleteColumn(columnId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['columns']
            });
        },
    });
};

/**
 * Изменить порядок колонок
 */
export const useReorderColumns = (projectId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (columnOrders: { id: number; order: number }[]) =>
            tasksApi.reorderColumns(projectId, columnOrders),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: taskKeys.columns(projectId)
            });
        },
    });
};

// ===== Хуки для статистики =====

/**
 * Получить статистику проекта
 */
export const useProjectStats = (projectId: number) => {
    return useQuery({
        queryKey: taskKeys.stats(projectId),
        queryFn: () => tasksApi.getProjectStats(projectId),
        enabled: !!projectId,
    });
};