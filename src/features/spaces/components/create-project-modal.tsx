import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form/form";
import { useCreateProject } from "@/lib/projects";
import { toast } from "sonner";

const createProjectSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(100, "Слишком длинное название"),
    description: z.string().max(500, "Максимум 500 символов").optional().or(z.literal("")),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

type CreateProjectModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: number;
};

export const CreateProjectModal = ({
    open,
    onOpenChange,
    workspaceId,
}: CreateProjectModalProps) => {
    const createProject = useCreateProject();

    const form = useForm<CreateProjectInput>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const onSubmit = (values: CreateProjectInput) => {
        createProject.mutate(
            {
                name: values.name,
                description: values.description || undefined,
                workspace_id: workspaceId,
            },
            {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                    toast.success("Проект создан");
                },
                onError: () => {
                    toast.error("Не удалось создать проект");
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Создать проект</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Название проекта *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Введите название проекта"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Описание</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Опишите цель и задачи проекта"
                                            rows={3}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="hug36"
                                onClick={() => onOpenChange(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                variant="dark"
                                size="hug36"
                                disabled={createProject.isPending}
                            >
                                {createProject.isPending ? "Создание..." : "Создать"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
