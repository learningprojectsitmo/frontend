import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Textarea } from "@/components/ui/textarea/textarea";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group/radio-group";
import { Switch } from "@/components/ui/switch/switch";
import { DangerZone } from "@/features/spaces/components/danger-zone";
import { Calendar } from "@/features/spaces/components/filters/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form/form";
import {
    useUpdateSpaceSettings,
    useUpdateWorkspaceName,
    useDeleteWorkspace,
    useSpaceSettings,
} from "@/lib/spaces";
import { useRoles, ROLE_LABELS } from "@/lib/roles";
import { Spinner } from "@/components/ui/spinner/spinner";
import type { Space } from "@/types/api";

const spaceSettingsSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(100, "Слишком длинное название"),
    description: z.string().max(500, "Максимум 500 символов").optional().or(z.literal("")),
    visibility: z.enum(["public", "private"]),
    join_policy: z.enum(["open", "link", "invitation"]),
    default_role_id: z.number().nullable().optional(),
    allow_multi_project_participation: z.boolean(),
    allow_multi_project_creation: z.boolean(),
    default_project_deadline: z.string().nullable().optional(),
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

const StubBadge = () => (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 align-middle">
        Заглушка
    </span>
);

function formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${d}.${m}.${date.getFullYear()}`;
}

function dateFromIso(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isoFromDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
}

export const SpaceSettingsModal = ({ open, onOpenChange, space }: SpaceSettingsModalProps) => {
    const updateSettings = useUpdateSpaceSettings();
    const updateName = useUpdateWorkspaceName();
    const deleteWorkspace = useDeleteWorkspace();
    const { data: settings, isLoading: isSettingsLoading } = useSpaceSettings(space.id, open);
    const { data: rolesData } = useRoles();
    const roles = rolesData?.items ?? [];
    const defaultRoleOptions: RadioOption[] = roles.map((role) => ({
        value: String(role.id),
        label: ROLE_LABELS[role.name] ?? role.name,
    }));

    const isPending = updateSettings.isPending || updateName.isPending;

    const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);
    const deadlineTriggerRef = useRef<HTMLButtonElement>(null);
    const deadlinePopoverRef = useRef<HTMLDivElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);
    const [deadlinePos, setDeadlinePos] = useState<{ top: number; left: number } | null>(null);

    const openDeadlinePicker = () => {
        const trigger = deadlineTriggerRef.current;
        const content = dialogContentRef.current;
        if (trigger && content) {
            const triggerRect = trigger.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            setDeadlinePos({
                top: triggerRect.bottom - contentRect.top + 8,
                left: triggerRect.left - contentRect.left,
            });
        }
        setDeadlinePickerOpen((v) => !v);
    };

    useEffect(() => {
        if (!deadlinePickerOpen) return;
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (
                deadlineTriggerRef.current?.contains(target) ||
                deadlinePopoverRef.current?.contains(target)
            ) {
                return;
            }
            setDeadlinePickerOpen(false);
        }
        function handleKeydown(e: KeyboardEvent) {
            if (e.key === "Escape") setDeadlinePickerOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeydown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeydown);
        };
    }, [deadlinePickerOpen]);

    const form = useForm<SpaceSettingsInput>({
        resolver: zodResolver(spaceSettingsSchema),
        defaultValues: {
            name: space.title,
            description: space.description || "",
            visibility: "public",
            join_policy: "open",
            default_role_id: null,
            allow_multi_project_participation: false,
            allow_multi_project_creation: false,
            default_project_deadline: null,
        },
    });

    useEffect(() => {
        form.reset({
            name: space.title,
            description: space.description || "",
            visibility: settings?.visibility ?? "public",
            join_policy: settings?.join_policy ?? "open",
            default_role_id: settings?.default_role_id ?? null,
            allow_multi_project_participation: settings?.allow_multi_project_participation ?? false,
            allow_multi_project_creation: settings?.allow_multi_project_creation ?? false,
            default_project_deadline: settings?.default_project_deadline
                ? settings.default_project_deadline.slice(0, 10)
                : null,
        });
    }, [space, settings, form]);

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
                                allow_multi_project_participation:
                                    values.allow_multi_project_participation,
                                allow_multi_project_creation: values.allow_multi_project_creation,
                                default_project_deadline: values.default_project_deadline
                                    ? new Date(
                                          values.default_project_deadline + "T00:00:00",
                                      ).toISOString()
                                    : null,
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                ref={dialogContentRef}
                aria-describedby={undefined}
                className="max-w-2xl"
            >
                <DialogHeader>
                    <DialogTitle>Настройки пространства</DialogTitle>
                </DialogHeader>
                {isSettingsLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 max-h-[70vh] overflow-y-auto pr-1"
                        >
                            {/* Section 1: Appearance */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                    Внешний вид
                                </h3>
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
                                        onClick={() =>
                                            alert("Загрузка иконки будет добавлена позже")
                                        }
                                    >
                                        [изменить]
                                    </button>
                                    <StubBadge />
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
                                                <p className="text-xs text-amber-600 mt-1">
                                                    Работает пока только для списка пространств
                                                </p>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="join_policy"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Кто может вступать
                                                    <StubBadge />
                                                </FormLabel>
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
                                    Применяется, если роль не указана при добавлении участника
                                    вручную или через приглашение
                                </p>
                                <FormField
                                    control={form.control}
                                    name="default_role_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Роль по умолчанию
                                                <StubBadge />
                                            </FormLabel>
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

                            {/* Section 5: Project management toggles */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                    Управление проектами
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Настройки участия в проектах внутри пространства
                                </p>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="allow_multi_project_participation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <FormLabel className="text-sm font-medium text-gray-900">
                                                            Участие в нескольких проектах
                                                            <StubBadge />
                                                        </FormLabel>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Разрешить участникам состоять в
                                                            нескольких проектах одновременно
                                                        </p>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="allow_multi_project_creation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <FormLabel className="text-sm font-medium text-gray-900">
                                                            Создание нескольких проектов
                                                            <StubBadge />
                                                        </FormLabel>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            Разрешить участникам создавать несколько
                                                            проектов в пространстве
                                                        </p>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="default_project_deadline"
                                        render={({ field }) => {
                                            const selectedDate = dateFromIso(field.value);
                                            return (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-gray-900">
                                                        Дедлайн проектов
                                                    </FormLabel>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Выставляется всем проектам пространства
                                                        (включая существующие)
                                                    </p>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <button
                                                                ref={deadlineTriggerRef}
                                                                type="button"
                                                                onClick={openDeadlinePicker}
                                                                className="w-full h-9 px-3 flex items-center justify-between bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-gray-900 hover:border-gray-300 outline-none transition-colors"
                                                            >
                                                                <span
                                                                    className={
                                                                        selectedDate
                                                                            ? ""
                                                                            : "text-gray-400"
                                                                    }
                                                                >
                                                                    {selectedDate
                                                                        ? formatDate(selectedDate)
                                                                        : "Не указан"}
                                                                </span>
                                                                {selectedDate && (
                                                                    <span className="flex items-center gap-1">
                                                                        <CalendarIcon
                                                                            size={16}
                                                                            className="text-gray-400"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                field.onChange(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                                                            aria-label="Сбросить дедлайн"
                                                                        >
                                                                            <X
                                                                                size={14}
                                                                                className="h-3.5 w-3.5"
                                                                            />
                                                                        </button>
                                                                    </span>
                                                                )}
                                                                {!selectedDate && (
                                                                    <CalendarIcon
                                                                        size={16}
                                                                        className="text-gray-400"
                                                                    />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    {deadlinePickerOpen &&
                                                        deadlinePos &&
                                                        dialogContentRef.current &&
                                                        createPortal(
                                                            <div
                                                                ref={deadlinePopoverRef}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: deadlinePos.top,
                                                                    left: deadlinePos.left,
                                                                    zIndex: 10,
                                                                }}
                                                            >
                                                                <Calendar
                                                                    selected={selectedDate}
                                                                    onSelect={(date) => {
                                                                        field.onChange(
                                                                            isoFromDate(date),
                                                                        );
                                                                        setDeadlinePickerOpen(
                                                                            false,
                                                                        );
                                                                    }}
                                                                />
                                                            </div>,
                                                            dialogContentRef.current,
                                                        )}
                                                </FormItem>
                                            );
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Section 6: Danger zone */}
                            <div>
                                <DangerZone
                                    confirmationName={space.title}
                                    onDelete={handleDelete}
                                    isPending={deleteWorkspace.isPending}
                                />
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
                                <Button
                                    type="submit"
                                    variant="dark"
                                    size="hug36"
                                    disabled={isPending}
                                >
                                    {isPending ? "Сохранение..." : "Сохранить"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
};
