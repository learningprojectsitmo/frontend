import { useMemo } from "react";
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

function dotColor(kind: string): string {
    if (kind.startsWith("project:")) {
        if (kind.endsWith("DELETE")) return "bg-red-500";
        if (kind.endsWith("INSERT")) return "bg-green-500";
        return "bg-blue-500";
    }
    if (kind.startsWith("resume:")) {
        if (kind.endsWith("DELETE")) return "bg-red-400";
        return "bg-purple-500";
    }
    if (kind.startsWith("response:")) {
        if (kind.endsWith("DELETE")) return "bg-red-400";
        return "bg-teal-500";
    }
    return "bg-gray-500";
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

export function ActivityFeed({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
    const groups = useMemo(() => groupByDay(items), [items]);

    return (
        <div className="flex flex-col gap-4">
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-10 text-[14px] text-gray-500">
                    Пока нет действий — начните откликаться на проекты или создайте резюме
                </div>
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
                                    <span className="flex-1 text-[13px] text-gray-800 leading-snug">
                                        {item.description}
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
