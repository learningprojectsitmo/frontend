import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectSpecification, SpecificationComment, SpecificationUpdate } from "@/types/api";
import { queryKeys } from "./query-keys";

export const getSpecification = async (projectId: number): Promise<ProjectSpecification> => {
    return await api.get(`/projects/${projectId}/specification`);
};

export const useSpecification = (projectId: number) => {
    return useQuery({
        queryKey: queryKeys.specification.detail(projectId),
        queryFn: () => getSpecification(projectId),
        staleTime: 30 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!projectId,
    });
};

export const updateSpecification = async (
    projectId: number,
    data: SpecificationUpdate,
): Promise<ProjectSpecification> => {
    return await api.put(`/projects/${projectId}/specification`, data);
};

export const useUpdateSpecification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, data }: { projectId: number; data: SpecificationUpdate }) =>
            updateSpecification(projectId, data),
        onSuccess: (_data, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.specification.detail(projectId) });
        },
    });
};

export const getSpecificationComments = async (
    projectId: number,
): Promise<SpecificationComment[]> => {
    return await api.get(`/projects/${projectId}/specification/comments`);
};

export const useSpecificationComments = (projectId: number) => {
    return useQuery({
        queryKey: queryKeys.specification.comments(projectId),
        queryFn: () => getSpecificationComments(projectId),
        enabled: !!projectId,
    });
};

export const useAddSpecificationComment = (projectId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (text: string) =>
            api.post(`/projects/${projectId}/specification/comments`, {
                text,
            }) as Promise<SpecificationComment>,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.specification.comments(projectId),
            });
        },
    });
};

export const useUpdateSpecificationComment = (projectId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ commentId, text }: { commentId: number; text: string }) =>
            api.put(`/projects/${projectId}/specification/comments/${commentId}`, {
                text,
            }) as Promise<SpecificationComment>,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.specification.comments(projectId),
            });
        },
    });
};

export const useDeleteSpecificationComment = (projectId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId: number) =>
            api.delete(
                `/projects/${projectId}/specification/comments/${commentId}`,
            ) as Promise<void>,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.specification.comments(projectId),
            });
        },
    });
};
