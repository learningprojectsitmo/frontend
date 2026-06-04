import { Link } from "react-router";
import { MessageSquare } from "lucide-react";
import { VotePanel } from "./vote-panel";
import type { Idea } from "../types";

type IdeaCardProps = {
    idea: Idea;
    onVoteUp: () => void;
    onVoteDown: () => void;
};

export function IdeaCard({ idea, onVoteUp, onVoteDown }: IdeaCardProps) {
    return (
        <Link
            to={`/app/ideas/${idea.id}`}
            className="block group bg-white border border-[--color-black-10] rounded-[14px] p-5 flex gap-4 transition-shadow duration-200 hover:shadow-md cursor-pointer"
        >
            <VotePanel
                votes={idea.votes}
                userVote={idea.userVote}
                onVoteUp={onVoteUp}
                onVoteDown={onVoteDown}
            />
            <div className="flex-1 min-w-0">
                <h3 className="text-[17px] font-bold text-[--grey-4] leading-tight mb-1.5">
                    {idea.title}
                </h3>
                <p className="text-[13px] text-[--azure-34] leading-relaxed line-clamp-2 mb-3">
                    {idea.description}
                </p>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[--azure-46] text-[13px]">
                            <MessageSquare size={15} />
                            <span>{idea.commentsCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {idea.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-[--azure-60]/10 text-[--azure-60] text-xs font-medium rounded-[8px]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-6 h-6 rounded-full bg-[--azure-60]/20 flex items-center justify-center text-[10px] font-semibold text-[--azure-60]">
                            {idea.author.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[--azure-46] text-xs">{idea.author.username}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
