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
    Check,
    AlertCircle,
    Loader2,
    MoreVertical,
    Trash2,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { columnColors, baseColor } from "@/features/kanban/utils/column-styles";

const allColumnColors: Record<string, { header: string }> = {
    ...columnColors,
    white: baseColor.white,
};

const getColumnHeaderClass = (color?: string): string =>
    color ? (allColumnColors[color]?.header ?? "bg-gray-200") : "bg-gray-200";

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

type TaskFormData = z.infer<typeof taskSchema>;

// Поля которые можно отправить в PATCH-запрос на бэк
export type TaskPatch = {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeIds?: number[];
    dueDate?: string | null;
    tags?: string[];
};

// Совместимость со старым импортом
export type { TaskFormData };

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
    onAutoSave: (taskId: number, patch: TaskPatch) => Promise<unknown>;
    onMoveToColumn: (taskId: number, columnId: number) => Promise<unknown>;
    onDelete: (taskId: number) => Promise<unknown> | void;
    onSubtaskCreate: (taskId: number, title: string) => Promise<unknown>;
    onSubtaskUpdate: (subtaskId: number, data: { title?: string; isCompleted?: boolean }) => Promise<unknown>;
    onSubtaskDelete: (subtaskId: number) => Promise<unknown>;
    task?: Task;
    columns?: ColumnWithTasksAndSubtasks[];
    projectName?: string;
    projectMembers?: ProjectMember[];
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

type SaveStatus = "idle" | "saving" | "saved" | "error";

const SaveIndicator: React.FC<{ status: SaveStatus; onRetry: () => void }> = ({ status, onRetry }) => {
    if (status === "saving") {
        return (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Сохранение…
            </span>
        );
    }
    if (status === "saved") {
        return (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="h-3.5 w-3.5 text-green-600" />
                Сохранено
            </span>
        );
    }
    if (status === "error") {
        return (
            <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:underline"
            >
                <AlertCircle className="h-3.5 w-3.5" />
                Не сохранено · Повторить
            </button>
        );
    }
    return null;
};

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
// Утилиты
// ─────────────────────────────────────────────────────────────

const parseTags = (raw?: string): string[] =>
    raw ? raw.split(",").map((t) => t.trim()).filter(Boolean) : [];

const arraysEqual = <T,>(a: T[], b: T[]): boolean =>
    a.length === b.length && a.every((v, i) => v === b[i]);

// ─────────────────────────────────────────────────────────────
// Основной компонент
// ─────────────────────────────────────────────────────────────

