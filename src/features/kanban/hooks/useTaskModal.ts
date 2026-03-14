import { useState } from 'react';
import type { ApiTask } from '@/types/api';

export const useTaskModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ApiTask | undefined>();

    const openCreateModal = () => {
        setEditingTask(undefined);
        setIsOpen(true);
    };

    const openEditModal = (task: ApiTask) => {
        setEditingTask(task);
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setEditingTask(undefined);
    };

    return {
        isOpen,
        editingTask,
        openCreateModal,
        openEditModal,
        closeModal,
    };
};