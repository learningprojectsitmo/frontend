import { create } from "zustand";
import type { IdeasSort, IdeaStatus } from "./types";

interface IdeasUIState {
    search: string;
    sort: IdeasSort;
    statusFilter: IdeaStatus | "all";
    tagFilter: string | null;
    showOnlyMine: boolean;
    showAllTags: boolean;

    setSearch: (search: string) => void;
    setSort: (sort: IdeasSort) => void;
    setStatusFilter: (filter: IdeaStatus | "all") => void;
    setTagFilter: (tag: string | null) => void;
    setShowOnlyMine: (show: boolean | ((prev: boolean) => boolean)) => void;
    setShowAllTags: (show: boolean) => void;
}

export const useIdeasUIStore = create<IdeasUIState>((set) => ({
    search: "",
    sort: "newest" as IdeasSort,
    statusFilter: "all" as const,
    tagFilter: null,
    showOnlyMine: false,
    showAllTags: false,

    setSearch: (search) => set({ search }),
    setSort: (sort) => set({ sort }),
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    setTagFilter: (tagFilter) => set({ tagFilter }),
    setShowOnlyMine: (show) =>
        set((state) => ({
            showOnlyMine: typeof show === "function" ? show(state.showOnlyMine) : show,
        })),
    setShowAllTags: (showAllTags) => set({ showAllTags }),
}));
