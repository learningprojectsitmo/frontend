import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanApi } from '@/lib/api-kanban';
import camelcaseKeys from 'camelcase-keys';
import type { 
    CreateColumnDto, UpdateColumnDto, 
    ColumnWithTasksAndSubtasks,
    CreateTaskDto, UpdateTaskDto, MoveTaskDto, 
    TaskFilters, 
    CreateSubtaskDto, UpdateSubtaskDto,
    SubtaskListResponse,
    ColumnWithTasks,
    Task
} from '@/types/tables/forTables';
import type { ApiBoard, ApiTask, ApiSubtask, ApiSubtaskListResponse, ApiTaskHistory, ApiProjectStats } from '@/types/api';

// ===== Ключи для кэширования =====
export const kanbanKeys = {
    all: ['kanban'] as const,
    boards: () => [...kanbanKeys.all, 'board'] as const,
    board: (projectId: number) => [...kanbanKeys.boards(), projectId] as const,
    tasks: () => [...kanbanKeys.all, 'task'] as const,
    task: (taskId: number) => [...kanbanKeys.tasks(), taskId] as const,
    columns: () => [...kanbanKeys.all, 'column'] as const,
    columnsByProject: (projectId: number) => [...kanbanKeys.columns(), projectId] as const,
    history: (taskId: number) => [...kanbanKeys.all, 'history', taskId] as const,
    stats: (projectId: number) => [...kanbanKeys.all, 'stats', projectId] as const,
};

// ========== ХУКИ ДЛЯ ДОСКИ ==========

export const useBoard = (projectId: number) => {
    return useQuery({
        queryKey: kanbanKeys.board(projectId),
        queryFn: () => kanbanApi.getBoard(projectId),
        enabled: !!projectId,
        select: (data: ApiBoard): ColumnWithTasksAndSubtasks[] => {
            const converted = camelcaseKeys(data, { deep: true });
            return converted.columns.map((column: ColumnWithTasks) => ({
                ...column,
                color: column.color as string,
                tasks: column.tasks.map((task: Task) => ({
                    ...task,
                    subtasks: task.subtasks || [],
                    subtaskCount: task.subtaskCount || 0,
                })),
            }));
        },
    });
};

// ========== ХУКИ ДЛЯ КОЛОНОК ==========

export const useProjectColumns = (projectId: number) => {
    return useQuery({
        queryKey: kanbanKeys.columnsByProject(projectId),
        queryFn: () => kanbanApi.getProjectColumns(projectId),
        enabled: !!projectId,
        select: (data) => camelcaseKeys(data, { deep: true }).items,
    });
};

export const useCreateColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateColumnDto) => kanbanApi.createColumn(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.columnsByProject(variables.projectId)
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.board(variables.projectId)
            });
        },
    });
};

export const useUpdateColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ columnId, data }: { columnId: number; data: UpdateColumnDto }) =>
            kanbanApi.updateColumn(columnId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.columns()
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards()
            });
        },
    });
};

export const useDeleteColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (columnId: number) => kanbanApi.deleteColumn(columnId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.columns()
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards()
            });
        },
    });
};

export const useReorderColumns = (projectId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (columnOrders: { id: number; position: number }[]) =>
            kanbanApi.reorderColumns(projectId, columnOrders),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.board(projectId)
            });
        },
    });
};

// ========== ХУКИ ДЛЯ ЗАДАЧ ==========

export const useTask = (taskId: number) => {
    return useQuery({
        queryKey: kanbanKeys.task(taskId),
        queryFn: () => kanbanApi.getTaskById(taskId),
        enabled: !!taskId,
        select: (data: ApiTask) => camelcaseKeys(data, { deep: true }),
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateTaskDto) => kanbanApi.createTask(data),
        onSuccess: (_, variables) => {
            if (variables.columnId) {
                queryClient.invalidateQueries({
                    queryKey: kanbanKeys.boards()
                });
            }
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: number; data: UpdateTaskDto }) =>
            kanbanApi.updateTask(taskId, data),
        onSuccess: (updatedTask, variables) => {
            const converted = camelcaseKeys(updatedTask, { deep: true });
            
            queryClient.setQueryData(
                kanbanKeys.task(variables.taskId),
                converted
            );
            if (converted.projectId) {
                queryClient.invalidateQueries({
                    queryKey: kanbanKeys.board(converted.projectId)
                });
            }
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskId: number) => kanbanApi.deleteTask(taskId),
        onSuccess: (_, taskId) => {
            queryClient.removeQueries({
                queryKey: kanbanKeys.task(taskId)
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards()
            });
        },
    });
};

