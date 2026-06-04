import { useCallback } from "react";

const STORAGE_KEY = "recently_viewed_project_ids";
const MAX_ITEMS = 20;

export function useRecentlyViewed() {
    const getViewedProjectIds = useCallback((): number[] => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const ids = JSON.parse(raw) as number[];
            return Array.isArray(ids) ? ids : [];
        } catch {
            return [];
        }
    }, []);

    const addViewedProject = useCallback(
        (projectId: number) => {
            try {
                const ids = getViewedProjectIds();
                const filtered = ids.filter((id) => id !== projectId);
                const updated = [projectId, ...filtered].slice(0, MAX_ITEMS);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
                // localStorage might be full or unavailable
            }
        },
        [getViewedProjectIds],
    );

    const clearViewedProjects = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { getViewedProjectIds, addViewedProject, clearViewedProjects };
}
