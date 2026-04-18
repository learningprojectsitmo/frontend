import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    X,
    Calendar,
    UserCircle2,
    Users,
    Flag,
    Hash,
    Layers,
    Plus,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { SubtaskList } from "./subtask-list";
import { cn } from "@/lib/utils";
import type {
    Task,
    ProjectMember,
    ColumnWithTasksAndSubtasks,
    TaskPriority,
} from "@/types/tables/forTables";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────
// Типы и схема
// ─────────────────────────────────────────────────────────────

const taskSchema = z.object({
    title:       z.string().min(1, "Название обязательно").max(200, "Слишком длинное название"),
    description: z.string().optional(),
    priority:    z.enum(["default", "low", "medium", "high", "urgent"]).optional().default("default"),
    assigneeIds: z.array(z.number()).optional().default([]),
    dueDate:     z.string().optional(),
    tags:        z.string().optional(),
    columnId:    z.number().optional(),
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

// ─────────────────────────────────────────────────────────────
// Вспомогательные данные
// ─────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string; badgeClass: string }> = [
    { value: "urgent",  label: "Срочный",  badgeClass: "bg-red-100 text-red-700"       },
    { value: "high",    label: "Высокий",  badgeClass: "bg-orange-100 text-orange-700" },
    { value: "medium",  label: "Средний",  badgeClass: "bg-yellow-100 text-yellow-700" },
    { value: "low",     label: "Низкий",   badgeClass: "bg-green-100 text-green-700"   },
    { value: "default", label: "Обычный",  badgeClass: "bg-gray-100 text-gray-600"     },
];
const PRIORITY_MAP = Object.fromEntries(
    PRIORITY_OPTIONS.map(({ value, label, badgeClass }) => [value, { label, badgeClass }]),
) as unknown as Record<TaskPriority, { label: string; badgeClass: string }>;

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface TaskPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData, columnId: number) => void;
    task?: Task;
    columnId: number;
    columns?: ColumnWithTasksAndSubtasks[];
    projectName?: string;
    projectMembers?: ProjectMember[];
    isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Вспомогательные компоненты
// ─────────────────────────────────────────────────────────────

const PropertyRow = ({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) => (
    <div className="flex items-start gap-3 py-2.5">
        <div className="flex w-36 flex-shrink-0 items-center gap-2 text-sm text-gray-500">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex-1 min-w-0 text-sm text-gray-800">{children}</div>
    </div>
);

const MemberAvatar = ({ firstName, lastName }: { firstName?: string; lastName?: string }) => (
    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
        {(firstName?.[0] ?? "").toUpperCase()}
        {(lastName?.[0] ?? "").toUpperCase()}
    </div>
);

// ─────────────────────────────────────────────────────────────
// Форматирование
// ─────────────────────────────────────────────────────────────

const fmtDatePart = (d: Date) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" })
        .format(d)
        .replace(/\s*г\.$/u, "");

const fmtDateTime = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(d);
    return `${fmtDatePart(d)}  ${time}`;
};

const fmtDate = (s?: string) => (s ? fmtDatePart(new Date(s)) : null);

// ─────────────────────────────────────────────────────────────
// Основной компонент
// ─────────────────────────────────────────────────────────────

