import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ActivityResponse } from "@/types/activity";

const ACTIVITY_PAGE_SIZE = 10;

export function useActivity(page = 1, limit = ACTIVITY_PAGE_SIZE) {
    return useQuery({
        queryKey: ["profile", "activity", page, limit],
        queryFn: async () => {
            const data: ActivityResponse = await api.get("/profile/activity", {
                params: { page, limit },
            });
            return data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
}
