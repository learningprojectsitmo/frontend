import React, { useMemo, useState } from "react";
import { ListFilter, ChevronDown, X, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuPortal,
} from "@/components/ui/dropdown/dropdown-menu";
import type {
    ColumnWithTasksAndSubtasks,
    TaskPriority,
    ProjectMember,
} from "@/types/tables/forTables";
import { cn } from "@/lib/utils";
import {
    type KanbanFilterState,
    defaultFilterState,
    parseTags,
    isFilterActive,
} from "../utils/filter-tasks";

interface Props {
    columns: ColumnWithTasksAndSubtasks[];
    filter: KanbanFilterState;
    onFilterChange: (filter: KanbanFilterState) => void;
    currentUserId?: number;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; dotClass: string }[] = [
    { value: "urgent", label: "Срочный", dotClass: "bg-red-500" },
    { value: "high", label: "Высокий", dotClass: "bg-orange-500" },
    { value: "medium", label: "Средний", dotClass: "bg-yellow-500" },
    { value: "low", label: "Низкий", dotClass: "bg-green-500" },
    { value: "default", label: "Обычный", dotClass: "bg-gray-400" },
];

const formatMemberName = (m: ProjectMember) =>
    `${m.firstName} ${m.lastName}`.trim() || m.email || `#${m.id}`;

