import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "./api-client";
import { queryKeys } from "./query-keys";
import type {
    WikiPageCreate,
    WikiPageFull,
    WikiPageListResponse,
    WikiPageSummary,
    WikiPageUpdate,
} from "@/types/api";

/**
 * Вики проекта.
 *
 * Чтение не требует авторизации: приватные страницы сервер отдаёт только
 * команде проекта, а анонимному — 404. Поэтому страница (а не только список)
 * тоже кэшируется в react-query: без ключа с pageId два посетителя делили бы
 * одну запись, и анонимный увидел бы выбранный приватный id из DevTools.
 */

export const getWikiPages = async (
    projectId: number,
    params?: { page?: number; limit?: number },
): Promise<WikiPageListResponse> => {
    return await api.get(`/projects/${projectId}/wiki`, { params });
};

export const useWikiPages = (projectId: number, params?: { page?: number; limit?: number }) => {
    return useQuery({
        queryKey: [...queryKeys.wiki.pages(projectId), params],
        queryFn: () => getWikiPages(projectId, params),
        enabled: !!projectId,
    });
};

/** Плоский список для дерева — без пагинации, limit по умолчанию 200. */
export const getWikiTree = async (projectId: number): Promise<WikiPageSummary[]> => {
    return await api.get(`/projects/${projectId}/wiki/tree`);
};

export const useWikiTree = (projectId: number) => {
    return useQuery({
        queryKey: queryKeys.wiki.tree(projectId),
        queryFn: () => getWikiTree(projectId),
        enabled: !!projectId,
        staleTime: 30 * 1000,
    });
};

export const getWikiPage = async (projectId: number, pageId: number): Promise<WikiPageFull> => {
    return await api.get(`/projects/${projectId}/wiki/${pageId}`);
};

export const useWikiPage = (projectId: number, pageId: number | null) => {
    return useQuery({
        queryKey: queryKeys.wiki.page(projectId, pageId ?? "none"),
        queryFn: () => getWikiPage(projectId, pageId as number),
        enabled: !!projectId && !!pageId,
    });
};

/** После любой записи структура и содержимое меняются — инвалидируем всё дерево. */
const useInvalidateWiki = (projectId: number) => {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.wiki.all(projectId) });
    };
};

export const useCreateWikiPage = (projectId: number) => {
    const invalidate = useInvalidateWiki(projectId);
    return useMutation({
        mutationFn: (data: WikiPageCreate) =>
            api.post(`/projects/${projectId}/wiki`, data) as Promise<WikiPageFull>,
        onSuccess: invalidate,
    });
};

export const useUpdateWikiPage = (projectId: number) => {
    const invalidate = useInvalidateWiki(projectId);
    return useMutation({
        mutationFn: ({ pageId, data }: { pageId: number; data: WikiPageUpdate }) =>
            api.put(`/projects/${projectId}/wiki/${pageId}`, data) as Promise<WikiPageFull>,
        onSuccess: invalidate,
    });
};

export const useDeleteWikiPage = (projectId: number) => {
    const invalidate = useInvalidateWiki(projectId);
    return useMutation({
        mutationFn: (pageId: number) =>
            api.delete(`/projects/${projectId}/wiki/${pageId}`) as Promise<void>,
        onSuccess: invalidate,
    });
};
