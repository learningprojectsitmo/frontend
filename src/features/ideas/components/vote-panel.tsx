import { ChevronUp, ChevronDown } from "lucide-react";

type VotePanelProps = {
    votes: number;
    userVote: "up" | "down" | null;
    onVoteUp: () => void;
    onVoteDown: () => void;
};

export function VotePanel({ votes, userVote, onVoteUp, onVoteDown }: VotePanelProps) {
    return (
        <div className="flex flex-col items-center gap-1 w-14 h-[96px] bg-[--grey-98] border border-[--color-black-10] rounded-[14px] py-2 shrink-0">
            <button
                type="button"
                onClick={onVoteUp}
                className={`p-1 rounded transition-colors ${
                    userVote === "up"
                        ? "text-[--azure-60] bg-[--azure-60]/10"
                        : "text-gray-400 hover:text-[--azure-60] hover:bg-[--azure-60]/5"
                }`}
            >
                <ChevronUp size={18} />
            </button>
            <span
                className={`text-sm font-semibold leading-none ${
                    userVote ? "text-[--azure-60]" : "text-[--grey-4]"
                }`}
            >
                {votes}
            </span>
            <button
                type="button"
                onClick={onVoteDown}
                className={`p-1 rounded transition-colors ${
                    userVote === "down"
                        ? "text-[--azure-60] bg-[--azure-60]/10"
                        : "text-gray-400 hover:text-[--azure-60] hover:bg-[--azure-60]/5"
                }`}
            >
                <ChevronDown size={18} />
            </button>
        </div>
    );
}
