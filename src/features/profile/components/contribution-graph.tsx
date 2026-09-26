import { useMemo } from "react";
import type { ActivityDay } from "@/types/activity";

const COLORS = ["#EBEDF0", "#9BE9A8", "#40C463", "#30A14E", "#216E39"];

const WEEK_DOW_LABEL = ["Вс", "Пн", "", "Ср", "", "Пт", ""];
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
/** Сколько месяцев назад начинается сетка. */
const MONTHS_BACK = 12;

type GraphDay = {
    key: string;
    count: number;
    level: number;
    isFuture: boolean;
    /** День до динамической первой даты: активности там быть не может. */
    isBeforeWindow: boolean;
};

type Graph = {
    weeks: GraphDay[][];
    months: { label: string; col: number }[];
    /** Сумма только по дням внутри окна: `summary` может быть длиннее окна. */
    total: number;
    /** Динамическая первая дата активности, "YYYY-MM-DD"; null — неизвестна. */
    firstAt: string | null;
    /** Метки дней недели по строкам — зависят от дня начала сетки. */
    weekdays: string[];
};

/**
 * Вся арифметика графика — в UTC: бэкенд агрегирует `summary` по UTC-дате
 * (`performed_at.date()` на tz-aware колонке). Смешивание локальной полночи с
 * UTC-ключом сдвигало бы ячейку на день в TZ вроде UTC+3.
 */
function toKey(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Разбор `YYYY-MM-DD` в UTC-полночь; `null` при негодной дате. */
function parseDay(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, y, m, d] = match;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Начало сетки: 1-е число месяца, на {@link MONTHS_BACK} месяцев раньше
 * текущего. Начинаем с границы месяца, а не «год назад от сегодня», чтобы
 * колонки не съезжали и месяц на подписи совпадал с первым днём сетки.
 */
export function resolveGridStart(today: Date): Date {
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - MONTHS_BACK, 1));
}

/** Метки дней недели для строк сетки — от фактического дня начала. */
export function weekdayLabels(gridStart: Date): string[] {
    const startDow = gridStart.getUTCDay();
    return Array.from({ length: WEEK_DAYS }, (_, i) => WEEK_DOW_LABEL[(startDow + i) % WEEK_DAYS]);
}

/** Динамическая первая дата — как прислал бэкенд, без выравнивания по неделе. */
export function resolveFirstAt(since: string | null, today: Date): string | null {
    const parsed = since ? parseDay(since) : null;
    return parsed && parsed <= today ? toKey(parsed) : null;
}

