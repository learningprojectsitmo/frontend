import { useQuery } from "@tanstack/react-query";
import type { ProfileResponse } from "@/types/api";
import { api } from "./api-client";

export const getProfile = async (): Promise<ProfileResponse> => {
    return await api.get("/profile");
};

export const useProfile = () => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};