export const useMoveTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: number; data: MoveTaskDto }) =>
            kanbanApi.moveTask(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards()
            });
        },
        onMutate: async ({ taskId, data }) => {
            await queryClient.cancelQueries({ queryKey: kanbanKeys.boards() });
            const previousTask = queryClient.getQueryData(kanbanKeys.task(taskId));
            
            queryClient.setQueryData<Task>(kanbanKeys.task(taskId), (old) => {
                if (!old) return undefined;
                
                return {
                    ...old,
                    columnId: data.columnId,
                    position: data.position,
                };
            });
            
            return { previousTask };
        },
        onError: (_err, variables, context) => {
            if (context?.previousTask) {
                queryClient.setQueryData(
                    kanbanKeys.task(variables.taskId),
                    context.previousTask
                );
            }
        },
    });
};

export const useReorderTasksInColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ columnId, taskOrders }: { columnId: number; taskOrders: { id: number; position: number }[] }) =>
            kanbanApi.reorderTasksInColumn(columnId, taskOrders),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards()
            });
        },
    });
};

// ========== ХУКИ ДЛЯ ПОДЗАДАЧ ==========

export const useSubtasks = (taskId: number) => {
    return useQuery({
        queryKey: [...kanbanKeys.tasks(), 'subtasks', taskId],
        queryFn: () => kanbanApi.getSubtasksByTask(taskId),
        enabled: !!taskId,
        select: (data: ApiSubtaskListResponse): SubtaskListResponse['items'] => {
            const converted = camelcaseKeys(data, { deep: true });
            return converted.items;
        },
    });
};

export const useSubtask = (subtaskId: number) => {
    return useQuery({
        queryKey: [...kanbanKeys.all, 'subtask', subtaskId],
        queryFn: () => kanbanApi.getSubtaskById(subtaskId),
        enabled: !!subtaskId,
        select: (data: ApiSubtask) => camelcaseKeys(data, { deep: true }),
    });
};

export const useCreateSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSubtaskDto) => kanbanApi.createSubtask(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), 'subtasks', variables.taskId]
            });
        },
    });
};

export const useUpdateSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ subtaskId, data }: { subtaskId: number; data: UpdateSubtaskDto }) =>
            kanbanApi.updateSubtask(subtaskId, data),
        onSuccess: (updatedSubtask) => {
            const converted = camelcaseKeys(updatedSubtask, { deep: true });
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), 'subtasks', converted.taskId]
            });
        },
    });
};

export const useDeleteSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subtaskId: number) => kanbanApi.deleteSubtask(subtaskId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), 'subtasks']
            });
        },
    });
};

export const useReorderSubtasks = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, subtaskOrders }: { taskId: number; subtaskOrders: { id: number; position: number }[] }) =>
            kanbanApi.reorderSubtasks(taskId, subtaskOrders),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), 'subtasks', variables.taskId]
            });
        },
    });
};

export const useToggleSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subtaskId: number) => kanbanApi.toggleSubtaskCompletion(subtaskId),
        onSuccess: (updatedSubtask) => {
            const converted = camelcaseKeys(updatedSubtask, { deep: true });
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), 'subtasks', converted.taskId]
            });
        },
    });
};

// ========== ХУКИ ДЛЯ ФИЛЬТРАЦИИ ==========

export const useFilterTasks = (
    projectId: number,
    filters?: TaskFilters,
    page: number = 1,
    pageSize: number = 50
) => {
    return useQuery({
        queryKey: [...kanbanKeys.tasks(), 'filter', projectId, filters, page, pageSize],
        queryFn: () => kanbanApi.filterTasks(projectId, filters, page, pageSize),
        enabled: !!projectId,
        select: (data) => camelcaseKeys(data, { deep: true }),
    });
};

// ========== ХУКИ ДЛЯ ИСТОРИИ ==========

export const useTaskHistory = (taskId: number, limit: number = 50) => {
    return useQuery({
        queryKey: kanbanKeys.history(taskId),
        queryFn: () => kanbanApi.getTaskHistory(taskId, limit),
        enabled: !!taskId,
        select: (data: ApiTaskHistory[]) => camelcaseKeys(data, { deep: true }),
    });
};

// ========== ХУКИ ДЛЯ СТАТИСТИКИ ==========

export const useProjectStats = (projectId: number) => {
    return useQuery({
        queryKey: kanbanKeys.stats(projectId),
        queryFn: () => kanbanApi.getProjectStats(projectId),
        enabled: !!projectId,
        select: (data: ApiProjectStats) => camelcaseKeys(data, { deep: true }),
    });
};