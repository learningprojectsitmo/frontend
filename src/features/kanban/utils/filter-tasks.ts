import type {
    ColumnWithTasksAndSubtasks,
    TaskPriority,
    TaskWithSubtasks,
} from "@/types/tables/forTables";

export type FilterMode = "all" | "mine" | "assignee" | "priority" | "tag" | "author";

export interface KanbanFilterState {
    mode: FilterMode;
    assigneeIds: number[];
    priorities: TaskPriority[];
    tags: string[];
    authorIds: number[];
}

export const defaultFilterState: KanbanFilterState = {
    mode: "all",
    assigneeIds: [],
    priorities: [],
    tags: [],
    authorIds: [],
};

// Разбор строки тегов "a, b, c" → ["a", "b", "c"] без пустых
export const parseTags = (raw?: string): string[] =>
    raw
        ? raw
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
        : [];

// Проверка, соответствует ли задача фильтру
const matchesTask = (
    task: TaskWithSubtasks,
    filter: KanbanFilterState,
    currentUserId?: number,
): boolean => {
    switch (filter.mode) {
        case "all":
            return true;
        case "mine":
            return currentUserId
                ? task.assignees.some((a) => a.id === currentUserId)
                : true;
        case "assignee":
            if (filter.assigneeIds.length === 0) return true;
            return task.assignees.some((a) => filter.assigneeIds.includes(a.id));
        case "priority":
            if (filter.priorities.length === 0) return true;
            return !!task.priority && filter.priorities.includes(task.priority);
        case "tag": {
            if (filter.tags.length === 0) return true;
            const tags = parseTags(task.tags);
            return filter.tags.some((t) => tags.includes(t));
        }
        case "author": {
            if (filter.authorIds.length === 0) return true;
            const authorId = task.createdBy?.id ?? task.createdById;
            return filter.authorIds.includes(authorId);
        }
        default:
            return true;
    }
};

// Фильтрация колонок — возвращает те же колонки, но с отфильтрованными задачами
export const filterColumns = (
    columns: ColumnWithTasksAndSubtasks[],
    filter: KanbanFilterState,
    currentUserId?: number,
): ColumnWithTasksAndSubtasks[] => {
    if (filter.mode === "all") return columns;
    return columns.map((column) => ({
        ...column,
        tasks: (column.tasks || []).filter((task) => matchesTask(task, filter, currentUserId)),
    }));
};

// Проверка, что фильтр неактивен (дефолтное состояние)
export const isFilterActive = (filter: KanbanFilterState): boolean => filter.mode !== "all";
