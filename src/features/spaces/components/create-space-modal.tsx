import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog } from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form/form";
import { useCreateWorkspace, useSpacesList } from "@/lib/spaces";
import { cn } from "@/lib/utils";

const createSpaceSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(100, "Слишком длинное название"),
    description: z.string().max(500, "Максимум 500 символов").optional().or(z.literal("")),
    category_id: z.number().optional(),
    color: z.string().optional(),
});

type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

const COLOR_OPTIONS = [
    { value: "bg-blue-500", label: "Синий" },
    { value: "bg-green-500", label: "Зелёный" },
    { value: "bg-purple-500", label: "Фиолетовый" },
    { value: "bg-red-500", label: "Красный" },
    { value: "bg-yellow-500", label: "Жёлтый" },
    { value: "bg-pink-500", label: "Розовый" },
];

type CreateSpaceModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const CreateSpaceModal = ({ open, onOpenChange }: CreateSpaceModalProps) => {
    const { data: dataSpaces } = useSpacesList();
    const createWorkspace = useCreateWorkspace();

    const form = useForm<CreateSpaceInput>({
        resolver: zodResolver(createSpaceSchema),
        defaultValues: {
            name: "",
            description: "",
            category_id: undefined,
            color: undefined,
        },
    });

    const onSubmit = (values: CreateSpaceInput) => {
        createWorkspace.mutate(
            {
                name: values.name,
                description: values.description || undefined,
                category_id: values.category_id || undefined,
                color: values.color || undefined,
            },
            {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} title="Создать пространство">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel>Название</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Введите название пространства"
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
                                        placeholder="Опишите цель и задачи пространства"
                                        rows={3}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {dataSpaces?.categories && dataSpaces.categories.length > 0 && (
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Категория</FormLabel>
                                    <FormControl>
                                        <div className="flex flex-wrap gap-2">
                                            {dataSpaces.categories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() =>
                                                        field.onChange(
                                                            field.value === cat.id
                                                                ? undefined
                                                                : cat.id,
                                                        )
                                                    }
                                                    className={cn(
                                                        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                                                        field.value === cat.id
                                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                                                    )}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Цвет</FormLabel>
                                <FormControl>
                                    <div className="flex flex-wrap gap-3">
                                        {COLOR_OPTIONS.map((c) => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() =>
                                                    field.onChange(
                                                        field.value === c.value
                                                            ? undefined
                                                            : c.value,
                                                    )
                                                }
                                                title={c.label}
                                                className={cn(
                                                    "h-8 w-8 rounded-full transition-transform",
                                                    c.value,
                                                    field.value === c.value &&
                                                        "ring-2 ring-blue-500 ring-offset-2 scale-110",
                                                )}
                                            />
                                        ))}
                                    </div>
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
                            disabled={createWorkspace.isPending}
                        >
                            {createWorkspace.isPending ? "Создание..." : "Создать"}
                        </Button>
                    </div>
                </form>
            </Form>
        </Dialog>
    );
};
