import { api } from "./api-client";
import { useQuery } from "@tanstack/react-query";
import { type Project } from "@/types/api";

export const getProjectsList = async (): Promise<Project[]> => {
    return await api.get("/app/projects");
};

export const useProjectsList = () => {
    return useQuery({
        queryKey: ["projects", "list"],
        queryFn: getProjectsList,
        staleTime: 5 * 60 * 1000, // 10 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};
