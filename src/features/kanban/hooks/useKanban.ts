import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kanbanApi } from "@/lib/api-kanban";
import camelcaseKeys from "camelcase-keys";
import type {
    CreateColumnDto,
    UpdateColumnDto,
    ColumnWithTasksAndSubtasks,
    CreateTaskDto,
    UpdateTaskDto,
    MoveTaskDto,
    TaskFilters,
    CreateSubtaskDto,
    UpdateSubtaskDto,
    SubtaskListResponse,
    ColumnWithTasks,
    Task,
} from "@/types/tables/forTables";
import type {
    ApiBoard,
    ApiTask,
    ApiSubtask,
    ApiSubtaskListResponse,
    ApiTaskHistory,
    ApiProjectStats,
} from "@/types/api";

// ===== Ключи для кэширования =====
export const kanbanKeys = {
    all: ["kanban"] as const,
    boards: () => [...kanbanKeys.all, "board"] as const,
    board: (projectId: number) => [...kanbanKeys.boards(), projectId] as const,
    tasks: () => [...kanbanKeys.all, "task"] as const,
    task: (taskId: number) => [...kanbanKeys.tasks(), taskId] as const,
    columns: () => [...kanbanKeys.all, "column"] as const,
    columnsByProject: (projectId: number) => [...kanbanKeys.columns(), projectId] as const,
    history: (taskId: number) => [...kanbanKeys.all, "history", taskId] as const,
    stats: (projectId: number) => [...kanbanKeys.all, "stats", projectId] as const,
};

// ─────────────────────────────────────────────────────────────
// Утилиты оптимистичных обновлений board-кэша (snake_case)
// ─────────────────────────────────────────────────────────────

import type { QueryClient } from "@tanstack/react-query";
import type { ApiTaskWithSubtasks } from "@/types/api";

type TaskCachePatch = Partial<{
    title: string;
    description: string | null;
    priority: ApiTaskWithSubtasks["priority"];
    due_date: string | null;
    tags: string | null;
    column_id: number;
}>;

/** Оптимистично применить патч к задаче во ВСЕХ кэшах ApiBoard. Возвращает snapshot для отката */
const patchTaskInBoards = (qc: QueryClient, taskId: number, patch: TaskCachePatch): ApiBoard[] => {
    const snapshots: ApiBoard[] = [];
    qc.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
        if (!old) return old;
        snapshots.push(old);
        return {
            ...old,
            columns: old.columns.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) =>
                    t.id === taskId ? ({ ...t, ...patch } as ApiTaskWithSubtasks) : t,
                ),
            })),
        };
    });
    return snapshots;
};

/** Переместить задачу в другую колонку оптимистично (для column_id-патчей) */
const moveTaskInBoards = (qc: QueryClient, taskId: number, newColumnId: number): ApiBoard[] => {
    const snapshots: ApiBoard[] = [];
    qc.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
        if (!old) return old;
        snapshots.push(old);
        let movingTask: ApiTaskWithSubtasks | undefined;
        const columnsWithoutTask = old.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => {
                if (t.id === taskId) {
                    movingTask = t;
                    return false;
                }
                return true;
            }),
        }));
        if (!movingTask) return old;
        const movedTask: ApiTaskWithSubtasks = { ...movingTask, column_id: newColumnId };
        return {
            ...old,
            columns: columnsWithoutTask.map((col) =>
                col.id === newColumnId ? { ...col, tasks: [...col.tasks, movedTask] } : col,
            ),
        };
    });
    return snapshots;
};

const restoreBoardSnapshots = (qc: QueryClient, snapshots: ApiBoard[]) => {
    snapshots.forEach((snap) => {
        qc.setQueryData(kanbanKeys.board(snap.project_id), snap);
    });
};

