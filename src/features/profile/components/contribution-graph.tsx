import { useMemo } from "react";
import type { ActivityDay } from "@/types/activity";

const COLORS = ["#EBEDF0", "#9BE9A8", "#40C463", "#30A14E", "#216E39"];

/** Заливка дней, которые ещё не наступили: светлее нулевого уровня. */
const FUTURE_COLOR = "#F6F7F9";

const WEEK_DOW_LABEL = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
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
/** Минимум колонок, который месяц должен занимать, чтобы быть подписанным. */
const MIN_MONTH_COLS = 2;
/** Длина скользящего окна профиля: 52 недели, как в GitHub. */
const ROLLING_DAYS = 364;
const DAY_MS = 86_400_000;

/**
 * Окно графика.
 * - `rolling` — последние 12 месяцев (профиль по умолчанию);
 * - `year` — календарный год 01.01–31.12 (выбор года в сайдбаре);
 * - `from` — год от указанной даты (проект: от дня создания).
 */
export type GraphMode =
    | { kind: "rolling" }
    | { kind: "year"; year: number }
    | { kind: "from"; start: string };

type GraphDay = {
    key: string;
    count: number;
    level: number;
    /** День после сегодняшнего: активности быть ещё не могло. */
    isFuture: boolean;
    /** День до начала окна (до регистрации / создания проекта / 1 января). */
    isBeforeWindow: boolean;
    /** День после конца окна (для календарного года — следующий год). */
    isAfterWindow: boolean;
};

