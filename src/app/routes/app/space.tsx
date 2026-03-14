import { useParams } from 'react-router';
import { ContentLayout } from "@/components/layouts";
import { KanbanBoard } from '@/features/kanban/components/kanban-board';
import { TaskModal } from '@/features/kanban/components/task-modal';
import { useColumnsWithTasks, useUpdateTaskStatus, useCreateTask, useUpdateTask } from '@/features/kanban/hooks/useTasks';
import { useTaskModal } from '@/features/kanban/hooks/useTaskModal';
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from 'react-router';
import { paths } from '@/config/paths';

export const SpaceRoute = () => {
    const { spaceId } = useParams<{ spaceId: string }>();
    const projectId = parseInt(spaceId || '0');
    
    const { data: columns, isLoading } = useColumnsWithTasks(projectId);
    const updateStatus = useUpdateTaskStatus();
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    
    const { isOpen, editingTask, openCreateModal, openEditModal, closeModal } = useTaskModal();

    // Здесь потом получим информацию о пространстве
    const spaceName = "Название пространства"; // TODO: получить из API

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
        <ContentLayout title={spaceName}>
            <div className="mx-auto max-w-7xl p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            to={paths.app.spaces.getHref()}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{spaceName}</h1>
                            <p className="text-sm text-gray-500">Канбан доска для управления задачами</p>
                        </div>
                    </div>
                    <Button variant="blue" size="hug36" onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Создать задачу
                    </Button>
                </div>

                {/* Kanban Board */}
                <KanbanBoard
                    projectId={projectId}
                    columns={columns || []}
                    isLoading={isLoading}
                    onTaskDrop={handleTaskDrop}
                    onTaskClick={openEditModal}
                />

                {/* Task Modal */}
                <TaskModal
                    isOpen={isOpen}
                    onClose={closeModal}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    task={editingTask}
                    projectId={projectId}
                    teamMembers={[]} // TODO: получить участников проекта
                    isLoading={createTask.isPending || updateTask.isPending}
                />
            </div>
        </ContentLayout>
    );
};

export default SpaceRoute;