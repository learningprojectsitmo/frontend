import { api } from "./api-client";
import { useQuery } from "@tanstack/react-query";
import { type ProjectFullResponse, type ProjectListResponse } from "@/types/api";

export const getProject = async ({
    queryKey,
}: {
    queryKey: [string, string];
}): Promise<ProjectFullResponse> => {
    const [, id] = queryKey;
    return await api.get(`/projects/${id}`);
};

export const useProject = (id: string) => {
    return useQuery({
        queryKey: ["project", id],
        queryFn: getProject,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!id,
    });
};

export const getProjectsList = async (workspaceId: string): Promise<ProjectListResponse> => {
    return await api.get("/projects/", { params: { workspace_id: workspaceId } });
};

export const useProjectsList = (workspaceId: string) => {
    return useQuery({
        queryKey: ["projects", "list", workspaceId],
        queryFn: () => getProjectsList(workspaceId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!workspaceId,
    });
};
