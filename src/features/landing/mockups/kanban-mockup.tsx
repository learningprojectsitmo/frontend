import { useTranslation } from "react-i18next";
import { ListFilter } from "lucide-react";

import { KanbanTask } from "@/features/kanban/components/task";
import { columnColors } from "@/features/kanban/utils/column-styles";
import type { Task, TaskPriority } from "@/types/tables/forTables";
import { cn } from "@/lib/utils";

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
    /** Лимит WIP; null — не задан. */
    wip: number | null;
    tasks: MockTask[];
};

type BoardMock = {
    project: string;
    stage: string;
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
 * Иллюстрация канбан-доски одного проекта (не сводка по портфелю — такой в
 * продукте нет). Карточки — настоящий `KanbanTask`, а цвета колонок берутся из
 * реальной `column-styles`, поэтому мокап не может разойтись с интерфейсом.
 *
 * Сама колонка в приложении жёстко задана как `h-[70vh] w-[260px]`, поэтому в
 * мокапе воспроизведена только её оболочка (шапка, счётчик, WIP), а карточки
 * взяты настоящие: так текст остаётся чётким, без CSS-масштабирования.
 */
export const KanbanMockup = () => {
    const { t } = useTranslation();

    const board = t("landing.mockup.board", { returnObjects: true }) as unknown as BoardMock;

    return (
        <div
            role="img"
            aria-label={t("landing.features.kanbanLabel")}
            className="pointer-events-none w-full select-none overflow-hidden rounded-2xl border border-gray-200 bg-app-surface shadow-xl shadow-gray-900/5"
        >
            {/* Шапка доски: название проекта и фильтр — как в board.tsx */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                <p className="truncate text-xs font-semibold text-gray-900">
                    {board.project}
                    <span className="font-normal text-gray-400"> · {board.stage}</span>
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                    <ListFilter size={13} className="text-gray-400" />
                    {t("landing.mockup.boardFilter")}
                </span>
            </div>

            {/* На узких экранах доска не сжимается в нечитаемые 70px, а
                прокручивается внутри мокапа — иначе ломает всю страницу. */}
            <div className="overflow-x-auto">
                <div className="flex min-w-[420px] gap-3 p-4">
                    {board.columns.map((column, columnIndex) => {
                        const colorStyle = columnColors[column.color as keyof typeof columnColors];
                        const columnId = columnIndex + 1;

                        return (
                            <div
                                key={column.name}
                                className={cn(
                                    "flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border shadow-sm",
                                    colorStyle?.bg,
                                )}
                            >
                                {/* Шапка колонки — как в column.tsx */}
                                <div
                                    className={cn(
                                        "flex shrink-0 items-center gap-1 px-2.5 py-2.5",
                                        colorStyle?.header,
                                    )}
                                >
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
                                    {column.wip !== null ? (
                                        <span className="ml-auto shrink-0 text-[10px] tabular-nums text-gray-500">
                                            {t("landing.mockup.wip", {
                                                current: column.tasks.length,
                                                limit: column.wip,
                                            })}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex flex-col gap-2.5 p-2.5">
                                    {column.tasks.map((task, position) => (
                                        <KanbanTask
                                            key={task.title}
                                            task={buildTask(task, columnId, position)}
                                            formatDueLabel={(days) =>
                                                t("landing.mockup.daysLeft", { count: days })
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