export function buildGraph(summary: ActivityDay[], since: string | null, now = new Date()): Graph {
    const counts = new Map(summary.map((d) => [d.date, d.count]));
    const today = startOfUtcDay(now);
    // Сетка всегда шириной в год: у аккаунта, который активен два дня, полоса
    // из пяти колонок выглядит как поломка, а не как график. Пустые ячейки
    // слева — норма, а не отсутствие данных.
    const gridStart = resolveGridStart(today);
    // Динамическая первая дата: начало собственного окна активности.
    const firstAt = resolveFirstAt(since, today);
    const windowStart = (firstAt ? parseDay(firstAt) : null) ?? gridStart;

    const days: GraphDay[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= today) {
        const key = toKey(cursor);
        // До первой даты активности данных быть не может — принудительно
        // обнуляем, чтобы подпись «с …» не расходилась с картинкой.
        const isBeforeWindow = cursor < windowStart;
        days.push({
            key,
            count: isBeforeWindow ? 0 : (counts.get(key) ?? 0),
            level: 0,
            isFuture: false,
            isBeforeWindow,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const max = Math.max(1, ...days.map((d) => d.count));
    for (const day of days) {
        if (day.count === 0) continue;
        const ratio = day.count / max;
        day.level = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
    }

    const weeks: GraphDay[][] = [];
    for (let i = 0; i < days.length; i += WEEK_DAYS) {
        weeks.push(days.slice(i, i + WEEK_DAYS));
    }
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
        const first = week[0];
        if (!first) return;
        const date = parseDay(first.key);
        if (!date) return;
        const month = date.getUTCMonth();
        if (month === lastMonth) return;
        lastMonth = month;
        // Год подписываем только в январе — иначе подписи не влезают в 14px.
        const year = month === 0 ? ` ${String(date.getUTCFullYear()).slice(2)}` : "";
        months.push({ label: `${MONTH_LABELS[month]}${year}`, col });
    });

    return {
        weeks,
        months,
        total: days.reduce((acc, d) => acc + d.count, 0),
        firstAt,
        weekdays: weekdayLabels(gridStart),
    };
}

export function ContributionGraph({
    summary,
    since,
    loading,
    onDayClick,
    selectedDay,
}: {
    summary: ActivityDay[];
    since: string | null;
    loading: boolean;
    /** Клик по дню: показывает в ленте действия этого дня. */
    onDayClick?: (day: string) => void;
    /** Подсвеченный день — равен выбранному в ленте. */
    selectedDay?: string | null;
}) {
    const { weeks, months, total, firstAt, weekdays } = useMemo(
        () => buildGraph(summary, since),
        [summary, since],
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 overflow-x-auto">
            <div className="flex gap-[2px] pl-0 sm:pl-7 w-max">
                {weeks.map((_, wi) => {
                    const month = months.find((m) => m.col === wi);
                    return (
                        <div
                            key={wi}
                            className="min-w-[14px] overflow-visible text-[10px] leading-none text-gray-400 whitespace-nowrap"
                        >
                            {month ? month.label : ""}
                        </div>
                    );
                })}
            </div>

            <div className="flex">
                {/* Метки дней недели */}
                <div className="hidden sm:flex flex-col gap-[2px] w-7 pr-2">
                    {weekdays.map((label, i) => (
                        <div key={i} className="flex-1 text-[10px] leading-none text-gray-400">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Ячейки */}
                <div className="flex gap-[2px] w-max">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[2px] min-w-[14px]">
                            {Array.from({ length: WEEK_DAYS }).map((_, di) => {
                                const day = week[di];
                                if (!day) return <div key={`${wi}-p-${di}`} className="flex-1" />;
                                // Кликабельны только дни, где активность уже
                                // могла быть: до первой даты фильтр бессмыслен.
                                const clickable = Boolean(onDayClick) && !day.isBeforeWindow;
                                const isSelected = selectedDay === day.key;
                                return (
                                    <button
                                        type="button"
                                        key={day.key}
                                        disabled={!clickable}
                                        onClick={() => clickable && onDayClick?.(day.key)}
                                        aria-pressed={isSelected}
                                        title={
                                            day.isBeforeWindow
                                                ? `Активность ещё не началась · ${day.key}`
                                                : day.count > 0
                                                  ? `${day.count} ${pluralize(day.count)} · ${day.key}`
                                                  : `Нет действий · ${day.key}`
                                        }
                                        className={
                                            "flex-1 aspect-square rounded-[2px] min-w-[14px] " +
                                            (clickable
                                                ? "cursor-pointer hover:ring-1 hover:ring-[#2563EB]"
                                                : "cursor-default") +
                                            (isSelected ? " ring-2 ring-[#2563EB]" : "")
                                        }
                                        style={{ backgroundColor: COLORS[day.level] }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Легенда */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 pl-0 sm:pl-7">
                <span className="whitespace-nowrap">Меньше</span>
                {COLORS.map((c) => (
                    <div
                        key={c}
                        className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                        style={{ backgroundColor: c }}
                    />
                ))}
                <span className="whitespace-nowrap">Больше</span>
                {total > 0 && (
                    <span className="ml-2 text-gray-500 whitespace-nowrap">
                        Всего действий: {total}
                    </span>
                )}
                {firstAt && (
                    <span className="ml-2 text-gray-400 whitespace-nowrap">
                        Активность с {formatDay(firstAt)}
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

/** "2026-09-26" → "26.09.2026" для подписи под графиком. */
function formatDay(key: string): string {
    const date = parseDay(key);
    if (!date) return key;
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getUTCFullYear()}`;
}