/** Применить операцию над subtasks конкретной задачи во всех board-кэшах */
const updateTaskSubtasks = (
    qc: QueryClient,
    taskId: number,
    updater: (subtasks: ApiSubtask[]) => ApiSubtask[],
): ApiBoard[] => {
    const snapshots: ApiBoard[] = [];
    qc.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
        if (!old) return old;
        snapshots.push(old);
        return {
            ...old,
            columns: old.columns.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) => {
                    if (t.id !== taskId) return t;
                    const newSubtasks = updater(t.subtasks ?? []);
                    return { ...t, subtasks: newSubtasks, subtask_count: newSubtasks.length };
                }),
            })),
        };
    });
    return snapshots;
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
                queryKey: kanbanKeys.columnsByProject(variables.projectId),
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.board(variables.projectId),
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
                queryKey: kanbanKeys.columns(),
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards(),
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
                queryKey: kanbanKeys.columns(),
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards(),
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
                queryKey: kanbanKeys.board(projectId),
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
                    queryKey: kanbanKeys.boards(),
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
        // Оптимистично патчим board-кэш сразу — это убирает лишний GET /board после каждого автосейва
        onMutate: async ({ taskId, data }) => {
            await queryClient.cancelQueries({ queryKey: kanbanKeys.boards() });

            // Преобразуем "безопасные" поля camelCase → snake_case.
            // assigneeIds / tags-as-array не трогаем оптимистично — они требуют
            // дополнительной информации о пользователях и сложного маппинга;
            // их обновим из ответа сервера в onSuccess.
            const patch: TaskCachePatch = {};
            const dto = data as UpdateTaskDto & {
                title?: string;
                description?: string | null;
                priority?: ApiTaskWithSubtasks["priority"];
                dueDate?: string | null;
                columnId?: number;
            };
            if (dto.title !== undefined) patch.title = dto.title;
            if (dto.description !== undefined) patch.description = dto.description ?? null;
            if (dto.priority !== undefined) patch.priority = dto.priority;
            if (dto.dueDate !== undefined) patch.due_date = dto.dueDate ?? null;

            let snapshots: ApiBoard[] = [];
            // Если меняется колонка — переносим задачу
            if (dto.columnId !== undefined) {
                snapshots = moveTaskInBoards(queryClient, taskId, dto.columnId);
            }
            if (Object.keys(patch).length > 0) {
                const more = patchTaskInBoards(queryClient, taskId, patch);
                if (snapshots.length === 0) snapshots = more;
            }

            return { snapshots };
        },
        onError: (_err, _vars, context) => {
            if (context?.snapshots) {
                restoreBoardSnapshots(queryClient, context.snapshots);
            }
        },
        onSuccess: (updatedTask, variables) => {
            const converted = camelcaseKeys(updatedTask, { deep: true });
            // Кэш отдельной задачи (если кто-то его читает)
            queryClient.setQueryData(kanbanKeys.task(variables.taskId), converted);

            // Точечно применяем серверные значения assignees / tags / прочих
            // сложных полей в board-кэш — без полного рефетча.
            queryClient.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    columns: old.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) =>
                            t.id === variables.taskId
                                ? ({ ...t, ...updatedTask, subtasks: t.subtasks } as ApiTaskWithSubtasks)
                                : t,
                        ),
                    })),
                };
            });
        },
    });
};

export const useDeleteTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskId: number) => kanbanApi.deleteTask(taskId),
        onSuccess: (_, taskId) => {
            queryClient.removeQueries({
                queryKey: kanbanKeys.task(taskId),
            });
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards(),
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
                queryKey: kanbanKeys.boards(),
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
                queryClient.setQueryData(kanbanKeys.task(variables.taskId), context.previousTask);
            }
        },
    });
};

export const useReorderTasksInColumn = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            columnId,
            taskOrders,
        }: {
            columnId: number;
            taskOrders: { id: number; position: number }[];
        }) => kanbanApi.reorderTasksInColumn(columnId, taskOrders),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: kanbanKeys.boards(),
            });
        },
    });
};

// ========== ХУКИ ДЛЯ ПОДЗАДАЧ ==========

export const useSubtasks = (taskId: number) => {
    return useQuery({
        queryKey: [...kanbanKeys.tasks(), "subtasks", taskId],
        queryFn: () => kanbanApi.getSubtasksByTask(taskId),
        enabled: !!taskId,
        select: (data: ApiSubtaskListResponse): SubtaskListResponse["items"] => {
            const converted = camelcaseKeys(data, { deep: true });
            return converted.items;
        },
    });
};

export const useSubtask = (subtaskId: number) => {
    return useQuery({
        queryKey: [...kanbanKeys.all, "subtask", subtaskId],
        queryFn: () => kanbanApi.getSubtaskById(subtaskId),
        enabled: !!subtaskId,
        select: (data: ApiSubtask) => camelcaseKeys(data, { deep: true }),
    });
};

