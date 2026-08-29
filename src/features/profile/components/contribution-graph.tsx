import { useMemo } from "react";
import type { ActivityDay } from "@/types/activity";

const COLORS = ["#EBEDF0", "#9BE9A8", "#40C463", "#30A14E", "#216E39"];

const DAY_LABELS = ["Пн", "", "Ср", "", "Пт", "", "Вс"];
const MONTH_LABELS = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
];

const WEEK_DAYS = 7;
const TOTAL_WEEKS = 53;

type GraphDay = {
    date: Date;
    key: string;
    count: number;
    level: number;
    isFuture: boolean;
};

function toKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildDays(summary: ActivityDay[]): {
    weeks: GraphDay[][];
    months: { label: string; col: number }[];
} {
    const counts = new Map(summary.map((d) => [d.date, d.count]));
    const today = startOfDay(new Date());

    // Начало обзора: 52 недели назад от текущей недели, выровнено по воскресенью
    const start = new Date(today);
    start.setDate(start.getDate() - (TOTAL_WEEKS - 1) * WEEK_DAYS);
    start.setDate(start.getDate() - start.getDay());

    const days: GraphDay[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
        const key = toKey(cursor);
        days.push({
            date: new Date(cursor),
            key,
            count: counts.get(key) ?? 0,
            level: 0,
            isFuture: false,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    const max = Math.max(1, ...days.map((d) => d.count));
    for (const day of days) {
        if (day.count === 0) continue;
        const ratio = day.count / max;
        day.level = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
    }

    const weeks: GraphDay[][] = [];
    for (let i = 0; i < days.length; i += WEEK_DAYS) {
        const week = days.slice(i, i + WEEK_DAYS);
        while (week.length < WEEK_DAYS) {
            week.push({
                date: new Date(0),
                key: "",
                count: 0,
                level: 0,
                isFuture: true,
            });
        }
        weeks.push(week);
    }

    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
        const first = week[0];
        if (first.isFuture) return;
        const month = first.date.getMonth();
        if (month !== lastMonth) {
            months.push({ label: MONTH_LABELS[month], col });
            lastMonth = month;
        }
    });

    return { weeks, months };
}

export function ContributionGraph({
    summary,
    loading,
}: {
    summary: ActivityDay[];
    loading: boolean;
}) {
    const { weeks, months } = useMemo(() => buildDays(summary), [summary]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="hidden sm:flex gap-[2px] pl-7">
                {weeks.map((week, wi) => {
                    const month = months.find((m) => m.col === wi);
                    return (
                        <div
                            key={wi}
                            className="flex-1 min-w-0 overflow-visible text-[10px] leading-none text-gray-400 whitespace-nowrap"
                        >
                            {month ? month.label : ""}
                        </div>
                    );
                })}
            </div>

            <div className="flex">
                {/* Метки дней недели */}
                <div className="hidden sm:flex flex-col gap-[2px] w-7 pr-2">
                    {DAY_LABELS.map((label, i) => (
                        <div key={i} className="flex-1 text-[10px] leading-none text-gray-400">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Ячейки */}
                <div className="flex gap-[2px] flex-1">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[2px] flex-1">
                            {week.map((day) =>
                                day.isFuture ? (
                                    <div key={`${wi}-f`} className="flex-1" />
                                ) : (
                                    <div
                                        key={day.key}
                                        title={
                                            day.count > 0
                                                ? `${day.count} ${pluralize(day.count)} · ${day.key}`
                                                : `Нет действий · ${day.key}`
                                        }
                                        className="flex-1 aspect-square rounded-[2px] cursor-default"
                                        style={{ backgroundColor: COLORS[day.level] }}
                                    />
                                ),
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Легенда */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pl-7">
                <span>Меньше</span>
                {COLORS.map((c) => (
                    <div
                        key={c}
                        className="w-2.5 h-2.5 rounded-[2px]"
                        style={{ backgroundColor: c }}
                    />
                ))}
                <span>Больше</span>
                {summary.length > 0 && (
                    <span className="ml-2 text-gray-500">
                        Всего действий: {summary.reduce((acc, d) => acc + d.count, 0)}
                    </span>
                )}
            </div>
        </div>
    );
}

function pluralize(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return "действие";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20))
        return "действия";
    return "действий";
}
