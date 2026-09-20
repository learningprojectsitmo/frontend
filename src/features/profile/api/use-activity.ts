import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ActivityResponse } from "@/types/activity";

const ACTIVITY_PAGE_SIZE = 10;

export function useActivityFor(
    userId: number | null | undefined,
    page = 1,
    limit = ACTIVITY_PAGE_SIZE,
) {
    const path = userId ? `/profile/${userId}/activity` : "/profile/activity";
    return useQuery({
        queryKey: userId
            ? ["profile", "public", String(userId), "activity", page, limit]
            : ["profile", "activity", page, limit],
        queryFn: async () => {
            const data: ActivityResponse = await api.get(path, {
                params: { page, limit },
            });
            return data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
}