export const useCreateSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSubtaskDto) => kanbanApi.createSubtask(data),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: kanbanKeys.boards() });
            const tempId = -Date.now(); // временный отрицательный id, чтобы не пересечься с реальными
            const tempSubtask: ApiSubtask = {
                id: tempId,
                task_id: variables.taskId,
                title: variables.title,
                is_completed: variables.isCompleted ?? false,
                position: 9999,
                created_by_id: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const snapshots = updateTaskSubtasks(queryClient, variables.taskId, (subs) => [
                ...subs,
                tempSubtask,
            ]);
            return { snapshots, tempId };
        },
        onError: (_err, _vars, context) => {
            if (context?.snapshots) restoreBoardSnapshots(queryClient, context.snapshots);
        },
        onSuccess: (created, variables, context) => {
            const realSubtask = created as ApiSubtask;
            // Заменяем временную подзадачу на реальную из ответа сервера
            queryClient.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    columns: old.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) => {
                            if (t.id !== variables.taskId) return t;
                            const subs = (t.subtasks ?? []).map((s) =>
                                s.id === context?.tempId ? realSubtask : s,
                            );
                            return { ...t, subtasks: subs, subtask_count: subs.length };
                        }),
                    })),
                };
            });
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), "subtasks", variables.taskId],
            });
        },
    });
};

export const useUpdateSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ subtaskId, data }: { subtaskId: number; data: UpdateSubtaskDto }) =>
            kanbanApi.updateSubtask(subtaskId, data),
        onMutate: async ({ subtaskId, data }) => {
            await queryClient.cancelQueries({ queryKey: kanbanKeys.boards() });
            // Найдём задачу, которой принадлежит подзадача, и обновим её
            const snapshots: ApiBoard[] = [];
            queryClient.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
                if (!old) return old;
                snapshots.push(old);
                return {
                    ...old,
                    columns: old.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) => {
                            if (!t.subtasks?.some((s) => s.id === subtaskId)) return t;
                            return {
                                ...t,
                                subtasks: t.subtasks.map((s) =>
                                    s.id === subtaskId
                                        ? {
                                              ...s,
                                              ...(data.title !== undefined ? { title: data.title } : {}),
                                              ...(data.isCompleted !== undefined
                                                  ? { is_completed: data.isCompleted }
                                                  : {}),
                                          }
                                        : s,
                                ),
                            };
                        }),
                    })),
                };
            });
            return { snapshots };
        },
        onError: (_err, _vars, context) => {
            if (context?.snapshots) restoreBoardSnapshots(queryClient, context.snapshots);
        },
        onSuccess: (updatedSubtask) => {
            const real = updatedSubtask as ApiSubtask;
            // Применяем серверный ответ точечно
            queryClient.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    columns: old.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) => {
                            if (!t.subtasks?.some((s) => s.id === real.id)) return t;
                            return {
                                ...t,
                                subtasks: t.subtasks.map((s) => (s.id === real.id ? real : s)),
                            };
                        }),
                    })),
                };
            });
        },
    });
};

export const useDeleteSubtask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (subtaskId: number) => kanbanApi.deleteSubtask(subtaskId),
        onMutate: async (subtaskId) => {
            await queryClient.cancelQueries({ queryKey: kanbanKeys.boards() });
            const snapshots: ApiBoard[] = [];
            queryClient.setQueriesData<ApiBoard>({ queryKey: kanbanKeys.boards() }, (old) => {
                if (!old) return old;
                snapshots.push(old);
                return {
                    ...old,
                    columns: old.columns.map((col) => ({
                        ...col,
                        tasks: col.tasks.map((t) => {
                            if (!t.subtasks?.some((s) => s.id === subtaskId)) return t;
                            const subs = t.subtasks.filter((s) => s.id !== subtaskId);
                            return { ...t, subtasks: subs, subtask_count: subs.length };
                        }),
                    })),
                };
            });
            return { snapshots };
        },
        onError: (_err, _vars, context) => {
            if (context?.snapshots) restoreBoardSnapshots(queryClient, context.snapshots);
        },
        // onSuccess: ничего — оптимистичное обновление уже корректно
    });
};

export const useReorderSubtasks = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            taskId,
            subtaskOrders,
        }: {
            taskId: number;
            subtaskOrders: { id: number; position: number }[];
        }) => kanbanApi.reorderSubtasks(taskId, subtaskOrders),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [...kanbanKeys.tasks(), "subtasks", variables.taskId],
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
                queryKey: [...kanbanKeys.tasks(), "subtasks", converted.taskId],
            });
        },
    });
};

// ========== ХУКИ ДЛЯ ФИЛЬТРАЦИИ ==========

export const useFilterTasks = (
    projectId: number,
    filters?: TaskFilters,
    page: number = 1,
    pageSize: number = 50,
) => {
    return useQuery({
        queryKey: [...kanbanKeys.tasks(), "filter", projectId, filters, page, pageSize],
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
