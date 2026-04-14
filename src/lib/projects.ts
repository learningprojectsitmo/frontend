import { api } from "./api-client";
import { useQuery } from "@tanstack/react-query";
import { type ProjectSingle, type Project } from "@/types/api";

export const getRecentProjectsList = async (): Promise<Project[]> => {
    return await api.get("/app/recentprojects");
};

export const useRecentProjectsList = () => {
    return useQuery({
        queryKey: ["projects", "list"],
        queryFn: getRecentProjectsList,
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const getProjectsList = async ({
    queryKey,
}: {
    queryKey: [string, string];
}): Promise<Project[]> => {
    const [, id] = queryKey;
    return await api.get(`/app/projects?id=${id}`);
};

export const useProjectsList = (id: string) => {
    return useQuery({
        queryKey: ["projects", id],
        queryFn: getProjectsList,
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const getProject = async ({
    queryKey,
}: {
    queryKey: [string, string];
}): Promise<ProjectSingle> => {
    const [, id] = queryKey;
    return await api.get(`/app/project?id=${id}`);
};

export const useProject = (id: string) => {
    return useQuery({
        queryKey: ["project", id],
        queryFn: getProject,
        staleTime: 5 * 60 * 1000, // 5 минут
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};
