import { useMemo } from "react";
import type { IdeaStatus } from "../types";
import { useIdeasUIStore } from "../store";
import { useIdeasList as useQueryIdeasList, useTags, useCreateIdea, useToggleVote as useToggleVoteMutation } from "@/lib/api-ideas";
import { useUser } from "@/lib/auth";

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
    const search = useIdeasUIStore((s) => s.search);
    const sort = useIdeasUIStore((s) => s.sort);
    const statusFilter = useIdeasUIStore((s) => s.statusFilter);
    const tagFilter = useIdeasUIStore((s) => s.tagFilter);
    const showOnlyMine = useIdeasUIStore((s) => s.showOnlyMine);
    const showAllTags = useIdeasUIStore((s) => s.showAllTags);

    const setSearch = useIdeasUIStore((s) => s.setSearch);
    const setSort = useIdeasUIStore((s) => s.setSort);
    const setStatusFilter = useIdeasUIStore((s) => s.setStatusFilter);
    const setTagFilter = useIdeasUIStore((s) => s.setTagFilter);
    const setShowOnlyMine = useIdeasUIStore((s) => s.setShowOnlyMine);
    const setShowAllTags = useIdeasUIStore((s) => s.setShowAllTags);

    const { data: currentUser } = useUser();

    const { data: allIdeas = [] } = useQueryIdeasList({
        search: search || undefined,
        sort: sort || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        tag: tagFilter || undefined,
    });

    const { data: allTags = [] } = useTags();
    const { mutate: createIdea } = useCreateIdea();
    const { mutate: toggleVote } = useToggleVoteMutation();

    const filtered = useMemo(() => {
        let result = [...allIdeas];
        if (showOnlyMine && currentUser) {
            result = result.filter((i) => i.author.id === currentUser.id);
        }
        return result;
    }, [allIdeas, showOnlyMine, currentUser]);

    const filteredTags = useMemo(() => {
        if (showAllTags) return allTags;
        return allTags.slice(0, 10);
    }, [allTags, showAllTags]);

    return {
        ideas: filtered,
        tags: filteredTags,
        totalTags: allTags.length,
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
        toggleVote: (ideaId: number, direction: "up" | "down") => toggleVote({ ideaId, direction }),
        addIdea: (title: string, description: string, tags: string[]) => createIdea({ title, description, tags }),
    };
}