export const TaskPanel: React.FC<TaskPanelProps> = ({
    isOpen,
    onClose,
    onAutoSave,
    onMoveToColumn,
    onDelete,
    onSubtaskCreate,
    onSubtaskUpdate,
    onSubtaskDelete,
    task,
    columns = [],
    projectName = "Проект",
    projectMembers = [],
}) => {
    // ── UI стейты ──
    const [subtasksOpen, setSubtasksOpen] = React.useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const titleRef = React.useRef<HTMLTextAreaElement | null>(null);
    const descriptionRef = React.useRef<HTMLTextAreaElement | null>(null);
    const dueDateRef = React.useRef<HTMLInputElement | null>(null);

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

    // ── Теги ──
    const [tagInput, setTagInput] = React.useState("");

    // ── Save status + последний неудачный patch для retry ──
    const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
    const lastFailedPatch = React.useRef<TaskPatch | null>(null);
    const pendingCount = React.useRef(0);
    const savedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Form ──
    const { register, reset, setValue, watch, getValues } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "", description: "", priority: "default",
            assigneeIds: [], dueDate: "", tags: "", columnId: undefined,
        },
    });

    const watchPriority  = (watch("priority") ?? "default") as TaskPriority;
    const watchAssignees = watch("assigneeIds") ?? [];
    const watchDueDate   = watch("dueDate") ?? "";
    const watchTags      = watch("tags") ?? "";
    const watchColumnId  = watch("columnId") ?? task?.columnId;

    const tagsArray = React.useMemo(() => parseTags(watchTags), [watchTags]);

    // ── Сброс формы только при смене ИД задачи или открытии панели ──
    const taskId = task?.id;
    React.useEffect(() => {
        if (!isOpen || !task) return;
        setTagInput("");
        if (titleRef.current) {
            titleRef.current.style.height = "";
            titleRef.current.blur();
        }
        reset({
            title:       task.title,
            description: task.description ?? "",
            priority:    task.priority ?? "default",
            assigneeIds: task.assignees?.map((a) => a.id) ?? [],
            dueDate:     task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
            tags:        task.tags ?? "",
            columnId:    task.columnId,
        });
        setSaveStatus("idle");
        lastFailedPatch.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, taskId, reset]);

    // Пересчитываем высоту описания при открытии
    React.useEffect(() => {
        if (!isOpen) return;
        const id = requestAnimationFrame(() => {
            const el = descriptionRef.current;
            if (el) {
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
            }
        });
        return () => cancelAnimationFrame(id);
    }, [isOpen, task]);

    // ─────────────────────────────────────────────────────────
    // Автосейв
    // ─────────────────────────────────────────────────────────

    const runSave = React.useCallback(
        async (patch: TaskPatch) => {
            if (!task) return;
            if (Object.keys(patch).length === 0) return;
            pendingCount.current += 1;
            setSaveStatus("saving");
            try {
                await onAutoSave(task.id, patch);
                lastFailedPatch.current = null;
                pendingCount.current -= 1;
                if (pendingCount.current === 0) {
                    setSaveStatus("saved");
                    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
                    savedTimerRef.current = setTimeout(() => {
                        setSaveStatus((s) => (s === "saved" ? "idle" : s));
                    }, 2000);
                }
            } catch (e) {
                pendingCount.current -= 1;
                lastFailedPatch.current = { ...(lastFailedPatch.current ?? {}), ...patch };
                setSaveStatus("error");
                throw e;
            }
        },
        [task, onAutoSave],
    );

    // Debounce для текстовых полей
    const debounceTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const pendingPatch = React.useRef<TaskPatch>({});

    const flushDebounced = React.useCallback(() => {
        Object.keys(debounceTimers.current).forEach((key) => {
            clearTimeout(debounceTimers.current[key]);
            delete debounceTimers.current[key];
        });
        const patch = pendingPatch.current;
        pendingPatch.current = {};
        if (Object.keys(patch).length > 0) {
            void runSave(patch).catch(() => {});
        }
    }, [runSave]);

    const scheduleDebouncedSave = React.useCallback(
        (key: keyof TaskPatch, value: unknown, delay = 700) => {
            (pendingPatch.current as Record<string, unknown>)[key] = value;
            if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
            debounceTimers.current[key] = setTimeout(() => {
                delete debounceTimers.current[key];
                const patch: TaskPatch = {};
                (patch as Record<string, unknown>)[key] = (pendingPatch.current as Record<string, unknown>)[key];
                delete (pendingPatch.current as Record<string, unknown>)[key];
                void runSave(patch).catch(() => {});
            }, delay);
        },
        [runSave],
    );

    // Flush + закрытие при размонтировании / закрытии панели
    const handleClose = React.useCallback(() => {
        flushDebounced();
        onClose();
    }, [flushDebounced, onClose]);

    React.useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(clearTimeout);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    // Retry последнего неудачного сейва
    const handleRetry = React.useCallback(() => {
        const patch = lastFailedPatch.current;
        if (!patch) {
            setSaveStatus("idle");
            return;
        }
        void runSave(patch).catch(() => {});
    }, [runSave]);

    // ─────────────────────────────────────────────────────────
    // Хелперы для полей
    // ─────────────────────────────────────────────────────────

    // Title / description — onChange c debounce
    const onTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        scheduleDebouncedSave("title", e.target.value);
    };
    const onTitleBlur = () => {
        flushDebounced();
    };

    const onDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        scheduleDebouncedSave("description", e.target.value);
    };
    const onDescriptionBlur = () => {
        flushDebounced();
    };

    // Селекторы — мгновенный сейв
    const setColumnId = (columnId: number) => {
        if (columnId === watchColumnId || !task) return;
        setValue("columnId", columnId);
        pendingCount.current += 1;
        setSaveStatus("saving");
        onMoveToColumn(task.id, columnId)
            .then(() => {
                pendingCount.current -= 1;
                if (pendingCount.current === 0) {
                    setSaveStatus("saved");
                    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
                    savedTimerRef.current = setTimeout(() => {
                        setSaveStatus((s) => (s === "saved" ? "idle" : s));
                    }, 2000);
                }
            })
            .catch(() => {
                pendingCount.current -= 1;
                // Откат значения в форме
                setValue("columnId", task.columnId);
                setSaveStatus("error");
            });
    };

    const setPriority = (priority: TaskPriority) => {
        if (priority === watchPriority) return;
        setValue("priority", priority);
        void runSave({ priority }).catch(() => {});
    };

    const setDueDate = (value: string) => {
        if (value === watchDueDate) return;
        setValue("dueDate", value);
        void runSave({ dueDate: value === "" ? null : value }).catch(() => {});
    };

    // Исполнители
    const selectedAssignees = React.useMemo(
        () => projectMembers.filter((m) => watchAssignees.includes(m.id)),
        [watchAssignees, projectMembers],
    );
    const availableAssignees = React.useMemo(
        () => projectMembers.filter((m) => !watchAssignees.includes(m.id)),
        [watchAssignees, projectMembers],
    );
    const addAssignee = (id: number) => {
        const next = [...watchAssignees, id];
        setValue("assigneeIds", next);
        void runSave({ assigneeIds: next }).catch(() => {});
    };
    const removeAssignee = (id: number) => {
        const next = watchAssignees.filter((x) => x !== id);
        setValue("assigneeIds", next);
        void runSave({ assigneeIds: next }).catch(() => {});
    };

    // Теги
    const commitTag = React.useCallback(() => {
        const tag = tagInput.replace(/,/g, "").trim();
        setTagInput("");
        if (!tag || tagsArray.includes(tag)) return;
        const next = [...tagsArray, tag];
        setValue("tags", next.join(", "));
        void runSave({ tags: next }).catch(() => {});
    }, [tagInput, tagsArray, setValue, runSave]);

    const removeTag = (tag: string) => {
        const next = tagsArray.filter((t) => t !== tag);
        setValue("tags", next.join(", "));
        void runSave({ tags: next }).catch(() => {});
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commitTag();
        }
        if (e.key === "Backspace" && !tagInput && tagsArray.length > 0) {
            removeTag(tagsArray[tagsArray.length - 1]);
        }
    };

    // Открытие нативного date picker
    const openDatePicker = () => {
        try { dueDateRef.current?.showPicker(); }
        catch (_) { dueDateRef.current?.click(); }
    };
    const { ref: registerDueDateRef, ...registerDueDateRest } = register("dueDate");
    const { ref: titleRegRef, ...titleRegRest } = register("title");

    // Текущая колонка
    const currentColumn = columns.find((c) => c.id === watchColumnId) ?? columns[0];

    // ─────────────────────────────────────────────────────────
    // Подзадачи (рендерим напрямую из task.subtasks, без локального стейта)
    // ─────────────────────────────────────────────────────────
    const subtasks = React.useMemo(
        () =>
            (task?.subtasks ?? [])
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((s) => ({
                    id: s.id,
                    title: s.title,
                    isCompleted: s.isCompleted,
                    position: s.position,
                    taskId: s.taskId,
                    _tempId: `existing_${s.id}`,
                })),
        [task?.subtasks],
    );

    const handleAddSubtask = (title: string) => {
        if (!task) return;
        void onSubtaskCreate(task.id, title).catch(() => {});
    };
    const handleUpdateSubtaskByIndex = (
        i: number,
        upd: Partial<{ title: string; isCompleted: boolean }>,
    ) => {
        const sub = subtasks[i];
        if (!sub?.id) return;
        void onSubtaskUpdate(sub.id, upd).catch(() => {});
    };
    const handleDeleteSubtaskByIndex = (i: number) => {
        const sub = subtasks[i];
        if (!sub?.id) return;
        void onSubtaskDelete(sub.id).catch(() => {});
    };

    const completedCount = subtasks.filter((s) => s.isCompleted).length;

    // ─────────────────────────────────────────────────────────
    // Не используем — но защита от мёртвых импортов
    // ─────────────────────────────────────────────────────────
    void getValues;
    void arraysEqual;

    if (!isOpen || !task) return null;

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(v) => !v && handleClose()}>
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
                        <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-[2px]">
                            <div className="h-5 w-[2px] rounded-full bg-gray-500 group-hover:bg-black transition-colors" />
                            <div className="h-5 w-[2px] rounded-full bg-gray-500 group-hover:bg-black transition-colors" />
                        </div>
                    </div>

                    <div className="flex h-full flex-col overflow-hidden">
                        {/* ── Хедер ── */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <div className="px-1 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-black">
                                    <span>#{task.id}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-300" />
                                <span>{projectName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <SaveIndicator status={saveStatus} onRetry={handleRetry} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="rounded-md p-1 text-black transition-colors hover:bg-gray-100 focus:outline-none"
                                            aria-label="Действия с задачей"
                                        >
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-300">
                                        <DropdownMenuItem
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                            className="cursor-pointer text-red-600 focus:text-red-600 gap-0"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Удалить
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DialogPrimitive.Close
                                    onClick={handleClose}
                                    className="rounded-md p-1 text-black transition-colors hover:bg-gray-100 focus:outline-none"
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
                                    {...titleRegRest}
                                    ref={(el) => { titleRegRef(el); titleRef.current = el; }}
                                    rows={1}
                                    placeholder="Название задачи"
                                    onFocus={(e) => {
                                        const el = e.currentTarget;
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.height = "";
                                        onTitleBlur();
                                    }}
                                    onInput={(e) => {
                                        const el = e.currentTarget;
                                        el.style.height = "auto";
                                        el.style.height = `${el.scrollHeight}px`;
                                    }}
                                    onChange={(e) => {
                                        titleRegRest.onChange?.(e);
                                        onTitleChange(e);
                                    }}
                                    className="w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold leading-snug text-gray-900 outline-none placeholder:text-gray-300 truncate focus:whitespace-normal"
                                />

                                {/* Дата создания */}
                                {task.createdAt && (
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
                                                        <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", getColumnHeaderClass(currentColumn.color))} />
                                                    )}
                                                    <span>{currentColumn?.name ?? "—"}</span>
                                                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-[200px]">
                                                {columns.map((col) => (
                                                    <DropdownMenuItem
                                                        key={col.id}
                                                        onClick={() => setColumnId(col.id)}
                                                        className={cn("cursor-pointer", col.id === watchColumnId && "bg-accent")}
                                                    >
                                                        {col.color && (
                                                            <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", getColumnHeaderClass(col.color))} />
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
                                            <button
                                                type="button"
                                                onClick={openDatePicker}
                                                className="flex-1 text-left rounded-md px-2 hover:bg-gray-100"
                                            >
                                                {watchDueDate
                                                    ? <span>{fmtDate(watchDueDate)}</span>
                                                    : <span className="text-gray-400">Не указан</span>}
                                            </button>
                                            {watchDueDate && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDueDate("")}
                                                    className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    aria-label="Сбросить дедлайн"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <input
                                                type="date"
                                                {...registerDueDateRest}
                                                ref={(el) => {
                                                    registerDueDateRef(el);
                                                    dueDateRef.current = el;
                                                }}
                                                onChange={(e) => {
                                                    registerDueDateRest.onChange?.(e);
                                                    setDueDate(e.target.value);
                                                }}
                                                className="sr-only"
                                            />
                                        </div>
                                    </PropertyRow>

                                    {/* Автор */}
                                    {task.createdBy && (
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
                                                        onClick={() => setPriority(value)}
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
                                                <span key={tag} className="group flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                                        className="hidden group-hover:inline-flex ml-1 text-gray-500 hover:text-red-500"
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
                                        {...(() => {
                                            const { ref: regRef, onChange: regOnChange, ...rest } = register("description");
                                            return {
                                                ...rest,
                                                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                                    regOnChange?.(e);
                                                    onDescriptionChange(e);
                                                },
                                                ref: (el: HTMLTextAreaElement | null) => {
                                                    regRef(el);
                                                    descriptionRef.current = el;
                                                },
                                            };
                                        })()}
                                        onBlur={onDescriptionBlur}
                                        placeholder="Напишите описание задачи..."
                                        rows={4}
                                        className="w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed text-gray-700 outline-none placeholder:text-gray-400"
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
                                            taskId={task.id}
                                            subtasks={subtasks}
                                            onAddSubtask={handleAddSubtask}
                                            onUpdateSubtask={handleUpdateSubtaskByIndex}
                                            onDeleteSubtask={handleDeleteSubtaskByIndex}
                                        />
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>

            {/* Диалог подтверждения удаления задачи */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Удалить задачу?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Вы действительно хотите удалить задачу «{task.title}»? Это действие
                            нельзя будет отменить.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                Promise.resolve(onDelete(task.id))
                                    .then(() => handleClose())
                                    .catch(() => {});
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            Удалить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </DialogPrimitive.Root>
    );
};

export default TaskPanel;