export const TaskPanel: React.FC<TaskPanelProps> = ({
    isOpen,
    onClose,
    onSubmit,
    task,
    columnId,
    columns = [],
    projectName = "Проект",
    projectMembers = [],
    isLoading = false,
}) => {
    // ── UI стейты ──
    const [titleFocused, setTitleFocused]   = React.useState(false);
    const [subtasksOpen, setSubtasksOpen]   = React.useState(true);

    // ── Ресайз панели ──
    const MIN_WIDTH = 560;
    const MAX_WIDTH = 640;
    const [panelWidth, setPanelWidth] = React.useState(MIN_WIDTH);
    const isResizing = React.useRef(false);

    const handleResizeMouseDown = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = "ew-resize";
        document.body.style.userSelect = "none";

        const onMouseMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = window.innerWidth - ev.clientX;
            setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, []);

    // ── Подзадачи (локальный стейт, синхронизируется при открытии) ──
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

    // ── Теги: отдельный инпут + список ──
    const [tagInput, setTagInput] = React.useState("");

    // ── Дедлайн: ref для вызова нативного пикера ──
    const dueDateRef = React.useRef<HTMLInputElement | null>(null);

    const { register, handleSubmit, reset, setValue, watch } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "", description: "", priority: "default",
            assigneeIds: [], dueDate: "", tags: "", columnId,
        },
    });

    const watchPriority  = (watch("priority") ?? "default") as TaskPriority;
    const watchAssignees = watch("assigneeIds") ?? [];
    const watchDueDate   = watch("dueDate") ?? "";
    const watchTags      = watch("tags") ?? "";
    const watchColumnId  = watch("columnId") ?? columnId;

    // Теги: массив из формы
    const tagsArray = React.useMemo(
        () => (watchTags ? watchTags.split(",").map((t) => t.trim()).filter(Boolean) : []),
        [watchTags],
    );

    // ── Сброс при открытии ──
    React.useEffect(() => {
        if (!isOpen) return;
        setTagInput("");
        if (task) {
            reset({
                title:       task.title,
                description: task.description ?? "",
                priority:    task.priority ?? "default",
                assigneeIds: task.assignees?.map((a) => a.id) ?? [],
                dueDate:     task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
                tags:        task.tags ?? "",
                columnId:    task.columnId,
            });
            setSubtasks(
                (task.subtasks ?? []).map((s) => ({
                    id: s.id, title: s.title, isCompleted: s.isCompleted,
                    position: s.position, taskId: s.taskId,
                    _tempId: `existing_${s.id}`,
                })),
            );
        } else {
            reset({ title: "", description: "", priority: "default", assigneeIds: [], dueDate: "", tags: "", columnId });
            setSubtasks([]);
        }
    }, [isOpen, task, reset, columnId]);

    // ── Сабмит ──
    const handleFormSubmit = (data: TaskFormData) => {
        onSubmit({ ...data, subtasks }, data.columnId ?? columnId);
    };

    // ── Подзадачи ──
    const handleAddSubtask = (title: string) =>
        setSubtasks((prev) => [
            ...prev,
            { title, isCompleted: false, position: prev.length, taskId: task?.id ?? 0, _tempId: `new_${Date.now()}` },
        ]);
    const handleUpdateSubtask = (i: number, upd: Partial<{ title: string; isCompleted: boolean }>) =>
        setSubtasks((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...upd } : s)));
    const handleDeleteSubtask = (i: number) =>
        setSubtasks((prev) => prev.filter((_, idx) => idx !== i));

    // ── Исполнители ──
    const selectedAssignees = React.useMemo(
        () => projectMembers.filter((m) => watchAssignees.includes(m.id)),
        [watchAssignees, projectMembers],
    );
    const availableAssignees = React.useMemo(
        () => projectMembers.filter((m) => !watchAssignees.includes(m.id)),
        [watchAssignees, projectMembers],
    );
    const addAssignee    = (id: number) => setValue("assigneeIds", [...watchAssignees, id]);
    const removeAssignee = (id: number) => setValue("assigneeIds", watchAssignees.filter((x) => x !== id));

    // ── Теги: коммит при запятой / Enter / blur ──
    const commitTag = React.useCallback(() => {
        const tag = tagInput.replace(/,/g, "").trim();
        if (!tag || tagsArray.includes(tag)) { setTagInput(""); return; }
        setValue("tags", [...tagsArray, tag].join(", "));
        setTagInput("");
    }, [tagInput, tagsArray, setValue]);

    const removeTag = (tag: string) =>
        setValue("tags", tagsArray.filter((t) => t !== tag).join(", "));

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commitTag(); }
        // Backspace на пустом инпуте удаляет последний тег
        if (e.key === "Backspace" && !tagInput && tagsArray.length > 0) {
            removeTag(tagsArray[tagsArray.length - 1]);
        }
    };

    // ── Дедлайн: открыть нативный пикер ──
    const openDatePicker = () => {
        try       { dueDateRef.current?.showPicker(); }
        catch (_) { dueDateRef.current?.click(); }
    };

    // Мёрж рефов react-hook-form + наш dueDateRef
    const { ref: registerDueDateRef, ...registerDueDateRest } = register("dueDate");

    // ── Текущая колонка ──
    const currentColumn = columns.find((c) => c.id === watchColumnId) ?? columns[0];

    // ── Прогресс подзадач ──
    const completedCount = subtasks.filter((s) => s.isCompleted).length;

    if (!isOpen) return null;

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    style={{ width: panelWidth }}
                    className={cn(
                        "fixed right-0 top-0 z-50 flex h-full flex-col bg-white shadow-2xl",
                        "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
                        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
                        "duration-300",
                    )}
                >
                    {/* ── Ручка ресайза ── */}
                    <div
                        onMouseDown={handleResizeMouseDown}
                        className="group absolute left-0 top-0 z-10 flex h-full w-2.5 cursor-ew-resize bg-gray-200 items-center justify-center transition-colors hover:bg-gray-300"
                        aria-hidden
                    >
                        {/* Центральный грип — две вертикальных полоски */}
                        <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-[2px]">
                            <div className="h-5 w-[2px] rounded-full bg-gray-500 group-hover:bg-black transition-colors" />
                            <div className="h-5 w-[2px] rounded-full bg-gray-500 group-hover:bg-black transition-colors" />
                        </div>
                    </div>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex h-full flex-col overflow-hidden">

                        {/* ── Хедер ── */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <div className="px-1 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-black">
                                    {task && <span>#{task.id}</span>}
                                </div>
                                <div className="w-px h-6 bg-gray-300" />
                                <span>{projectName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button type="submit" variant="outline" size="hug36" disabled={isLoading} className="h-8">
                                    {isLoading ? "Сохранение..." : task ? "Сохранить" : "Создать"}
                                </Button>
                                <DialogPrimitive.Close
                                    onClick={onClose}
                                    className="rounded-md p-1 text-black transition-colors hover:bg-gray-100"
                                    aria-label="Закрыть"
                                >
                                    <X className="h-5 w-5" />
                                </DialogPrimitive.Close>
                            </div>
                        </div>

                        {/* ── Скролл-область ── */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="px-6 py-6 space-y-1">

                                {/* Название задачи */}
                                <textarea
                                    {...register("title")}
                                    placeholder="Название задачи"
                                    rows={1}
                                    onFocus={(e) => {
                                        setTitleFocused(true);
                                        const el = e.currentTarget;
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                    }}
                                    onBlur={() => setTitleFocused(false)}
                                    onInput={(e) => {
                                        const el = e.currentTarget;
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                    }}
                                    className={cn(
                                        "w-full bg-transparent text-2xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 leading-snug",
                                        titleFocused
                                            ? "resize-none overflow-hidden"
                                            : "resize-none overflow-hidden truncate whitespace-nowrap",
                                    )}
                                />

                                {/* Дата создания */}
                                {task?.createdAt && (
                                    <p className="pb-4 text-sm text-gray-500">
                                        Создана: {fmtDateTime(task.createdAt)}
                                    </p>
                                )}

                                {/* ── Свойства ── */}
                                <div className="">
                                    {/* Статус */}
                                    <PropertyRow icon={<Layers className="h-4 w-4" />} label="Статус">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button type="button" className="flex items-center gap-1.5 rounded-md px-2 hover:bg-gray-100 -mx-2">
                                                    {currentColumn?.color && (
                                                        <span
                                                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                            style={{ backgroundColor: currentColumn.color }}
                                                        />
                                                    )}
                                                    <span>{currentColumn?.name ?? "—"}</span>
                                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-[200px]">
                                                {columns.map((col) => (
                                                    <DropdownMenuItem
                                                        key={col.id}
                                                        onClick={() => setValue("columnId", col.id)}
                                                        className={cn("cursor-pointer", col.id === watchColumnId && "bg-accent")}
                                                    >
                                                        {col.color && (
                                                            <span
                                                                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                                style={{ backgroundColor: col.color }}
                                                            />
                                                        )}
                                                        {col.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </PropertyRow>

                                    {/* Дедлайн */}
                                    <PropertyRow icon={<Calendar className="h-4 w-4" />} label="Дедлайн">
                                        <div className="flex items-center gap-2 -mx-2">
                                            {/* Кнопка-триггер с форматированной датой */}
                                            <button
                                                type="button"
                                                onClick={openDatePicker}
                                                className="flex-1 text-left rounded-md px-2 hover:bg-gray-100"
                                            >
                                                {watchDueDate
                                                    ? <span>{fmtDate(watchDueDate)}</span>
                                                    : <span className="text-gray-400">Не указан</span>
                                                }
                                            </button>
                                            {/* Кнопка сброса */}
                                            {watchDueDate && (
                                                <button
                                                    type="button"
                                                    onClick={() => setValue("dueDate", "")}
                                                    className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    aria-label="Сбросить дедлайн"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            {/* Скрытый нативный input — вызывается через showPicker() */}
                                            <input
                                                type="date"
                                                {...registerDueDateRest}
                                                ref={(el) => {
                                                    registerDueDateRef(el);
                                                    dueDateRef.current = el;
                                                }}
                                                className="sr-only"
                                            />
                                        </div>
                                    </PropertyRow>

                                    {/* Автор */}
                                    {task?.createdBy && (
                                        <PropertyRow icon={<UserCircle2 className="h-4 w-4" />} label="Автор">
                                            <div className="flex items-center gap-2">
                                                <MemberAvatar firstName={task.createdBy.firstName} lastName={task.createdBy.lastName} />
                                                <span>{task.createdBy.firstName} {task.createdBy.lastName}</span>
                                            </div>
                                        </PropertyRow>
                                    )}

                                    {/* Исполнители */}
                                    <PropertyRow icon={<Users className="h-4 w-4" />} label="Исполнители">
                                        <div className="flex flex-wrap items-center gap-1.5 -mx-2 px-2">
                                            {selectedAssignees.map((m) => (
                                                <div key={m.id} className="group flex items-center gap-1.5 rounded-full bg-blue-50 py-0.5 pl-1 pr-2 text-xs text-blue-700">
                                                    <MemberAvatar firstName={m.firstName} lastName={m.lastName} />
                                                    <span>{m.firstName} {m.lastName}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAssignee(m.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-red-500"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            {availableAssignees.length > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                                                            aria-label="Добавить исполнителя"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-[220px]">
                                                        {availableAssignees.map((m) => (
                                                            <DropdownMenuItem key={m.id} onClick={() => addAssignee(m.id)} className="cursor-pointer">
                                                                <MemberAvatar firstName={m.firstName} lastName={m.lastName} />
                                                                <span>{m.firstName} {m.lastName}</span>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            {selectedAssignees.length === 0 && availableAssignees.length === 0 && (
                                                <span className="text-gray-400">Не назначены</span>
                                            )}
                                        </div>
                                    </PropertyRow>

                                    {/* Приоритет */}
                                    <PropertyRow icon={<Flag className="h-4 w-4" />} label="Приоритет">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button type="button" className="flex items-center gap-1.5 rounded-md px-1 hover:bg-gray-100 -mx-1">
                                                    <span className={cn(
                                                        "rounded-md px-2 py-1 text-xs font-medium",
                                                        PRIORITY_MAP[watchPriority]?.badgeClass ?? "bg-gray-100 text-gray-600",
                                                    )}>
                                                        {PRIORITY_MAP[watchPriority]?.label ?? "Обычный"}
                                                    </span>
                                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-[180px] rounded-xl">
                                                {PRIORITY_OPTIONS.map(({ value, label, badgeClass }) => (
                                                    <DropdownMenuItem
                                                        key={value}
                                                        onClick={() => setValue("priority", value)}
                                                        className={cn("py-1 cursor-pointer rounded-md", watchPriority === value && "bg-accent")}
                                                    >
                                                        <span className={cn("rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1", badgeClass)}>
                                                            <div className="h-3 w-3 rounded-full bg-white"></div>
                                                            {label}
                                                        </span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </PropertyRow>

                                    {/* Теги */}
                                    <PropertyRow icon={<Hash className="h-4 w-4" />} label="Теги">
                                        <div
                                            className="flex flex-wrap items-center gap-1.5 -mx-2 px-2 rounded-md hover:bg-gray-100 cursor-text min-h-[16px]"
                                            onClick={() => document.getElementById("tag-input")?.focus()}
                                        >
                                            {tagsArray.map((tag) => (
                                                <span key={tag} className="flex items-center gap-1 rounded-md bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                id="tag-input"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagKeyDown}
                                                onBlur={commitTag}
                                                placeholder={tagsArray.length === 0 ? "Добавить тег..." : ""}
                                                className="min-w-[80px] flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                            />
                                        </div>
                                    </PropertyRow>
                                </div>

                                {/* ── Описание ── */}
                                <div className="pt-4">
                                    <div className="h-[2px] w-full bg-gray-100 rounded-full mb-4" />
                                    <textarea
                                        {...register("description")}
                                        placeholder="Добавьте описание задачи..."
                                        rows={4}
                                        className="w-full resize-none bg-transparent text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-400"
                                        onInput={(e) => {
                                            const el = e.currentTarget;
                                            el.style.height = "auto";
                                            el.style.height = `${el.scrollHeight}px`;
                                        }}
                                    />
                                </div>

                                {/* ── Подзадачи ── */}
                                <div className="pb-8 pt-2">
                                    <div className="h-[2px] w-full bg-gray-100 rounded-full mb-4" />
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => setSubtasksOpen((v) => !v)}
                                            >
                                                <ChevronRight
                                                    className={cn(
                                                        "h-4 w-4 flex-shrink-0 transition-transform duration-200 hover:bg-gray-200 hover:rounded-sm",
                                                        subtasksOpen && "rotate-90",
                                                    )}
                                                />
                                            </button>
                                            <span>Подзадачи</span>
                                        </div>
                                        <div className="flex items-center">
                                            {subtasks.length > 0 && (
                                                <span className="ml-1 text-xs text-gray-500">
                                                    {completedCount}/{subtasks.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {subtasksOpen && (
                                        <SubtaskList
                                            taskId={task?.id}
                                            subtasks={subtasks}
                                            onAddSubtask={handleAddSubtask}
                                            onUpdateSubtask={handleUpdateSubtask}
                                            onDeleteSubtask={handleDeleteSubtask}
                                        />
                                    )}
                                </div>

                            </div>
                        </div>
                    </form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};

export default TaskPanel;
