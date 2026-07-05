import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationListResponse } from "@/types/api";
import { api } from "./api-client";

export const getMyNotifications = async (page = 1, limit = 20): Promise<NotificationListResponse> => {
    return await api.get("/notifications/my", { params: { page, limit } });
};

export const useMyNotifications = (page = 1, limit = 20) => {
    return useQuery({
        queryKey: ["notifications", "my", page, limit],
        queryFn: () => getMyNotifications(page, limit),
        staleTime: 30 * 1000,
    });
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
    return await api.patch(`/notifications/${notificationId}/read`);
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markNotificationRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
};

export const markAllNotificationsRead = async (): Promise<{ message: string; count: number }> => {
    return await api.post("/notifications/read-all");
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
};
