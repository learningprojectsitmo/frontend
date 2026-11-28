import { useMemo, useState } from "react";
import { ACTIVITY_PAGE_SIZE, useActivityFor } from "@/features/profile/api/use-activity";
import { ActivityDayFilter } from "@/features/profile/components/activity-day-filter";
import { ActivityFeed } from "@/features/profile/components/activity-feed";
import { ActivityPagination } from "@/features/profile/components/activity-pagination";
import { ActivityYearSelector } from "@/features/profile/components/activity-year-selector";
import { ContributionGraph, sumInWindow, type GraphMode } from "./contribution-graph";

export function ProfileActivity({ userId }: { userId?: number | null }) {
    const [page, setPage] = useState(1);
    const [day, setDay] = useState<string | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const { data, isLoading } = useActivityFor(userId, page, ACTIVITY_PAGE_SIZE, day, year);

    const totalPages = data?.total_pages ?? 0;

    // Клик по дню всегда возвращает ленту на первую страницу: на второй
    // выбранного дня может не оказаться, и лента выглядела бы пустой.
    const selectDay = (next: string) => {
        setDay((current) => (current === next ? null : next));
        setPage(1);
    };

    // Смена года сбрасывает день и страницу: лента теперь относится к другому
    // году, и старый фильтр по дню в нём бессмыслен.
    const selectYear = (next: number | null) => {
        setYear(next);
        setDay(null);
        setPage(1);
    };

    const mode = useMemo<GraphMode>(
        () => (year === null ? { kind: "rolling" } : { kind: "year", year }),
        [year],
    );

    // Счётчик в заголовке — по тому же окну, что нарисовано, иначе цифра
    // расходилась бы с картинкой (у ленты свой total по выбранному году).
    const windowTotal = useMemo(
        () => sumInWindow(data?.summary ?? [], mode),
        [data?.summary, mode],
    );

    const years = useMemo(() => {
        const current = new Date().getUTCFullYear();
        if (!data?.since) return [current];
        const start = Number(data.since.slice(0, 4));
        if (!Number.isFinite(start) || start > current) return [current];
        return Array.from({ length: current - start + 1 }, (_, i) => start + i);
    }, [data?.since]);

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900">
                    {year === null ? "Вклад за последние 12 месяцев" : `Вклад за ${year} год`}
                    {windowTotal > 0 && (
                        <span className="ml-2 text-[13px] font-normal text-gray-400 whitespace-nowrap">
                            {windowTotal} {pluralize(windowTotal)}
                        </span>
                    )}
                </h2>
                <div className="mt-1 text-[12px] text-gray-400">
                    {year === null
                        ? data?.since
                            ? `Аккаунт с ${formatDay(data.since)}`
                            : null
                        : `01.01.${year} – 31.12.${year}`}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <ContributionGraph
                            summary={data?.summary ?? []}
                            since={data?.since ?? null}
                            loading={isLoading}
                            onDayClick={selectDay}
                            selectedDay={day}
                            mode={mode}
                        />
                    </div>
                    <div className="order-first sm:order-last">
                        <ActivityYearSelector years={years} value={year} onChange={selectYear} />
                    </div>
                </div>
            </div>

            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
                    Последние действия{year !== null ? ` за ${year} год` : ""}
                </h2>
                {day && (
                    <ActivityDayFilter
                        day={day}
                        total={data?.total ?? 0}
                        onClear={() => {
                            setDay(null);
                            setPage(1);
                        }}
                    />
                )}
                <ActivityFeed
                    items={data?.items ?? []}
                    loading={isLoading}
                    emptyMessage={
                        day
                            ? "В этот день действий не было"
                            : year !== null
                              ? "В этом году действий не было"
                              : "Активности пока нет"
                    }
                />

                <ActivityPagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </div>
    );
}

function formatDay(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

function pluralize(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return "действие";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20))
        return "действия";
    return "действий";
}
