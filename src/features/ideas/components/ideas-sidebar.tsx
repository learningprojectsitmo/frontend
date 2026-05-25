import { StatusMenu } from "./status-menu";
import { InfoCard } from "./info-card";
import { TagList } from "./tag-list";
import type { IdeaStatus, IdeaTag } from "../types";

type IdeasSidebarProps = {
    statusFilter: IdeaStatus | "all";
    showOnlyMine: boolean;
    activeTag: string | null;
    tags: IdeaTag[];
    totalTags: number;
    showAllTags: boolean;
    onStatusChange: (status: IdeaStatus | "all") => void;
    onMineToggle: () => void;
    onTagClick: (tag: string | null) => void;
    onShowMoreTags: () => void;
};

export function IdeasSidebar({
    statusFilter,
    showOnlyMine,
    activeTag,
    tags,
    totalTags,
    showAllTags,
    onStatusChange,
    onMineToggle,
    onTagClick,
    onShowMoreTags,
}: IdeasSidebarProps) {
    return (
        <div className="space-y-4 sticky top-24">
            <StatusMenu
                current={statusFilter}
                showOnlyMine={showOnlyMine}
                onStatusChange={onStatusChange}
                onMineToggle={onMineToggle}
            />
            <InfoCard />
            <TagList
                tags={tags}
                totalTags={totalTags}
                activeTag={activeTag}
                showAll={showAllTags}
                onTagClick={onTagClick}
                onShowMore={onShowMoreTags}
            />
        </div>
    );
}
