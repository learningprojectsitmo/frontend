import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ApiTask, ApiUser } from '@/types/api';

const taskSchema = z.object({
    title: z.string().min(1, 'Название обязательно').max(200, 'Слишком длинное название'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    assigneeIds: z.array(z.number()).optional().default([]),
    dueDate: z.string().optional(),
    tags: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => void;
    task?: ApiTask;
    projectId: number;
    teamMembers?: ApiUser[];
    isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    task,
    teamMembers = [],
    isLoading = false,
}) => {
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
            title: task?.title || '',
            description: task?.description || '',
            priority: task?.priority || 'medium',
            assigneeIds: task?.assignees?.map(a => a.id) || [],
            dueDate: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
            tags: task?.tags?.join(', ') || '',
        },
    });

    React.useEffect(() => {
        if (isOpen) {
            if (task) {
                reset({
                    title: task.title,
                    description: task.description || '',
                    priority: task.priority,
                    assigneeIds: task.assignees?.map(a => a.id) || [],
                    dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                    tags: task.tags?.join(', ') || '',
                });
            } else {
                reset({
                    title: '',
                    description: '',
                    priority: 'medium',
                    assigneeIds: [],
                    dueDate: '',
                    tags: '',
                });
            }
        }
    }, [isOpen, task, reset]);

    const selectedAssigneeIds = watch('assigneeIds') || [];

    const handleFormSubmit = (data: TaskFormData) => {
        onSubmit(data);
    };

    const toggleAssignee = (memberId: number) => {
        const newIds = selectedAssigneeIds.includes(memberId)
            ? selectedAssigneeIds.filter(id => id !== memberId)
            : [...selectedAssigneeIds, memberId];
        setValue('assigneeIds', newIds);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {task ? 'Редактировать задачу' : 'Создать задачу'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Название */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Название *</Label>
                        <Input
                            id="title"
                            {...register('title')}
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
                            {...register('description')}
                            placeholder="Введите описание задачи"
                            rows={4}
                        />
                    </div>

                    {/* Приоритет */}
                    <div className="space-y-2">
                        <Label htmlFor="priority">Приоритет</Label>
                        <Select
                            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                                setValue('priority', value)
                            }
                            defaultValue={task?.priority || 'medium'}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите приоритет" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Низкий</SelectItem>
                                <SelectItem value="medium">Средний</SelectItem>
                                <SelectItem value="high">Высокий</SelectItem>
                                <SelectItem value="urgent">Срочный</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ответственные */}
                    {teamMembers.length > 0 && (
                        <div className="space-y-2">
                            <Label>Ответственные</Label>
                            <div className="flex flex-wrap gap-2">
                                {teamMembers.map((member) => (
                                    <Button
                                        key={member.id}
                                        type="button"
                                        variant={selectedAssigneeIds.includes(member.id) ? 'blue' : 'outline'}
                                        size="hug36"
                                        onClick={() => toggleAssignee(member.id)}
                                    >
                                        {member.first_name} {member.last_name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Дедлайн */}
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Дедлайн</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            {...register('dueDate')}
                        />
                    </div>

                    {/* Теги */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Теги (через запятую)</Label>
                        <Input
                            id="tags"
                            {...register('tags')}
                            placeholder="Например: frontend, bug, срочно"
                        />
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            size="hug36"
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            variant="blue"
                            size="hug36"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Сохранение...' : task ? 'Сохранить' : 'Создать'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};