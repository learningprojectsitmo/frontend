import { useParams } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { KanbanBoard } from "@/features/kanban/components/board";
import { TaskPanel, type TaskPatch } from "@/features/kanban/components/task-panel";
import { KanbanFilter } from "@/features/kanban/components/board-filter";
import {
    useBoard,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    useMoveTask,
    useCreateColumn,
    useUpdateColumn,
    useDeleteColumn,
    useReorderColumns,
    useCreateSubtask,
    useUpdateSubtask,
    useDeleteSubtask,
} from "@/features/kanban/hooks/useKanban";
import { useTaskPanel } from "@/features/kanban/hooks/useTaskPanel";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
// Todo поменять хук
import { useUsers } from "@/features/kanban/hooks/useUsers";
import { useUser } from "@/lib/auth";
import {
    defaultFilterState,
    filterColumns,
    type KanbanFilterState,
} from "@/features/kanban/utils/filter-tasks";

export const KanbanRoute = () => {
    const { spaceId } = useParams<{ spaceId: string }>();
    const projectId = parseInt(spaceId || "0");

    // Состояния
    const [filter, setFilter] = useState<KanbanFilterState>(defaultFilterState);
    const { isOpen, editingTask, openEditPanel, closePanel } = useTaskPanel();

    // Данные
    const { data: columns, isLoading, error, refetch } = useBoard(projectId);
    const { data: projectMembers } = useUsers();
    const { data: currentUser } = useUser();

    // Отфильтрованные колонки
    const filteredColumns = useMemo(
        () => filterColumns(columns || [], filter, currentUser?.id),
        [columns, filter, currentUser?.id],
    );

    // Актуальный editingTask
    const liveEditingTask = useMemo(() => {
        if (!editingTask || !columns) return editingTask;
        for (const col of columns) {
            const found = col.tasks?.find((t) => t.id === editingTask.id);
            if (found) return found;
        }
        return editingTask;
    }, [editingTask, columns]);

    // Мутации
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const moveTask = useMoveTask();
    const createColumn = useCreateColumn();
    const updateColumn = useUpdateColumn();
    const deleteColumn = useDeleteColumn();
    const reorderColumns = useReorderColumns(projectId);
    const createSubtask = useCreateSubtask();
    const updateSubtask = useUpdateSubtask();
    const deleteSubtask = useDeleteSubtask();

    // Автосейв задачи
    const handleTaskAutoSave = useCallback(
        async (taskId: number, patch: TaskPatch) => {
            // Преобразуем dueDate: null означает сброс даты
            const data: Record<string, unknown> = { ...patch };
            if (patch.dueDate === null) {
                data.dueDate = undefined; // бэкенд интерпретирует undefined как сброс
            }
            try {
                await updateTask.mutateAsync({ taskId, data: data as Parameters<typeof updateTask.mutateAsync>[0]["data"] });
            } catch (e) {
                toast.error("Не удалось сохранить изменения");
                throw e;
            }
        },
        [updateTask],
    );

    // Подзадачи — отдельные мутации, дёргаются прямо из TaskPanel
    const handleSubtaskCreate = useCallback(
        async (taskId: number, title: string) => {
            try {
                await createSubtask.mutateAsync({ taskId, title, isCompleted: false });
            } catch (e) {
                toast.error("Не удалось добавить подзадачу");
                throw e;
            }
        },
        [createSubtask],
    );
    const handleSubtaskUpdate = useCallback(
        async (subtaskId: number, data: { title?: string; isCompleted?: boolean }) => {
            try {
                await updateSubtask.mutateAsync({ subtaskId, data });
            } catch (e) {
                toast.error("Не удалось обновить подзадачу");
                throw e;
            }
        },
        [updateSubtask],
    );
    const handleSubtaskDelete = useCallback(
        async (subtaskId: number) => {
            try {
                await deleteSubtask.mutateAsync(subtaskId);
            } catch (e) {
                toast.error("Не удалось удалить подзадачу");
                throw e;
            }
        },
        [deleteSubtask],
    );

    // Перемещение задачи между колонками из TaskPanel
    const handleTaskMoveToColumn = useCallback(
        async (taskId: number, targetColumnId: number) => {
            const targetCol = columns?.find((c) => c.id === targetColumnId);
            // В конец колонки: max(position) + 1, либо 0 если колонка пуста
            const targetPosition =
                targetCol && targetCol.tasks && targetCol.tasks.length > 0
                    ? Math.max(...targetCol.tasks.map((t) => t.position)) + 1
                    : 0;
            try {
                await moveTask.mutateAsync({
                    taskId,
                    data: { columnId: targetColumnId, position: targetPosition },
                });
            } catch (e) {
                toast.error("Не удалось переместить задачу");
                throw e;
            }
        },
        [columns, moveTask],
    );

    const handleDeleteTask = useCallback(
        (taskId: number) => {
            deleteTask.mutate(taskId, {
                onSuccess: () => {
                    toast.success("Задача удалена");
                    refetch();
                },
                onError: () => {
                    toast.error("Ошибка при удалении задачи");
                },
            });
        },
        [deleteTask, refetch],
    );

    const handleCreateColumn = useCallback(
        (data: { name: string; color: string; wipLimit?: number }) => {
            createColumn.mutate(
                {
                    projectId,
                    name: data.name,
                    color: data.color,
                    wipLimit: data.wipLimit,
                },
                {
                    onSuccess: () => {
                        toast.success("Колонка успешно создана");
                        refetch();
                    },
                    onError: () => {
                        toast.error("Ошибка при создании колонки");
                    },
                },
            );
        },
        [projectId, createColumn, refetch],
    );

    const handleRenameColumn = useCallback(
        (columnId: number, newName: string) => {
            updateColumn.mutate(
                {
                    columnId,
                    data: { name: newName },
                },
                {
                    onSuccess: () => {
                        toast.success("Колонка переименована");
                        refetch();
                    },
                    onError: () => {
                        toast.error("Ошибка при переименовании колонки");
                    },
                },
            );
        },
        [updateColumn, refetch],
    );

    // Изменение цвета колонки
    const handleChangeColor = useCallback(
        (columnId: number, color: string) => {
            updateColumn.mutate(
                {
                    columnId,
                    data: { color },
                },
                {
                    onSuccess: () => {
                        toast.success("Цвет колонки изменен");
                        refetch();
                    },
                    onError: () => {
                        toast.error("Ошибка при изменении цвета колонки");
                    },
                },
            );
        },
        [updateColumn, refetch],
    );

    // Удаление колонки
    const handleDeleteColumn = useCallback(
        (columnId: number) => {
            deleteColumn.mutate(columnId, {
                onSuccess: () => {
                    toast.success("Колонка удалена");
                    refetch();
                },
                onError: () => {
                    toast.error("Ошибка при удалении колонки");
                },
            });
        },
        [deleteColumn, refetch],
    );

    const handleTaskMove = useCallback(
        (taskId: number, targetColumnId: number, targetPosition: number) => {
            moveTask.mutate(
                {
                    taskId,
                    data: {
                        columnId: targetColumnId,
                        position: targetPosition,
                    },
                },
                {
                    onError: () => {
                        toast.error("Ошибка при перемещении задачи");
                        refetch();
                    },
                },
            );
        },
        [moveTask, refetch],
    );

    // Обработчик переупорядочивания колонок
    const handleReorderColumns = useCallback(
        (columnOrders: { id: number; position: number }[]) => {
            reorderColumns.mutate(columnOrders, {
                onError: () => {
                    toast.error("Ошибка при изменении порядка колонок");
                    refetch();
                },
            });
        },
        [reorderColumns, refetch],
    );

    // Создание задачи
    const handleAddTask = useCallback(
        (columnId: number, title: string) => {
            createTask.mutate(
                { title, columnId, priority: "default" },
                {
                    onSuccess: () => refetch(),
                    onError: () => toast.error("Ошибка при создании задачи"),
                },
            );
        },
        [createTask, refetch],
    );

    // Мемоизация данных для KanbanBoard
    const boardData = useMemo(
        () => ({
            columns: filteredColumns,
            isLoading,
            onTaskMove: handleTaskMove,
            onTaskClick: openEditPanel,
            onAddTask: handleAddTask,
            onDeleteTask: handleDeleteTask,
            onRenameColumn: handleRenameColumn,
            onChangeColor: handleChangeColor,
            onDeleteColumn: handleDeleteColumn,
            onReorderColumns: handleReorderColumns,
            onCreateColumn: (name: string) => handleCreateColumn({ name, color: "white" }),
        }),
        [
            filteredColumns,
            isLoading,
            handleTaskMove,
            openEditPanel,
            handleAddTask,
            handleDeleteTask,
            handleRenameColumn,
            handleChangeColor,
            handleDeleteColumn,
            handleReorderColumns,
            handleCreateColumn,
        ],
    );

    // Обработка ошибок загрузки
    if (error) {
        return (
            <ContentLayout title="Канбан-доска">
                <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <p className="text-lg font-medium text-red-600">Ошибка загрузки доски</p>
                    <p className="text-sm text-gray-500">
                        {error.message || "Попробуйте обновить страницу"}
                    </p>
                    <Button onClick={() => refetch()} variant="outline">
                        Попробовать снова
                    </Button>
                </div>
            </ContentLayout>
        );
    }

    // Скелетон загрузки
    if (isLoading) {
        return (
            <ContentLayout title="Канбан-доска">
                <div className="mx-auto max-w-7xl p-6">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                            <div>
                                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                                <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>
                        <div className="h-9 w-32 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex min-w-min gap-x-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="w-64 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-2"
                                >
                                    <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
                                    <div className="space-y-2">
                                        <div className="h-24 animate-pulse rounded bg-gray-100" />
                                        <div className="h-24 animate-pulse rounded bg-gray-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ContentLayout>
        );
    }

    const spaceName = "Канбан-доска";
    const hasColumns = columns && columns.length > 0;

    return (
    <ContentLayout title={spaceName}>
        {/* Header Section */}
        <div className="mx-auto max-w-7xl p-6">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{spaceName}</h1>
                    <p className="text-sm text-gray-500">
                        {hasColumns
                            ? `Всего колонок: ${columns.length}`
                            : "Начните с создания первой колонки"}
                    </p>
                </div>
                {hasColumns && (
                    <KanbanFilter
                        columns={columns}
                        filter={filter}
                        onFilterChange={setFilter}
                        currentUserId={currentUser?.id}
                    />
                )}
            </header>
        </div>
        {/* Область канбан-доски без лишних отступов снизу */}
        {/* TODO: заменить pb-20 на нормальное значение, чтобы фон занимал все оставщееся пространство*/}
        <div className="min-h-full bg-[hsl(216,22%,95%)] bg-[radial-gradient(#e5e7eb_2px,transparent_1px)] [background-size:16px_16px]">
            <div className="mx-auto max-w-7xl p-6 pb-20 overflow-x-auto">
                <section aria-label="Канбан-доска с задачами">
                    <div className="min-w-min">
                        <KanbanBoard {...boardData} />
                    </div>
                </section>

                {/* Task Panel */}
                <TaskPanel
                    isOpen={isOpen}
                    onClose={closePanel}
                    onAutoSave={handleTaskAutoSave}
                    onMoveToColumn={handleTaskMoveToColumn}
                    onDelete={handleDeleteTask}
                    onSubtaskCreate={handleSubtaskCreate}
                    onSubtaskUpdate={handleSubtaskUpdate}
                    onSubtaskDelete={handleSubtaskDelete}
                    task={liveEditingTask}
                    columns={columns || []}
                    projectName="Канбан-доска"
                    projectMembers={projectMembers || []}
                />
            </div>
        </div>
    </ContentLayout>
);
};

export default KanbanRoute;
