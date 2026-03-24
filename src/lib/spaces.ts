import { api } from "./api-client";
import { useQuery } from "@tanstack/react-query";
import { type Notification, type SpacesListResponce } from "@/types/api";

export const getSuggestions = async (search: string): Promise<string[]> => {
    return await api.get("/app/suggestions", { params: { search } });
};

export const getSpacesList = async (): Promise<SpacesListResponce> => {
    return await api.get("/app/spaces");
};

export const useSpacesList = () => {
    return useQuery({
        queryKey: ["spaces", "list"],
        queryFn: getSpacesList,
        staleTime: 5 * 60 * 1000, // 10 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const getNotificationsList = async (): Promise<Notification[]> => {
    return await api.get("/app/notifications");
};

export const useNotificationsList = () => {
    return useQuery({
        queryKey: ["notifications", "list"],
        queryFn: getNotificationsList,
        staleTime: 5 * 60 * 1000, // 10 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};
