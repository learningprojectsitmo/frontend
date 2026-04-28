import { useState, useCallback } from "react";
import type { Task } from "@/types/tables/forTables";

interface UseTaskPanelReturn {
    isOpen: boolean;
    editingTask: Task | undefined;
    targetColumnId: number | undefined;
    openCreatePanel: (columnId: number) => void;
    openEditPanel: (task: Task) => void;
    closePanel: () => void;
}

export const useTaskPanel = (): UseTaskPanelReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();
    const [targetColumnId, setTargetColumnId] = useState<number | undefined>();

    const openCreatePanel = useCallback((columnId: number) => {
        setEditingTask(undefined);
        setTargetColumnId(columnId);
        setIsOpen(true);
    }, []);

    const openEditPanel = useCallback((task: Task) => {
        setEditingTask(task);
        setTargetColumnId(task.columnId);
        setIsOpen(true);
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
        setEditingTask(undefined);
        setTargetColumnId(undefined);
    }, []);

    return {
        isOpen,
        editingTask,
        targetColumnId,
        openCreatePanel,
        openEditPanel,
        closePanel,
    };
};
