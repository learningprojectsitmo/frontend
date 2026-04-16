import React, { useMemo } from "react";
import { ListFilter, Users, Flag, Tag as TagIcon, UserCircle2, X } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuCheckboxItem,
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
    type FilterMode,
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

// Конфигурация приоритетов: порядок + локализованные метки + визуальные индикаторы
const PRIORITY_OPTIONS: {
    value: TaskPriority;
    label: string;
    dotClass: string;
}[] = [
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

    // Метка текущего фильтра для триггер-кнопки
    const label = useMemo(() => {
        switch (filter.mode) {
            case "all":
                return "Все задачи";
            case "mine":
                return "Мои задачи";
            case "assignee":
                return filter.assigneeIds.length > 0
                    ? `Ответственные · ${filter.assigneeIds.length}`
                    : "Ответственные";
            case "priority":
                return filter.priorities.length > 0
                    ? `Приоритет · ${filter.priorities.length}`
                    : "Приоритет";
            case "tag":
                return filter.tags.length > 0 ? `Теги · ${filter.tags.length}` : "Теги";
            case "author":
                return filter.authorIds.length > 0
                    ? `Авторы · ${filter.authorIds.length}`
                    : "Авторы";
        }
    }, [filter]);

    const active = isFilterActive(filter);

    // Смена radio-режима (Все задачи / Мои задачи) — сбрасывает все мультивыборы
    const handleRadioChange = (value: string) => {
        const mode = value as FilterMode;
        if (mode === "all") {
            onFilterChange(defaultFilterState);
        } else if (mode === "mine") {
            onFilterChange({ ...defaultFilterState, mode: "mine" });
        }
    };

    // Переключение элемента в мультивыборе. При первом выборе — устанавливается
    // соответствующий режим; при снятии последнего — возвращаемся к "Все задачи".
    const toggleInSet = <T,>(
        mode: Exclude<FilterMode, "all" | "mine">,
        currentValues: T[],
        value: T,
        key: "assigneeIds" | "priorities" | "tags" | "authorIds",
    ) => {
        const isActive = filter.mode === mode;
        const base = isActive ? currentValues : [];
        const next = base.includes(value) ? base.filter((v) => v !== value) : [...base, value];

        if (next.length === 0) {
            onFilterChange(defaultFilterState);
            return;
        }

        onFilterChange({
            ...defaultFilterState,
            mode,
            [key]: next,
        } as KanbanFilterState);
    };

    const assigneeSelected = filter.mode === "assignee" ? filter.assigneeIds : [];
    const prioritySelected = filter.mode === "priority" ? filter.priorities : [];
    const tagSelected = filter.mode === "tag" ? filter.tags : [];
    const authorSelected = filter.mode === "author" ? filter.authorIds : [];

    // Индикаторы количества выбранных на пунктах sub-menu
    const badge = (n: number) =>
        n > 0 ? (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700">
                {n}
            </span>
        ) : null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                            ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                    )}
                    aria-label="Фильтр задач"
                >
                    <ListFilter className="h-4 w-4" />
                    <span>{label}</span>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[260px]">
                {/* Базовые режимы: Все задачи / Мои задачи */}
                <DropdownMenuRadioGroup
                    value={
                        filter.mode === "all" || filter.mode === "mine" ? filter.mode : ""
                    }
                    onValueChange={handleRadioChange}
                >
                    <DropdownMenuRadioItem value="all">Все задачи</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="mine" disabled={!currentUserId}>
                        Мои задачи
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                {/* Ответственные */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(
                            filter.mode === "assignee" && "bg-accent",
                            assignees.length === 0 && "pointer-events-none opacity-50",
                        )}
                    >
                        <Users className="h-4 w-4" />
                        <span>Ответственные</span>
                        {badge(assigneeSelected.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[320px] w-[240px] overflow-y-auto">
                            {assignees.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                                    Нет ответственных
                                </DropdownMenuLabel>
                            ) : (
                                assignees.map((m) => (
                                    <DropdownMenuCheckboxItem
                                        key={m.id}
                                        checked={assigneeSelected.includes(m.id)}
                                        onSelect={(e) => e.preventDefault()}
                                        onCheckedChange={() =>
                                            toggleInSet(
                                                "assignee",
                                                assigneeSelected,
                                                m.id,
                                                "assigneeIds",
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                                                {getInitials(m)}
                                            </div>
                                            <span className="truncate">{formatMemberName(m)}</span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Приоритет */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(filter.mode === "priority" && "bg-accent")}
                    >
                        <Flag className="h-4 w-4" />
                        <span>Приоритет</span>
                        {badge(prioritySelected.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-[200px]">
                            {PRIORITY_OPTIONS.map((opt) => (
                                <DropdownMenuCheckboxItem
                                    key={opt.value}
                                    checked={prioritySelected.includes(opt.value)}
                                    onSelect={(e) => e.preventDefault()}
                                    onCheckedChange={() =>
                                        toggleInSet(
                                            "priority",
                                            prioritySelected,
                                            opt.value,
                                            "priorities",
                                        )
                                    }
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "h-2.5 w-2.5 rounded-full",
                                                opt.dotClass,
                                            )}
                                        />
                                        <span>{opt.label}</span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Теги */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(
                            filter.mode === "tag" && "bg-accent",
                            tags.length === 0 && "pointer-events-none opacity-50",
                        )}
                    >
                        <TagIcon className="h-4 w-4" />
                        <span>Теги</span>
                        {badge(tagSelected.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[320px] w-[240px] overflow-y-auto">
                            {tags.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                                    Нет тегов
                                </DropdownMenuLabel>
                            ) : (
                                tags.map((tag) => (
                                    <DropdownMenuCheckboxItem
                                        key={tag}
                                        checked={tagSelected.includes(tag)}
                                        onSelect={(e) => e.preventDefault()}
                                        onCheckedChange={() =>
                                            toggleInSet("tag", tagSelected, tag, "tags")
                                        }
                                    >
                                        <span className="truncate">{tag}</span>
                                    </DropdownMenuCheckboxItem>
                                ))
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Авторы */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger
                        className={cn(
                            filter.mode === "author" && "bg-accent",
                            authors.length === 0 && "pointer-events-none opacity-50",
                        )}
                    >
                        <UserCircle2 className="h-4 w-4" />
                        <span>Авторы</span>
                        {badge(authorSelected.length)}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="max-h-[320px] w-[240px] overflow-y-auto">
                            {authors.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-gray-500">
                                    Нет авторов
                                </DropdownMenuLabel>
                            ) : (
                                authors.map((m) => (
                                    <DropdownMenuCheckboxItem
                                        key={m.id}
                                        checked={authorSelected.includes(m.id)}
                                        onSelect={(e) => e.preventDefault()}
                                        onCheckedChange={() =>
                                            toggleInSet(
                                                "author",
                                                authorSelected,
                                                m.id,
                                                "authorIds",
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                                                {getInitials(m)}
                                            </div>
                                            <span className="truncate">{formatMemberName(m)}</span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Сброс фильтра — показываем только если фильтр активен */}
                {active && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onFilterChange(defaultFilterState)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                            <X className="h-4 w-4" />
                            <span>Сбросить фильтр</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default KanbanFilter;
