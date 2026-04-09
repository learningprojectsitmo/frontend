import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SubtaskList } from "./subtask-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import type { Task, ProjectMember } from "@/types/tables/forTables";

const taskSchema = z.object({
    title: z.string().min(1, "Название обязательно").max(200, "Слишком длинное название"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("low"),
    assigneeIds: z.array(z.number()).optional().default([]),
    dueDate: z.string().optional(),
    tags: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema> & {
    subtasks?: Array<{
        id?: number;
        title: string;
        isCompleted: boolean;
        position: number;
        taskId?: number;
        _tempId?: string;
    }>;
};

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData, columnId: number) => void;
    task?: Task;
    columnId: number;
    projectId?: number;
    projectMembers?: ProjectMember[];
    isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    task,
    columnId,
    projectMembers = [],
    isLoading = false,
}) => {
    const [subtasks, setSubtasks] = React.useState<
        Array<{
            id?: number;
            title: string;
            isCompleted: boolean;
            position: number;
            taskId?: number;
            _tempId: string;
        }>
    >([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: task?.title || "",
            description: task?.description || "",
            priority: task?.priority || "low",
            assigneeIds: task?.assignees?.map((a) => a.id) || [],
            dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
            tags: task?.tags || "",
        },
    });

    const selectedAssigneeIds = watch("assigneeIds");

    // Получаем выбранных ответственных для отображения
    const selectedAssignees = React.useMemo(() => {
        const ids = selectedAssigneeIds ?? [];
        return projectMembers.filter((member) => ids.includes(member.id));
    }, [selectedAssigneeIds, projectMembers]);

    // Сброс формы при открытии/закрытии
    React.useEffect(() => {
        if (isOpen) {
            if (task) {
                reset({
                    title: task.title,
                    description: task.description || "",
                    priority: task.priority || "low",
                    assigneeIds: task.assignees?.map((a) => a.id) || [],
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                    tags: task.tags || "",
                });

                // Загружаем существующие подзадачи с _tempId
                if (task.subtasks && task.subtasks.length > 0) {
                    const formattedSubtasks = task.subtasks.map((subtask) => ({
                        id: subtask.id,
                        title: subtask.title,
                        isCompleted: subtask.isCompleted,
                        position: subtask.position,
                        taskId: subtask.taskId,
                        _tempId: `existing_${subtask.id}`,
                    }));
                    setSubtasks(formattedSubtasks);
                } else {
                    setSubtasks([]);
                }
            } else {
                reset({
                    title: "",
                    description: "",
                    priority: "low",
                    assigneeIds: [],
                    dueDate: "",
                    tags: "",
                });
                setSubtasks([]);
            }
        }
    }, [isOpen, task, reset]);

    const handleFormSubmit = (data: TaskFormData) => {
        onSubmit({ ...data, subtasks }, columnId);
    };

    const handleAddSubtask = (title: string) => {
        const newSubtask = {
            title,
            isCompleted: false,
            position: subtasks.length,
            taskId: task?.id || 0,
            _tempId: `new_${Date.now()}_${Math.random()}`,
        };
        setSubtasks([...subtasks, newSubtask]);
    };

    const handleUpdateSubtask = (
        index: number,
        updatedSubtask: Partial<{
            title: string;
            isCompleted: boolean;
        }>,
    ) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index] = { ...newSubtasks[index], ...updatedSubtask };
        setSubtasks(newSubtasks);
    };

    const handleDeleteSubtask = (index: number) => {
        setSubtasks((prev) => prev.filter((_, i) => i !== index));
    };

    // Добавление ответственного
    const handleAddAssignee = (memberId: string) => {
        const id = parseInt(memberId);
        const currentIds = selectedAssigneeIds ?? [];
        if (!currentIds.includes(id)) {
            setValue("assigneeIds", [...currentIds, id]);
        }
    };

    // Удаление ответственного
    const handleRemoveAssignee = (memberId: number) => {
        const currentIds = selectedAssigneeIds ?? [];
        setValue(
            "assigneeIds",
            currentIds.filter((id) => id !== memberId),
        );
    };

    // Получение инициалов
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Редактировать задачу" : "Создать задачу"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Название */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Название <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            {...register("title")}
                            placeholder="Введите название задачи"
                            error={!!errors.title}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Описание */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Описание</Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="Введите описание задачи"
                            rows={4}
                        />
                    </div>

                    {/* Приоритет */}
                    <div className="space-y-2">
                        <Label htmlFor="priority">
                            Приоритет <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={watch("priority") || "low"}
                            onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                                setValue("priority", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Низкий (по умолчанию)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Низкий (по умолчанию)</SelectItem>
                                <SelectItem value="medium">Средний</SelectItem>
                                <SelectItem value="high">Высокий</SelectItem>
                                <SelectItem value="urgent">Срочный</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ответственные */}
                    <div className="space-y-2">
                        <Label>Ответственные</Label>

                        {/* Список выбранных ответственных */}
                        {selectedAssignees.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedAssignees.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-1 bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-sm"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs">
                                            {getInitials(member.firstName, member.lastName)}
                                        </div>
                                        <span>
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAssignee(member.id)}
                                            className="ml-1 hover:text-blue-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Выбор нового ответственного */}
                        <Select onValueChange={handleAddAssignee} value="">
                            <SelectTrigger>
                                <SelectValue placeholder="Добавить ответственного" />
                            </SelectTrigger>
                            <SelectContent>
                                {projectMembers
                                    .filter(
                                        (member) =>
                                            !(selectedAssigneeIds ?? []).includes(member.id),
                                    )
                                    .map((member) => (
                                        <SelectItem key={member.id} value={member.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                                    {getInitials(member.firstName, member.lastName)}
                                                </div>
                                                {member.firstName} {member.lastName}
                                            </div>
                                        </SelectItem>
                                    ))}
                                {projectMembers.length === 0 && (
                                    <div className="px-2 py-1.5 text-sm text-gray-500">
                                        Нет участников команды
                                    </div>
                                )}
                            </SelectContent>
                        </Select>

                        <p className="text-xs text-gray-500">
                            Выберите одного или нескольких ответственных за задачу
                        </p>
                    </div>

                    {/* Дедлайн */}
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Дедлайн</Label>
                        <Input id="dueDate" type="date" {...register("dueDate")} />
                    </div>

                    {/* Теги */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Теги (через запятую)</Label>
                        <Input
                            id="tags"
                            {...register("tags")}
                            placeholder="Например: frontend, bug, срочно"
                        />
                        <p className="text-xs text-gray-500">Введите теги через запятую</p>
                    </div>

                    {/* Подзадачи */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <SubtaskList
                            taskId={task?.id}
                            subtasks={subtasks}
                            onAddSubtask={handleAddSubtask}
                            onUpdateSubtask={handleUpdateSubtask}
                            onDeleteSubtask={handleDeleteSubtask}
                        />
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="hug36" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button type="submit" variant="blue" size="hug36" disabled={isLoading}>
                            {isLoading ? "Сохранение..." : task ? "Сохранить" : "Создать"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
