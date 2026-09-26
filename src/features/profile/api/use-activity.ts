import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { ActivityResponse } from "@/types/activity";

export const ACTIVITY_PAGE_SIZE = 10;

const ACTIVITY_STALE_TIME = 5 * 60 * 1000;
const ACTIVITY_GC_TIME = 10 * 60 * 1000;

export function useActivityFor(
    userId: number | null | undefined,
    page = 1,
    limit = ACTIVITY_PAGE_SIZE,
    day: string | null = null,
) {
    const path = userId ? `/profile/${userId}/activity` : "/profile/activity";
    return useQuery({
        queryKey: userId
            ? [...queryKeys.profile.byIdActivity(userId), page, limit, day]
            : queryKeys.profile.activity(page, limit, day),
        queryFn: async () => {
            const data: ActivityResponse = await api.get(path, {
                params: { page, limit, day: day ?? undefined },
            });
            return data;
        },
        staleTime: ACTIVITY_STALE_TIME,
        gcTime: ACTIVITY_GC_TIME,
        placeholderData: keepPreviousData,
    });
}

export function useProjectActivity(
    projectId: number,
    page = 1,
    limit = ACTIVITY_PAGE_SIZE,
    day: string | null = null,
) {
    return useQuery({
        queryKey: queryKeys.project.activity(projectId, page, limit, day),
        queryFn: async () => {
            const data: ActivityResponse = await api.get(`/projects/${projectId}/activity`, {
                params: { page, limit, day: day ?? undefined },
            });
            return data;
        },
        staleTime: ACTIVITY_STALE_TIME,
        gcTime: ACTIVITY_GC_TIME,
        placeholderData: keepPreviousData,
    });
}
