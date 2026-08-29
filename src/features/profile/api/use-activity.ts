import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ActivityResponse } from "@/types/activity";

export function useActivity() {
    return useQuery({
        queryKey: ["profile", "activity"],
        queryFn: async () => {
            const data: ActivityResponse = await api.get("/profile/activity");
            return data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
