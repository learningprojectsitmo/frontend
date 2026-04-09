import { useState, useCallback } from "react";
import type { Task } from "@/types/tables/forTables";

interface UseTaskModalReturn {
    isOpen: boolean;
    editingTask: Task | undefined;
    targetColumnId: number | undefined;
    openCreateModal: (columnId: number) => void;
    openEditModal: (task: Task) => void;
    closeModal: () => void;
}

export const useTaskModal = (): UseTaskModalReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();
    const [targetColumnId, setTargetColumnId] = useState<number | undefined>();

    const openCreateModal = useCallback((columnId: number) => {
        setEditingTask(undefined);
        setTargetColumnId(columnId);
        setIsOpen(true);
    }, []);

    const openEditModal = useCallback((task: Task) => {
        setEditingTask(task);
        setTargetColumnId(task.columnId);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setEditingTask(undefined);
        setTargetColumnId(undefined);
    }, []);

    return {
        isOpen,
        editingTask,
        targetColumnId,
        openCreateModal,
        openEditModal,
        closeModal,
    };
};