type Graph = {
    weeks: GraphDay[][];
    months: { label: string; col: number }[];
    /** Сумма только по дням внутри окна: `summary` может быть длиннее окна. */
    total: number;
    /** Динамическая первая дата активности, "YYYY-MM-DD"; null — неизвестна. */
    firstAt: string | null;
    /** Границы окна, "YYYY-MM-DD" — для подписи диапазона. */
    windowStart: string;
    windowEnd: string;
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
 * Понедельник недели, в которую попадает `date`. Колонка графика — неделя,
 * и всегда начинается с понедельника: иначе строки съезжают на день и
 * подписи «Пн…Вс» перестают совпадать с ячейками.
 */
export function mondayOf(date: Date): Date {
    const shift = (date.getUTCDay() + WEEK_DAYS - 1) % WEEK_DAYS;
    return new Date(date.getTime() - shift * DAY_MS);
}

/** Воскресенье недели, в которую попадает `date`. */
export function sundayOf(date: Date): Date {
    const shift = (WEEK_DAYS - date.getUTCDay()) % WEEK_DAYS;
    return new Date(date.getTime() + shift * DAY_MS);
}

/**
 * Границы окна в зависимости от режима.
 *
 * Год от даты (`from`): если дата неразборчива, откатываемся к скользящему
 * окну — график не должен исчезать из-за битого `since`.
 */
export function resolveWindow(mode: GraphMode, now = new Date()): { start: Date; end: Date } {
    const today = startOfUtcDay(now);
    if (mode.kind === "year") {
        return {
            start: new Date(Date.UTC(mode.year, 0, 1)),
            end: new Date(Date.UTC(mode.year, 11, 31)),
        };
    }
    if (mode.kind === "from") {
        const start = parseDay(mode.start);
        if (start) {
            const end = new Date(start);
            end.setUTCFullYear(end.getUTCFullYear() + 1);
            return { start, end: new Date(end.getTime() - DAY_MS) };
        }
    }
    return { start: new Date(today.getTime() - ROLLING_DAYS * DAY_MS), end: today };
}

/**
 * Метки дней недели для строк сетки. Сетка начинается с понедельника, так что
 * разворот тут вырождается в константу — функция остаётся, потому что
 * привязывает «строка → день недели» к самому факту старта, а не к magic
 * array в JSX.
 */
export function weekdayLabels(gridStart: Date): string[] {
    const startDow = gridStart.getUTCDay();
    return Array.from({ length: WEEK_DAYS }, (_, i) => WEEK_DOW_LABEL[(startDow + i) % WEEK_DAYS]);
}

/** Динамическая первая дата — как прислал бэкенд, без выравнивания по неделе. */
export function resolveFirstAt(since: string | null, today: Date): string | null {
    const parsed = since ? parseDay(since) : null;
    return parsed && parsed <= today ? toKey(parsed) : null;
}

/** Сумма действий внутри окна — для подписи заголовка рядом с графиком. */
export function sumInWindow(
    summary: ActivityDay[],
    mode: GraphMode = { kind: "rolling" },
    now = new Date(),
): number {
    const window = resolveWindow(mode, now);
    const start = toKey(window.start);
    const end = toKey(window.end);
    const today = toKey(startOfUtcDay(now));
    return summary.reduce(
        (acc, day) =>
            acc + (day.date >= start && day.date <= end && day.date <= today ? day.count : 0),
        0,
    );
}

export function buildGraph(
    summary: ActivityDay[],
    since: string | null,
    now = new Date(),
    mode: GraphMode = { kind: "rolling" },
): Graph {
    const counts = new Map(summary.map((d) => [d.date, d.count]));
    const today = startOfUtcDay(now);
    const window = resolveWindow(mode, today);
    // Сетка всегда целое число недель: от понедельника недели начала окна до
    // воскресенья недели его конца. Дни соседних недель за пределами окна
    // рисуются пустыми, чтобы полоса не выглядела обрезанной.
    const gridStart = mondayOf(window.start);
    const gridEnd = sundayOf(window.end);
    // Динамическая первая дата — для подписи «Активность с …».
    const firstAt = resolveFirstAt(since, today);

    const days: GraphDay[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
        const key = toKey(cursor);
        const isBeforeWindow = cursor < window.start;
        const isAfterWindow = cursor > window.end;
        const isFuture = cursor > today;
        // До окна и после него данных быть не может — принудительно обнуляем,
        // чтобы подпись диапазона не расходилась с картинкой.
        const isOutside = isBeforeWindow || isAfterWindow || isFuture;
        days.push({
            key,
            count: isOutside ? 0 : (counts.get(key) ?? 0),
            level: 0,
            isFuture,
            isBeforeWindow,
            isAfterWindow,
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
    // Месяц подписываем, только если он занимает хотя бы пару колонок. На
    // границе окна месяц может лежать единственным днём — подпись над одной
    // колонкой ничего не сообщает и только шумит.
    const visibleMonths = months.filter(
        (m, i) => (months[i + 1]?.col ?? weeks.length) - m.col >= MIN_MONTH_COLS,
    );

    return {
        weeks,
        months: visibleMonths,
        total: days.reduce((acc, d) => acc + d.count, 0),
        firstAt,
        windowStart: toKey(window.start),
        windowEnd: toKey(window.end),
        weekdays: weekdayLabels(gridStart),
    };
}

const ROLLING_MODE: GraphMode = { kind: "rolling" };

export function ContributionGraph({
    summary,
    since,
    loading,
    onDayClick,
    selectedDay,
    mode = ROLLING_MODE,
}: {
    summary: ActivityDay[];
    since: string | null;
    loading: boolean;
    /** Клик по дню: показывает в ленте действия этого дня. */
    onDayClick?: (day: string) => void;
    /** Подсвеченный день — равен выбранному в ленте. */
    selectedDay?: string | null;
    /** Окно графика; по умолчанию последние 12 месяцев. */
    mode?: GraphMode;
}) {
    const { weeks, months, total, firstAt, windowStart, windowEnd, weekdays } = useMemo(
        () => buildGraph(summary, since, new Date(), mode),
        [summary, since, mode],
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
                                // могла быть: до начала окна фильтр бессмыслен,
                                // в будущем его и подавно.
                                const clickable =
                                    Boolean(onDayClick) &&
                                    !day.isBeforeWindow &&
                                    !day.isAfterWindow &&
                                    !day.isFuture;
                                const isSelected = selectedDay === day.key;
                                return (
                                    <button
                                        type="button"
                                        key={day.key}
                                        disabled={!clickable}
                                        onClick={() => clickable && onDayClick?.(day.key)}
                                        aria-pressed={isSelected}
                                        title={
                                            day.isFuture
                                                ? `Ещё не наступило · ${day.key}`
                                                : day.isAfterWindow
                                                  ? `Вне выбранного окна · ${day.key}`
                                                  : day.isBeforeWindow
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
                                        style={{
                                            backgroundColor:
                                                day.isBeforeWindow || day.isAfterWindow
                                                    ? "transparent"
                                                    : day.isFuture
                                                      ? FUTURE_COLOR
                                                      : COLORS[day.level],
                                        }}
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
                <span className="ml-2 whitespace-nowrap">Будущее</span>
                <div
                    className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: FUTURE_COLOR }}
                />
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
                {mode.kind !== "rolling" && (
                    <span className="ml-2 text-gray-400 whitespace-nowrap">
                        Окно: {formatDay(windowStart)} – {formatDay(windowEnd)}
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
