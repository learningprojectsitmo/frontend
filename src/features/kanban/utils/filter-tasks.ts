import type {
    ColumnWithTasksAndSubtasks,
    TaskPriority,
    TaskWithSubtasks,
} from "@/types/tables/forTables";

export interface KanbanFilterState {
    mine: boolean; // Мои задачи
    assigneeIds: number[]; // Ответственные
    priorities: TaskPriority[]; // Приоритет
    tags: string[]; // Теги
    authorIds: number[]; // Авторы
}

export const defaultFilterState: KanbanFilterState = {
    mine: false,
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

// Проверка, что хотя бы один критерий активен
export const isFilterActive = (filter: KanbanFilterState): boolean =>
    filter.mine ||
    filter.assigneeIds.length > 0 ||
    filter.priorities.length > 0 ||
    filter.tags.length > 0 ||
    filter.authorIds.length > 0;

// Проверка соответствия задачи фильтру:
// AND между активными категориями, OR внутри категории
const matchesTask = (
    task: TaskWithSubtasks,
    filter: KanbanFilterState,
    currentUserId?: number,
): boolean => {
    if (filter.mine && currentUserId) {
        if (!task.assignees.some((a) => a.id === currentUserId)) return false;
    }
    if (filter.assigneeIds.length > 0) {
        if (!task.assignees.some((a) => filter.assigneeIds.includes(a.id))) return false;
    }
    if (filter.priorities.length > 0) {
        if (!task.priority || !filter.priorities.includes(task.priority)) return false;
    }
    if (filter.tags.length > 0) {
        const taskTags = parseTags(task.tags);
        if (!filter.tags.some((t) => taskTags.includes(t))) return false;
    }
    if (filter.authorIds.length > 0) {
        const authorId = task.createdBy?.id ?? task.createdById;
        if (!filter.authorIds.includes(authorId)) return false;
    }
    return true;
};

// Фильтрация колонок — возвращает те же колонки, но с отфильтрованными задачами
export const filterColumns = (
    columns: ColumnWithTasksAndSubtasks[],
    filter: KanbanFilterState,
    currentUserId?: number,
): ColumnWithTasksAndSubtasks[] => {
    if (!isFilterActive(filter)) return columns;
    return columns.map((column) => ({
        ...column,
        tasks: (column.tasks || []).filter((task) => matchesTask(task, filter, currentUserId)),
    }));
};
