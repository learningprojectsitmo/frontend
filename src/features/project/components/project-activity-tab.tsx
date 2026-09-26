import { useState } from "react";
import { ActivityFeed } from "@/features/profile/components/activity-feed";
import { ActivityPagination } from "@/features/profile/components/activity-pagination";
import { ContributionGraph } from "@/features/profile/components/contribution-graph";
import { ActivityDayFilter } from "@/features/profile/components/activity-day-filter";
import { ACTIVITY_PAGE_SIZE, useProjectActivity } from "@/features/profile/api/use-activity";

export function ProjectActivityTab({ projectId }: { projectId: number }) {
    const [page, setPage] = useState(1);
    const [day, setDay] = useState<string | null>(null);
    const { data, isLoading, isError, error } = useProjectActivity(
        projectId,
        page,
        ACTIVITY_PAGE_SIZE,
        day,
    );

    const totalPages = data?.total_pages ?? 0;

    const selectDay = (next: string) => {
        setDay((current) => (current === next ? null : next));
        setPage(1);
    };

    return (
        <div className="space-y-5">
            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Активность по дням</h2>
                <ContributionGraph
                    // summary считается по всему проекту, а не по странице
                    // ленты, поэтому пагинация на график не влияет.
                    summary={data?.summary ?? []}
                    since={data?.since ?? null}
                    loading={isLoading}
                    onDayClick={selectDay}
                    selectedDay={day}
                />
            </div>

            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
                    <h2 className="text-[16px] font-semibold text-gray-900">История активности</h2>
                    {data && data.total > 0 && (
                        <span className="text-[13px] text-gray-400">
                            {data.total} {pluralize(data.total)}
                        </span>
                    )}
                </div>

                {isError ? (
                    <div className="text-center py-10 text-[14px] text-red-500">
                        {error instanceof Error
                            ? error.message
                            : "Не удалось загрузить историю активности"}
                    </div>
                ) : (
                    <>
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
                            showActors
                            emptyMessage={
                                day
                                    ? "В этот день в проекте ничего не происходило"
                                    : "В проекте пока не было активности"
                            }
                        />
                        <ActivityPagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </>
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
