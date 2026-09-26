import { useMemo } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { ActivityItem } from "@/types/activity";

const MONTHS = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
];

function dayLabel(date: Date): string {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startToday.getTime() - startDay.getTime()) / 86_400_000);

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function timeLabel(date: Date): string {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const ENTITY_COLORS: Record<string, string> = {
    project: "bg-blue-500",
    resume: "bg-purple-500",
    response: "bg-teal-500",
    task: "bg-indigo-500",
    subtask: "bg-indigo-400",
    column: "bg-sky-500",
    stage_transition: "bg-amber-500",
    specification: "bg-emerald-500",
    specification_comment: "bg-emerald-400",
    task_assignee: "bg-orange-500",
    project_participation: "bg-cyan-500",
};

const DELETED = "bg-red-500";

function dotColor(kind: string): string {
    const [entity, action] = kind.split(":");
    if (action === "DELETE") return DELETED;
    return ENTITY_COLORS[entity] ?? "bg-gray-500";
}

type DayGroup = {
    label: string;
    items: ActivityItem[];
};

function groupByDay(items: ActivityItem[]): DayGroup[] {
    const groups: DayGroup[] = [];
    for (const item of items) {
        const date = new Date(item.performed_at);
        const key = date.toDateString();
        const last = groups[groups.length - 1];
        if (last && last.items[0] && new Date(last.items[0].performed_at).toDateString() === key) {
            last.items.push(item);
        } else {
            groups.push({ label: dayLabel(date), items: [item] });
        }
    }
    return groups;
}

export function ActivityFeed({
    items,
    loading,
    showActors = false,
    emptyMessage = "Пока нет действий — начните откликаться на проекты или создайте резюме",
}: {
    items: ActivityItem[];
    loading: boolean;
    /** В ленте проекта показывать, кто именно совершил действие. */
    showActors?: boolean;
    emptyMessage?: string;
}) {
    const groups = useMemo(() => groupByDay(items), [items]);

    return (
        <div className="flex flex-col gap-4">
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-10 text-[14px] text-gray-500">{emptyMessage}</div>
            ) : (
                groups.map((group) => (
                    <div key={group.label} className="flex flex-col gap-1">
                        <div className="text-[12px] font-medium text-gray-400 py-1">
                            {group.label}
                        </div>
                        <div className="flex flex-col divide-y divide-gray-100">
                            {group.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 py-2.5">
                                    <span
                                        className={`shrink-0 w-2 h-2 rounded-full ${dotColor(item.kind)}`}
                                    />
                                    {showActors &&
                                        (item.actor ? (
                                            <Avatar
                                                name={item.actor.name}
                                                className="w-6 h-6 text-[10px]"
                                            />
                                        ) : (
                                            <span
                                                title="Системное действие"
                                                className="shrink-0 w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 text-[10px]"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    className="w-3 h-3"
                                                    aria-hidden
                                                >
                                                    <path d="M12 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v1h6V7a3 3 0 0 0-3-3Z" />
                                                </svg>
                                            </span>
                                        ))}
                                    <span className="flex-1 text-[13px] text-gray-800 leading-snug">
                                        {item.description}
                                        {showActors && item.actor && (
                                            <span className="ml-1.5 text-gray-400">
                                                · {item.actor.name}
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 text-[12px] text-gray-400 tabular-nums">
                                        {timeLabel(new Date(item.performed_at))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
