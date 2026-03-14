import { useParams } from "react-router";
import { ContentLayout } from "@/components/layouts/content-layout";
import { KanbanBoard } from "@/features/kanban/components/kanban-board";
import { useColumnsWithTasks, useUpdateTaskStatus } from "@/features/kanban/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskModal } from "@/features/kanban/components/task-modal";
import { useTaskModal } from "@/features/kanban/hooks/useTaskModal";
import { useCreateTask, useUpdateTask } from "@/features/kanban/hooks/useTasks";

export const KanbanRoute = () => {
    const { spaceId } = useParams<{ spaceId: string }>();
    const projectId = parseInt(spaceId || '0');
    
    const { data: columns, isLoading } = useColumnsWithTasks(projectId);
    const updateStatus = useUpdateTaskStatus();
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    
    const { isOpen, editingTask, openCreateModal, openEditModal, closeModal } = useTaskModal();

    const handleTaskDrop = (taskId: number, newStatus: string, newOrder: number) => {
        updateStatus.mutate({
            taskId,
            data: {
                status: newStatus as any,
                order: newOrder
            }
        });
    };

    const handleCreateTask = (data: any) => {
        createTask.mutate({
            ...data,
            projectId,
        });
        closeModal();
    };

    const handleUpdateTask = (data: any) => {
        if (editingTask) {
            updateTask.mutate({
                taskId: editingTask.id,
                data,
            });
            closeModal();
        }
    };

    return (
        <ContentLayout title="Канбан доска">
            <div className="mx-auto max-w-7xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Канбан доска</h1>
                    <Button variant="blue" size="hug36" onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Создать задачу
                    </Button>
                </div>

                <KanbanBoard
                    projectId={projectId}
                    columns={columns || []}
                    isLoading={isLoading}
                    onTaskDrop={handleTaskDrop}
                    onTaskClick={openEditModal}
                />

                <TaskModal
                    isOpen={isOpen}
                    onClose={closeModal}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    task={editingTask}
                    projectId={projectId}
                    teamMembers={[]}
                    isLoading={createTask.isPending || updateTask.isPending}
                />
            </div>
        </ContentLayout>
    );
};

export default KanbanRoute;