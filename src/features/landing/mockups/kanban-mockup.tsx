import { useTranslation } from "react-i18next";
import { ChevronDown, GripVertical, ListFilter, MoreHorizontal, Plus } from "lucide-react";

import { KanbanTask } from "@/features/kanban/components/task";
import { columnColors } from "@/features/kanban/utils/column-styles";
import type { Task, TaskPriority } from "@/types/tables/forTables";
import { cn } from "@/lib/utils";

import { AppWindowMockup } from "./app-window-mockup";

type MockTask = {
    title: string;
    priority: TaskPriority;
    /** Через сколько дней дедлайн. Отрицательное — просрочено; не задан — дедлайна нет. */
    dueInDays?: number;
    tags?: string[];
    people?: string[];
    subtasks?: { title: string; done: boolean }[];
};

type MockColumn = {
    name: string;
    color: string;
    tasks: MockTask[];
};

type KanbanMock = {
    breadcrumb: string;
    columnsCount: string;
    filterLabel: string;
    quickAdd: string;
    addColumn: string;
    columns: MockColumn[];
};

const MEMBER_ID_BASE = 100;
const TASK_ID_BASE = 1000;

/** Дедлайн через `days` дней от сегодня — чтобы подпись «N дн.» была живой, как в приложении. */
const dueDateFrom = (days: number): string => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

const buildTask = (task: MockTask, columnId: number, position: number): Task => ({
    id: TASK_ID_BASE + columnId * 10 + position,
    title: task.title,
    priority: task.priority,
    position,
    columnId,
    projectId: 1,
    createdById: MEMBER_ID_BASE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignees: (task.people ?? []).map((name, index) => ({
        id: MEMBER_ID_BASE + index,
        firstName: name,
        lastName: "",
    })),
    ...(typeof task.dueInDays === "number" ? { dueDate: dueDateFrom(task.dueInDays) } : {}),
    ...(task.tags?.length ? { tags: task.tags.join(", ") } : {}),
    // Больше трёх подзадач не показываем: в приложении надпись «+ ещё N» не переведена.
    ...(task.subtasks?.length
        ? {
              subtasks: task.subtasks.slice(0, 3).map((subtask, index) => ({
                  id: index,
                  taskId: TASK_ID_BASE + columnId * 10 + position,
                  title: subtask.title,
                  isCompleted: subtask.done,
                  position: index,
                  createdById: MEMBER_ID_BASE,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
              })),
          }
        : {}),
});

/**
 * Мокап канбан-доски проекта. Карточки — настоящий `KanbanTask`, цвета колонок —
 * из реальной `column-styles`. Шапка колонки, быстрое добавление задачи и фон
 * повторяют `column.tsx` и `kanban.tsx`; WIP-лимит в интерфейсе не показывается.
 */
export const KanbanMockup = () => {
    const { t } = useTranslation();

    const board = t("landing.mockup.kanban", { returnObjects: true }) as unknown as KanbanMock;

    return (
        <AppWindowMockup url="eduflow.app/app/project" label={t("landing.features.kanbanLabel")}>
            <div className="p-3 sm:p-5">
                <p className="text-[10px] text-gray-400">{board.breadcrumb}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[12px] text-gray-500">
                        {t("landing.mockup.kanban.columnsCount", { count: board.columns.length })}
                    </p>
                    <span className="inline-flex min-w-[150px] items-center justify-between gap-2 rounded-xl bg-app-ghost px-3 py-2 text-[12px] font-medium text-gray-900">
                        <span className="flex items-center gap-2">
                            <ListFilter size={14} className="shrink-0" />
                            {board.filterLabel}
                        </span>
                        <ChevronDown size={14} className="shrink-0" />
                    </span>
                </div>
            </div>

            <div className="bg-[hsl(216,22%,95%)] bg-[radial-gradient(#e5e7eb_2px,transparent_1px)] [background-size:16px_16px] p-3 sm:p-5 dark:bg-[#0b1226] dark:bg-[radial-gradient(#2a3448_2px,transparent_1px)]">
                <div className="overflow-x-auto">
                    <div className="flex min-w-[860px] gap-3">
                        {board.columns.map((column, columnIndex) => {
                            const colorStyle =
                                columnColors[column.color as keyof typeof columnColors];
                            const columnId = columnIndex + 1;

                            return (
                                <div
                                    key={column.name}
                                    className={cn(
                                        "flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border shadow-sm",
                                        colorStyle?.bg,
                                    )}
                                >
                                    {/* Шапка колонки — как в column.tsx */}
                                    <div
                                        className={cn(
                                            "flex items-center justify-between px-2 py-2.5",
                                            colorStyle?.header,
                                        )}
                                    >
                                        <div className="flex min-w-0 items-center gap-1">
                                            <GripVertical
                                                className={cn("h-4 w-4 shrink-0", colorStyle?.text)}
                                            />
                                            <h3
                                                className={cn(
                                                    "truncate pr-1 text-sm font-semibold",
                                                    colorStyle?.text,
                                                )}
                                            >
                                                {column.name}
                                            </h3>
                                            <span className="shrink-0 rounded-full bg-app-surface/50 px-1.5 py-0.5 text-xs text-gray-500">
                                                {column.tasks.length}
                                            </span>
                                        </div>
                                        <MoreHorizontal
                                            className={cn("h-4 w-4 shrink-0", colorStyle?.text)}
                                        />
                                    </div>

                                    {/* Быстрое добавление задачи */}
                                    <div className="px-3 pb-1.5 pt-3">
                                        <div className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-app-surface px-2">
                                            <span className="min-w-0 flex-1 truncate text-[11px] text-gray-400">
                                                {board.quickAdd}
                                            </span>
                                            <Plus className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2.5 p-2.5">
                                        {column.tasks.map((task, position) => (
                                            <KanbanTask
                                                key={task.title}
                                                task={buildTask(task, columnId, position)}
                                                canEdit
                                                formatDueLabel={(days) =>
                                                    t("landing.mockup.daysLeft", { count: days })
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex w-[260px] shrink-0 items-start">
                            <span className="inline-flex w-full items-center justify-between rounded-xl border border-gray-200 bg-app-surface px-3 py-2 text-[12px] font-medium text-gray-900">
                                {board.addColumn}
                                <Plus size={14} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppWindowMockup>
    );
};
