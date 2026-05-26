import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idea, IdeaComment, IdeaTag } from "@/features/ideas/types";

export const ideasKeys = {
    all: ["ideas"] as const,
    lists: () => [...ideasKeys.all, "list"] as const,
    list: (params?: Record<string, unknown>) => [...ideasKeys.lists(), params] as const,
    details: () => [...ideasKeys.all, "detail"] as const,
    detail: (id: number) => [...ideasKeys.details(), id] as const,
    comments: (ideaId: number) => [...ideasKeys.all, "comments", ideaId] as const,
    tags: () => [...ideasKeys.all, "tags"] as const,
};

export const useIdeasList = (params?: { search?: string; sort?: string; status?: string; tag?: string }) => {
    return useQuery({
        queryKey: ideasKeys.list(params),
        queryFn: async () => {
            const data = await (api.get("/ideas", { params }) as Promise<{ items: Idea[] }>);
            return data.items;
        },
    });
};

export const useIdea = (id: number) => {
    return useQuery({
        queryKey: ideasKeys.detail(id),
        queryFn: () => api.get(`/ideas/${id}`) as Promise<Idea>,
        enabled: !!id,
    });
};

export const useComments = (ideaId: number) => {
    return useQuery({
        queryKey: ideasKeys.comments(ideaId),
        queryFn: () => api.get(`/ideas/${ideaId}/comments`) as Promise<IdeaComment[]>,
        enabled: !!ideaId,
    });
};

export const useTags = () => {
    return useQuery({
        queryKey: ideasKeys.tags(),
        queryFn: () => api.get("/ideas/tags") as Promise<IdeaTag[]>,
    });
};

export const useAddComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ideaId, text }: { ideaId: number; text: string }) =>
            api.post(`/ideas/${ideaId}/comments`, { text }) as Promise<IdeaComment>,
        onSuccess: (_data, { ideaId }) => {
            queryClient.invalidateQueries({ queryKey: ideasKeys.comments(ideaId) });
            queryClient.invalidateQueries({ queryKey: ideasKeys.detail(ideaId) });
            queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
        },
    });
};

export const useToggleVote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ideaId, direction }: { ideaId: number; direction: "up" | "down" }) =>
            api.post(`/ideas/${ideaId}/vote`, { direction }) as Promise<Idea>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ideasKeys.details() });
        },
    });
};

export const useCreateIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string; description: string; tags: string[] }) =>
            api.post("/ideas", data) as Promise<Idea>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ideasKeys.tags() });
        },
    });
};

export const useDeleteIdea = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ideaId: number) =>
            api.delete(`/ideas/${ideaId}`) as Promise<void>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ideasKeys.details() });
            queryClient.invalidateQueries({ queryKey: ideasKeys.tags() });
        },
    });
};

export const useCreateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) =>
            api.post("/ideas/tags", { name }) as Promise<IdeaTag>,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ideasKeys.tags() });
        },
    });
};
