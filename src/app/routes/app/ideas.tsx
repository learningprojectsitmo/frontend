import { useState } from "react";
import { ContentLayout } from "@/components/layouts";
import { IdeasHeader } from "@/features/ideas/components/ideas-header";
import { IdeasSearch } from "@/features/ideas/components/ideas-search";
import { IdeaCard } from "@/features/ideas/components/idea-card";
import { IdeasSidebar } from "@/features/ideas/components/ideas-sidebar";
import { NewIdeaDialog } from "@/features/ideas/components/new-idea-dialog";
import { useIdeasList } from "@/features/ideas/api";
import { Lightbulb } from "lucide-react";

const IdeasRoute = () => {
    const {
        ideas,
        tags,
        totalTags,
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
    } = useIdeasList();

    const [newIdeaOpen, setNewIdeaOpen] = useState(false);

    return (
        <ContentLayout title="Идеи">
            <div className="mx-auto max-w-7xl p-6 flex gap-6">
                <div className="flex-1 min-w-0 space-y-5">
                    <IdeasHeader onNewIdea={() => setNewIdeaOpen(true)} />

                    <IdeasSearch
                        search={search}
                        sort={sort}
                        onSearchChange={setSearch}
                        onSortChange={setSort}
                    />

                    {ideas.length === 0 ? (
                        <div className="bg-white border border-[--color-black-10] rounded-[14px] p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[--azure-60]/10 flex items-center justify-center mb-4">
                                <Lightbulb size="32" className="text-[--azure-60]" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                Идей пока нет
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                {search
                                    ? "По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска."
                                    : "Будьте первым, кто предложит идею по улучшению платформы."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ideas.map((idea) => (
                                <IdeaCard
                                    key={idea.id}
                                    idea={idea}
                                    onVoteUp={() => toggleVote(idea.id, "up")}
                                    onVoteDown={() => toggleVote(idea.id, "down")}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-[280px] shrink-0 hidden xl:block">
                    <IdeasSidebar
                        statusFilter={statusFilter}
                        showOnlyMine={showOnlyMine}
                        activeTag={tagFilter}
                        tags={tags}
                        totalTags={totalTags}
                        showAllTags={showAllTags}
                        onStatusChange={(s) => {
                            setStatusFilter(s);
                            setShowOnlyMine(false);
                        }}
                        onMineToggle={() => {
                            setShowOnlyMine((p) => !p);
                            setStatusFilter("all");
                        }}
                        onTagClick={setTagFilter}
                        onShowMoreTags={() => setShowAllTags(true)}
                    />
                </div>
            </div>

            <NewIdeaDialog
                open={newIdeaOpen}
                onClose={() => setNewIdeaOpen(false)}
                onSubmit={(title, description, tags) => addIdea(title, description, tags)}
            />
        </ContentLayout>
    );
};

export default IdeasRoute;
