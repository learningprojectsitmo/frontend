import { useParams } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { KanbanBoard } from "@/features/kanban/components/board";
import { ColumnModal } from "@/features/kanban/components/column-modal";
import { TaskModal } from "@/features/kanban/components/task-modal";
import type { TaskFormData } from "@/features/kanban/components/task-modal";
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
import { useTaskModal } from "@/features/kanban/hooks/useTaskModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [filter, setFilter] = useState<KanbanFilterState>(defaultFilterState);
    const { isOpen, editingTask, targetColumnId, openCreateModal, openEditModal, closeModal } =
        useTaskModal();

    // Данные
    const { data: columns, isLoading, error, refetch } = useBoard(projectId);
    const { data: projectMembers } = useUsers();
    const { data: currentUser } = useUser();

    // Отфильтрованные колонки
    const filteredColumns = useMemo(
        () => filterColumns(columns || [], filter, currentUser?.id),
        [columns, filter, currentUser?.id],
    );

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

    const handleTaskSubmit = useCallback(
        (data: TaskFormData, columnId: number) => {
            const processedData = {
                title: data.title,
                description: data.description,
                priority: data.priority,
                dueDate: data.dueDate && data.dueDate !== "" ? data.dueDate : undefined,
                assigneeIds: data.assigneeIds,
                tags: data.tags
                    ? data.tags
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                    : [],
            };

            const newSubtasks = data.subtasks || [];

            if (editingTask) {
                const oldSubtasks = editingTask.subtasks || [];
                const oldSubtasksMap = new Map(oldSubtasks.map((s) => [s.id, s]));

                const existingNewIds = new Set(newSubtasks.filter((s) => s.id).map((s) => s.id));

                const toDelete = oldSubtasks.filter((s) => !existingNewIds.has(s.id));

                const toUpdate = newSubtasks
                    .filter((s) => s.id)
                    .map((newSub) => {
                        const oldSub = oldSubtasksMap.get(newSub.id!);
                        const hasChanges =
                            oldSub?.title !== newSub.title ||
                            oldSub?.isCompleted !== newSub.isCompleted;
                        return {
                            id: newSub.id!,
                            title: newSub.title,
                            isCompleted: newSub.isCompleted,
                            hasChanges,
                        };
                    })
                    .filter((u) => u.hasChanges);

                const toCreate = newSubtasks.filter((s) => !s.id);

                updateTask.mutate(
                    {
                        taskId: editingTask.id,
                        data: processedData,
                    },
                    {
                        onSuccess: async () => {
                            try {
                                const operations = [];

                                for (const subtask of toDelete) {
                                    operations.push(deleteSubtask.mutateAsync(subtask.id));
                                }

                                for (const subtask of toUpdate) {
                                    operations.push(
                                        updateSubtask.mutateAsync({
                                            subtaskId: subtask.id,
                                            data: {
                                                title: subtask.title,
                                                isCompleted: subtask.isCompleted,
                                            },
                                        }),
                                    );
                                }

                                for (let i = 0; i < toCreate.length; i++) {
                                    operations.push(
                                        createSubtask.mutateAsync({
                                            taskId: editingTask.id,
                                            title: toCreate[i].title,
                                            isCompleted: toCreate[i].isCompleted,
                                        }),
                                    );
                                }

                                await Promise.all(operations);

                                toast.success("Задача успешно обновлена");
                                closeModal();
                                refetch();
                            } catch {
                                // console.error('Error updating subtasks:', error);
                                toast.error("Ошибка при обновлении подзадач");
                                closeModal();
                                refetch();
                            }
                        },
                        onError: () => {
                            toast.error("Ошибка при обновлении задачи");
                        },
                    },
                );
            } else {
                // Создание новой задачи
                createTask.mutate(
                    {
                        ...processedData,
                        columnId: columnId,
                    },
                    {
                        onSuccess: async (newTask) => {
                            try {
                                if (newSubtasks.length > 0) {
                                    await Promise.all(
                                        newSubtasks.map((subtask) =>
                                            createSubtask.mutateAsync({
                                                taskId: newTask.id,
                                                title: subtask.title,
                                                isCompleted: subtask.isCompleted,
                                            }),
                                        ),
                                    );
                                }
                                toast.success("Задача успешно создана");
                                closeModal();
                                refetch();
                            } catch {
                                // console.error('Error creating subtasks:', error);
                                toast.warning("Задача создана, но ошибка при создании подзадач");
                                closeModal();
                                refetch();
                            }
                        },
                        onError: () => {
                            toast.error("Ошибка при создании задачи");
                        },
                    },
                );
            }
        },
        [
            editingTask,
            createTask,
            updateTask,
            createSubtask,
            updateSubtask,
            deleteSubtask,
            closeModal,
            refetch,
        ],
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
                        setIsColumnModalOpen(false);
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

    // Мемоизация данных для KanbanBoard
    const boardData = useMemo(
        () => ({
            columns: filteredColumns,
            isLoading,
            onTaskMove: handleTaskMove,
            onTaskClick: openEditModal,
            onAddTask: openCreateModal,
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
            openEditModal,
            openCreateModal,
            handleDeleteTask,
            handleRenameColumn,
            handleChangeColor,
            handleDeleteColumn,
            handleReorderColumns,
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
            <div className="mx-auto max-w-7xl p-6 overflow-x-auto">
                <section aria-label="Канбан-доска с задачами">
                    <div className="min-w-min">
                        {hasColumns ? (
                            <KanbanBoard {...boardData} />
                        ) : (
                            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                                <p className="mb-4 text-lg font-medium text-gray-500">
                                    Нет колонок
                                </p>
                                <p className="mb-6 text-sm text-gray-400">
                                    Создайте первую колонку, чтобы начать работу
                                </p>
                                <Button
                                    variant="blue"
                                    onClick={() => setIsColumnModalOpen(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Создать колонку
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Task Modal */}
                <TaskModal
                    isOpen={isOpen}
                    onClose={closeModal}
                    onSubmit={handleTaskSubmit}
                    task={editingTask}
                    columnId={targetColumnId || columns?.[0]?.id || 0}
                    projectMembers={projectMembers || []}
                    isLoading={createTask.isPending || updateTask.isPending}
                />

                {/* Column Modal */}
                <ColumnModal
                    isOpen={isColumnModalOpen}
                    onClose={() => setIsColumnModalOpen(false)}
                    onSubmit={handleCreateColumn}
                    projectId={projectId}
                    isLoading={createColumn.isPending}
                />
            </div>
        </div>
    </ContentLayout>
);
};

export default KanbanRoute;
