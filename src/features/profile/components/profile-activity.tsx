import { useState } from "react";
import { useActivity } from "@/features/profile/api/use-activity";
import { ContributionGraph } from "./contribution-graph";
import { ActivityFeed } from "./activity-feed";

export function ProfileActivity() {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useActivity(page);

    const totalPages = data?.total_pages ?? 0;

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

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Назад
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .map((p, idx, arr) => (
                                <span key={p} className="flex items-center">
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span className="px-1 text-gray-400 text-sm">...</span>
                                    )}
                                    <button
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 text-sm font-medium rounded-[8px] transition-colors ${
                                            p === page
                                                ? "bg-[#2563EB] text-white"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                </span>
                            ))}

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Вперёд
                        </button>
                    </div>
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
