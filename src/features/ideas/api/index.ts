import { useMemo } from "react";
import type { IdeaStatus } from "../types";
import { useIdeasStore, mockTags } from "../store";

const statusLabels: Record<IdeaStatus, string> = {
    new: "Новые идеи",
    planned: "Запланировано",
    declined: "Отклонено",
    implemented: "Реализовано",
};

export function getStatusLabel(status: IdeaStatus): string {
    return statusLabels[status];
}

export function useIdeasList() {
    const ideas = useIdeasStore((s) => s.ideas);
    const search = useIdeasStore((s) => s.search);
    const sort = useIdeasStore((s) => s.sort);
    const statusFilter = useIdeasStore((s) => s.statusFilter);
    const tagFilter = useIdeasStore((s) => s.tagFilter);
    const showOnlyMine = useIdeasStore((s) => s.showOnlyMine);
    const showAllTags = useIdeasStore((s) => s.showAllTags);

    const setSearch = useIdeasStore((s) => s.setSearch);
    const setSort = useIdeasStore((s) => s.setSort);
    const setStatusFilter = useIdeasStore((s) => s.setStatusFilter);
    const setTagFilter = useIdeasStore((s) => s.setTagFilter);
    const setShowOnlyMine = useIdeasStore((s) => s.setShowOnlyMine);
    const setShowAllTags = useIdeasStore((s) => s.setShowAllTags);
    const toggleVote = useIdeasStore((s) => s.toggleVote);
    const addIdea = useIdeasStore((s) => s.addIdea);

    const filtered = useMemo(() => {
        let result = [...ideas];

        if (statusFilter !== "all") {
            result = result.filter((i) => i.status === statusFilter);
        }
        if (showOnlyMine) {
            result = result.filter((i) => i.author.id === 0);
        }
        if (tagFilter) {
            result = result.filter((i) => i.tags.includes(tagFilter));
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (i) =>
                    i.title.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q),
            );
        }
        if (sort === "newest") {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
            result.sort((a, b) => b.votes - a.votes);
        }
        return result;
    }, [ideas, statusFilter, showOnlyMine, tagFilter, search, sort]);

    const filteredTags = useMemo(() => {
        if (showAllTags) return mockTags;
        return mockTags.slice(0, 10);
    }, [showAllTags]);

    return {
        ideas: filtered,
        tags: filteredTags,
        totalTags: mockTags.length,
        showAllTags,
        setShowAllTags,
        search,
        setSearch,
        sort,
        setSort,
        statusFilter,
        setStatusFilter,
        tagFilter,
        setTagFilter,
        showOnlyMine,
        setShowOnlyMine,
        toggleVote,
        addIdea,
    };
}
