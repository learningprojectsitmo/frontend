import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type Notification,
    type SpacesListParams,
    type SpacesListResponce,
    type CreateWorkspaceInput,
    type WorkSpaceFull,
} from "@/types/api";

export const getSuggestions = async (search: string): Promise<string[]> => {
    return await api.get("/app/suggestions", { params: { search } });
};

export const getSpacesList = async (params?: SpacesListParams): Promise<SpacesListResponce> => {
    return await api.get("/workspaces/menu", { params });
};

export const useSpacesList = (params?: SpacesListParams) => {
    return useQuery({
        // params может содержать { page: 1, limit: 10 } и т.д.
        queryKey: ["workspaces", "list", params],
        queryFn: () => getSpacesList(params),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
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

export const createWorkspace = async (data: CreateWorkspaceInput): Promise<WorkSpaceFull> => {
    return await api.post("/workspaces/", data);
};

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createWorkspace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces", "list"] });
        },
    });
};