const getInitials = (m: ProjectMember) =>
    `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase() || "?";

export const KanbanFilter: React.FC<Props> = ({
    columns,
    filter,
    onFilterChange,
    currentUserId,
}) => {
    const [open, setOpen] = useState(false);

    // Агрегируем доступные опции из текущих задач
    const { assignees, authors, tags } = useMemo(() => {
        const assigneesMap = new Map<number, ProjectMember>();
        const authorsMap = new Map<number, ProjectMember>();
        const tagsSet = new Set<string>();

        for (const column of columns) {
            for (const task of column.tasks || []) {
                for (const a of task.assignees || []) {
                    assigneesMap.set(a.id, a);
                }
                if (task.createdBy) {
                    authorsMap.set(task.createdBy.id, task.createdBy);
                }
                parseTags(task.tags).forEach((t) => tagsSet.add(t));
            }
        }

        return {
            assignees: [...assigneesMap.values()].sort((a, b) =>
                formatMemberName(a).localeCompare(formatMemberName(b), "ru"),
            ),
            authors: [...authorsMap.values()].sort((a, b) =>
                formatMemberName(a).localeCompare(formatMemberName(b), "ru"),
            ),
            tags: [...tagsSet].sort((a, b) => a.localeCompare(b, "ru")),
        };
    }, [columns]);

    const active = isFilterActive(filter);

    // Количество активных категорий для бейджа на кнопке
    const activeCriteriaCount = [
        filter.mine,
        filter.assigneeIds.length > 0,
        filter.priorities.length > 0,
        filter.tags.length > 0,
        filter.authorIds.length > 0,
    ].filter(Boolean).length;

    // Метка кнопки
    const label = useMemo(() => {
        if (!active) return "Все задачи";
        if (activeCriteriaCount === 1) {
            if (filter.mine) return "Мои задачи";
            if (filter.assigneeIds.length > 0)
                return `Ответственные · ${filter.assigneeIds.length}`;
            if (filter.priorities.length > 0) return `Приоритет · ${filter.priorities.length}`;
            if (filter.tags.length > 0) return `Теги · ${filter.tags.length}`;
            if (filter.authorIds.length > 0) return `Авторы · ${filter.authorIds.length}`;
        }
        return `Фильтр · ${activeCriteriaCount}`;
    }, [filter, active, activeCriteriaCount]);

    // Переключение значения в массиве — независимо между категориями
    const toggleInSet = <T,>(
        key: "assigneeIds" | "priorities" | "tags" | "authorIds",
        currentValues: T[],
        value: T,
    ) => {
        const next = currentValues.includes(value)
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value];
        onFilterChange({ ...filter, [key]: next });
    };

    // Бейдж с количеством выбранных в sub-menu
    const badge = (n: number) =>
        n > 0 ? (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700">
                {n}
            </span>
        ) : null;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        "min-w-[160px]",
                        active
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-gray-200 text-black hover:bg-gray-300",
                    )}
                    aria-label="Фильтр задач"
                >
                    <div className="flex items-center gap-2">
                        <ListFilter className="h-4 w-4 flex-shrink-0" />
                        <span>{label}</span>
                    </div>
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                            open && "rotate-180",
                        )}
                    />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[160px] rounded-xl border-gray-300">
                {/* Все задачи — сбрасывает все фильтры */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        onFilterChange(defaultFilterState);
                    }}
                    className="flex cursor-pointer items-center justify-between"
                >
                    <span>Все задачи</span>
                    {!active && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>

                {/* Мои задачи */}
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        onFilterChange({ ...filter, mine: !filter.mine });
                    }}
                    disabled={!currentUserId}
                    className="flex cursor-pointer items-center justify-between"
                >
                    <span>Мои задачи</span>
                    {filter.mine && <Check className="h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>

                {/* Ответственные */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(
                            filter.assigneeIds.length > 0 && "bg-accent",
                            assignees.length === 0 && "pointer-events-none opacity-50",
                        )}
                    >
                        <span>Ответственные</span>
                        {badge(filter.assigneeIds.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[320px] w-[220px] overflow-y-auto">
                            {assignees.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                                    Нет ответственных
                                </DropdownMenuLabel>
                            ) : (
                                assignees.map((m) => (
                                    <DropdownMenuItem
                                        key={m.id}
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleInSet("assigneeIds", filter.assigneeIds, m.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                                                {getInitials(m)}
                                            </div>
                                            <span className="truncate">{formatMemberName(m)}</span>
                                        </div>
                                        {filter.assigneeIds.includes(m.id) && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Приоритет */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(filter.priorities.length > 0 && "bg-accent")}
                    >
                        <span>Приоритет</span>
                        {badge(filter.priorities.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent forceMount className="w-[160px]">
                            {PRIORITY_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() =>
                                        toggleInSet("priorities", filter.priorities, opt.value)
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn("h-2.5 w-2.5 rounded-full", opt.dotClass)}
                                        />
                                        <span>{opt.label}</span>
                                    </div>
                                    {filter.priorities.includes(opt.value) && (
                                        <Check className="h-4 w-4" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Теги */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(
                            filter.tags.length > 0 && "bg-accent",
                            tags.length === 0 && "pointer-events-none opacity-50",
                        )}
                    >
                        <span>Теги</span>
                        {badge(filter.tags.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[320px] w-[0px] overflow-y-auto">
                            {tags.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                                    Нет тегов
                                </DropdownMenuLabel>
                            ) : (
                                tags.map((tag) => (
                                    <DropdownMenuItem
                                        key={tag}
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleInSet("tags", filter.tags, tag)}
                                    >
                                        <span className="truncate">{tag}</span>
                                        {filter.tags.includes(tag) && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Авторы */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(
                            filter.authorIds.length > 0 && "bg-accent",
                            authors.length === 0 && "pointer-events-none opacity-50",
                        )}
                    >
                        <span>Авторы</span>
                        {badge(filter.authorIds.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[320px] w-[220px] overflow-y-auto">
                            {authors.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                                    Нет авторов
                                </DropdownMenuLabel>
                            ) : (
                                authors.map((m) => (
                                    <DropdownMenuItem
                                        key={m.id}
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleInSet("authorIds", filter.authorIds, m.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                                                {getInitials(m)}
                                            </div>
                                            <span className="truncate">{formatMemberName(m)}</span>
                                        </div>
                                        {filter.authorIds.includes(m.id) && <Check className="h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Сброс — только когда фильтр активен */}
                {active && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onFilterChange(defaultFilterState)}
                            className="cursor-pointer text-red-600 focus:text-red-600 p-1"
                        >
                            <X className="h-4 w-4" />
                            <span>Отменить</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default KanbanFilter;
