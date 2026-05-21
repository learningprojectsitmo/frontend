import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group/radio-group";
import { DangerZone } from "@/features/spaces/components/danger-zone";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form/form";
import { useUpdateSpaceSettings, useUpdateWorkspaceName, useDeleteWorkspace } from "@/lib/spaces";
import type { Space } from "@/types/api";

const spaceSettingsSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(100, "Слишком длинное название"),
    description: z.string().max(500, "Максимум 500 символов").optional().or(z.literal("")),
    visibility: z.enum(["public", "private"]),
    join_policy: z.enum(["open", "link", "invitation"]),
    default_role_id: z.number().nullable().optional(),
});

type SpaceSettingsInput = z.infer<typeof spaceSettingsSchema>;

interface SpaceSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    space: Space;
}

const visibilityOptions: RadioOption[] = [
    {
        value: "public",
        label: "Публичное пространство",
        description: "доступно всем участникам системы",
    },
    {
        value: "private",
        label: "Приватное пространство",
        description: "доступно только приглашённым",
    },
];

const joinPolicyOptions: RadioOption[] = [
    { value: "open", label: "Открыто для всех" },
    { value: "link", label: "Только по ссылке" },
    { value: "invitation", label: "Только по приглашению" },
];

const defaultRoleOptions: RadioOption[] = [
    { value: "1", label: "Участник" },
    { value: "2", label: "Руководитель" },
    { value: "3", label: "Администратор" },
];

export const SpaceSettingsModal = ({ open, onOpenChange, space }: SpaceSettingsModalProps) => {
    const updateSettings = useUpdateSpaceSettings();
    const updateName = useUpdateWorkspaceName();
    const deleteWorkspace = useDeleteWorkspace();

    const isPending = updateSettings.isPending || updateName.isPending;

    const form = useForm<SpaceSettingsInput>({
        resolver: zodResolver(spaceSettingsSchema),
        defaultValues: {
            name: space.title,
            description: space.description || "",
            visibility: "public",
            join_policy: "open",
            default_role_id: null,
        },
    });

    useEffect(() => {
        form.reset({
            name: space.title,
            description: space.description || "",
            visibility: "public",
            join_policy: "open",
            default_role_id: null,
        });
    }, [space, form]);

    const onSubmit = (values: SpaceSettingsInput) => {
        updateName.mutate(
            {
                id: space.id,
                data: { name: values.name, description: values.description || undefined },
            },
            {
                onSuccess: () => {
                    updateSettings.mutate(
                        {
                            id: space.id,
                            data: {
                                visibility: values.visibility,
                                join_policy: values.join_policy,
                                default_role_id: values.default_role_id ?? null,
                            },
                        },
                        { onSuccess: () => onOpenChange(false) },
                    );
                },
            },
        );
    };

    const handleDelete = () => {
        deleteWorkspace.mutate(space.id, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title="Настройки пространства"
            className="max-w-2xl"
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 max-h-[70vh] overflow-y-auto pr-1"
                >
                    {/* Section 1: Appearance */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Внешний вид</h3>
                        <div className="flex items-center gap-4">
                            <div
                                className={`h-16 w-16 rounded-xl flex items-center justify-center text-white ${space.color}`}
                            >
                                <span className="text-xl font-bold">
                                    {space.title.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                onClick={() => alert("Загрузка иконки будет добавлена позже")}
                            >
                                [изменить]
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Basic info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Основная информация
                        </h3>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Название пространства *</FormLabel>
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
                                        <FormLabel>Описание пространства</FormLabel>
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
                        </div>
                    </div>

                    {/* Section 3: Access & Publicity */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Доступ и публичность
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                            Управление тем, кто может видеть и присоединяться к пространству
                        </p>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="visibility"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Публичность</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                options={visibilityOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                name="visibility"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="join_policy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Кто может вступать</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                options={joinPolicyOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                name="join_policy"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Section 4: Default role */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Роли участников
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                            Применяется, если роль не указана при добавлении участника вручную или
                            через приглашение
                        </p>
                        <FormField
                            control={form.control}
                            name="default_role_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Роль по умолчанию</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            options={defaultRoleOptions}
                                            value={String(field.value ?? "")}
                                            onValueChange={(v) =>
                                                field.onChange(v ? Number(v) : null)
                                            }
                                            name="default_role_id"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Section 5: Danger zone */}
                    <div>
                        <DangerZone onDelete={handleDelete} isPending={deleteWorkspace.isPending} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            size="hug36"
                            onClick={() => onOpenChange(false)}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" variant="dark" size="hug36" disabled={isPending}>
                            {isPending ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </div>
                </form>
            </Form>
        </Dialog>
    );
};
