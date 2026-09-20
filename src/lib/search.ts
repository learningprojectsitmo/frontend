import { useQuery } from "@tanstack/react-query";
import { api } from "./api-client";
import { queryKeys } from "./query-keys";
import { useDebounce } from "@/utils/debounce";
import type { SearchResults } from "@/types/search";

export const MIN_SEARCH_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 600;
export const SEARCH_EXTENDED_LIMIT = 50;

export type SearchLimits = {
    projectLimit?: number;
    spaceLimit?: number;
    userLimit?: number;
};

export const getSearchResults = async (
    q: string,
    limits?: SearchLimits,
): Promise<SearchResults> => {
    return await api.get("/search/", {
        params: {
            q,
            project_limit: limits?.projectLimit,
            space_limit: limits?.spaceLimit,
            user_limit: limits?.userLimit,
        },
    });
};

export const useSearchResults = (q: string, enabled?: boolean, limits?: SearchLimits) => {
    const debounced = useDebounce(q, SEARCH_DEBOUNCE_MS);
    const query = debounced.trim();
    return useQuery({
        queryKey: queryKeys.search(query, limits ? "extended" : "default"),
        queryFn: () => getSearchResults(query, limits),
        enabled: (enabled ?? true) && query.length >= MIN_SEARCH_LENGTH,
        staleTime: 30_000,
        gcTime: 5 * 60 * 1000,
    });
};

export const useExtendedSearchResults = (q: string, enabled?: boolean) => {
    const query = q.trim();
    const limits: SearchLimits = {
        projectLimit: SEARCH_EXTENDED_LIMIT,
        spaceLimit: SEARCH_EXTENDED_LIMIT,
        userLimit: SEARCH_EXTENDED_LIMIT,
    };
    return useQuery({
        queryKey: queryKeys.search(query, "extended"),
        queryFn: () => getSearchResults(query, limits),
        enabled: (enabled ?? true) && query.length >= MIN_SEARCH_LENGTH,
        staleTime: 30_000,
        gcTime: 5 * 60 * 1000,
    });
};
