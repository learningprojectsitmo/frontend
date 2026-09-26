import { useState } from "react";
import { ACTIVITY_PAGE_SIZE, useActivityFor } from "@/features/profile/api/use-activity";
import { ContributionGraph } from "./contribution-graph";
import { ActivityDayFilter } from "./activity-day-filter";
import { ActivityFeed } from "./activity-feed";
import { ActivityPagination } from "./activity-pagination";

export function ProfileActivity({ userId }: { userId?: number | null }) {
    const [page, setPage] = useState(1);
    const [day, setDay] = useState<string | null>(null);
    const { data, isLoading } = useActivityFor(userId, page, ACTIVITY_PAGE_SIZE, day);

    const totalPages = data?.total_pages ?? 0;

    // Клик по дню всегда возвращает ленту на первую страницу: на второй
    // выбранного дня может не оказаться, и лента выглядела бы пустой.
    const selectDay = (next: string) => {
        setDay((current) => (current === next ? null : next));
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900">
                    Вклад с момента регистрации
                    {data && data.total > 0 && (
                        <span className="ml-2 text-[13px] font-normal text-gray-400 whitespace-nowrap">
                            {data.total} {pluralize(data.total)}
                        </span>
                    )}
                </h2>
                {data?.since && (
                    <div className="mt-1 text-[12px] text-gray-400">с {formatDay(data.since)}</div>
                )}
                <div className="mt-4">
                    <ContributionGraph
                        summary={data?.summary ?? []}
                        since={data?.since ?? null}
                        loading={isLoading}
                        onDayClick={selectDay}
                        selectedDay={day}
                    />
                </div>
            </div>

            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Последние действия</h2>
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
                    emptyMessage={day ? "В этот день действий не было" : "Активности пока нет"}
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
