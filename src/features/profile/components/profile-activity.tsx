import { useActivity } from "@/features/profile/api/use-activity";
import { ContributionGraph } from "./contribution-graph";
import { ActivityFeed } from "./activity-feed";

export function ProfileActivity() {
    const { data, isLoading } = useActivity();

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900">
                    Вклад за последний год
                    {data && data.total > 0 && (
                        <span className="ml-2 text-[13px] font-normal text-gray-400">
                            {data.total} {pluralize(data.total)}
                        </span>
                    )}
                </h2>
                <div className="mt-4">
                    <ContributionGraph summary={data?.summary ?? []} loading={isLoading} />
                </div>
            </div>

            <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5">
                <h2 className="text-[16px] font-semibold text-gray-900 mb-4">Последние действия</h2>
                <ActivityFeed items={data?.items ?? []} loading={isLoading} />
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
