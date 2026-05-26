import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, Send, Trash2 } from "lucide-react";
import { ContentLayout } from "@/components/layouts";
import { Head } from "@/components/seo";
import { Spinner } from "@/components/ui/spinner/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VotePanel } from "@/features/ideas/components/vote-panel";
import { useIdea, useComments, useAddComment, useToggleVote, useDeleteIdea } from "@/lib/api-ideas";
import { getStatusLabel } from "@/features/ideas/api";
import { useUser } from "@/lib/auth";
import type { IdeaStatus } from "@/features/ideas/types";

const statusColors: Record<IdeaStatus, string> = {
    new: "bg-[--azure-60]/10 text-[--azure-60]",
    planned: "bg-[--orange-50]/10 text-[--orange-50]",
    declined: "bg-[--red-58]/10 text-[--red-58]",
    implemented: "bg-[--green-39]/10 text-[--green-39]",
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

const IdeasDetailRoute = () => {
    const { id } = useParams<{ id: string }>();
    const ideaId = Number(id);
    const navigate = useNavigate();

    const { data: currentUser } = useUser();
    const { data: idea, isLoading: ideaLoading } = useIdea(ideaId);
    const { data: comments = [], isLoading: commentsLoading } = useComments(ideaId);
    const { mutate: addComment, isPending: commentPending } = useAddComment();
    const { mutate: toggleVote } = useToggleVote();
    const { mutate: deleteIdea, isPending: deleting } = useDeleteIdea();

    const [commentText, setCommentText] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const isAuthor = idea && currentUser && idea.author.id === currentUser.id;

    if (ideaLoading) {
        return (
            <ContentLayout title="Идея">
                <div className="flex items-center justify-center h-[60vh]">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

    if (!idea) {
        return (
            <ContentLayout title="Идея не найдена">
                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                    <p className="text-[--azure-46] text-lg">Идея не найдена</p>
                    <Link
                        to="/app/ideas"
                        className="text-[--azure-60] hover:underline text-sm font-medium"
                    >
                        ← Вернуться к списку идей
                    </Link>
                </div>
            </ContentLayout>
        );
    }

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        addComment({ ideaId, text: commentText.trim() });
        setCommentText("");
    };

    return (
        <ContentLayout title={idea.title}>
            <Head title={idea.title} />

            <div className="max-w-4xl mx-auto p-6">
                <Link
                    to="/app/ideas"
                    className="inline-flex items-center gap-1.5 text-[--azure-46] hover:text-[--azure-60] text-sm font-medium transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Назад к идеям
                </Link>

                <div className="bg-white border border-[--color-black-10] rounded-[14px] p-8">
                    <div className="flex items-start gap-6">
                        <VotePanel
                            votes={idea.votes}
                            userVote={idea.userVote}
                            onVoteUp={() => toggleVote({ ideaId, direction: "up" })}
                            onVoteDown={() => toggleVote({ ideaId, direction: "down" })}
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-[24px] font-bold text-[--grey-4] leading-tight">
                                    {idea.title}
                                </h1>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                                        statusColors[idea.status]
                                    }`}
                                >
                                    {getStatusLabel(idea.status)}
                                </span>
                                {isAuthor && (
                                    <button
                                        type="button"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={deleting}
                                        className="ml-auto p-2 text-[--red-58]/60 hover:text-[--red-58] hover:bg-[--red-58]/10 rounded-lg transition-colors"
                                        title="Удалить идею"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-full bg-[--azure-60]/20 flex items-center justify-center text-xs font-semibold text-[--azure-60]">
                                    {idea.author.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[--azure-46] text-sm">{idea.author.username}</span>
                                <span className="text-[--azure-46] text-sm">·</span>
                                <span className="text-[--azure-46] text-sm">{formatDate(idea.createdAt)}</span>
                            </div>

                            <p className="text-[15px] text-[--grey-4] leading-relaxed mb-6 whitespace-pre-wrap">
                                {idea.description}
                            </p>

                            <div className="flex items-center gap-2 mb-2">
                                {idea.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-[--azure-60]/10 text-[--azure-60] text-xs font-medium rounded-[8px]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white border border-[--color-black-10] rounded-[14px] p-6">
                    <h2 className="text-lg font-semibold text-[--grey-4] mb-5 flex items-center gap-2">
                        <MessageSquare size={18} />
                        Комментарии
                        <span className="text-sm font-normal text-[--azure-46]">
                            ({comments.length})
                        </span>
                    </h2>

                    {commentsLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-[--azure-46] text-sm text-center py-8">
                            Комментариев пока нет. Будьте первым!
                        </p>
                    ) : (
                        <div className="space-y-4 mb-6">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="flex gap-3 p-4 bg-[--grey-98] rounded-[12px]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[--azure-60]/20 flex items-center justify-center text-xs font-semibold text-[--azure-60] shrink-0">
                                        {comment.author.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-[--grey-4]">
                                                {comment.author.username}
                                            </span>
                                            <span className="text-xs text-[--azure-46]">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[--grey-4] leading-relaxed">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment();
                                }
                            }}
                            placeholder="Напишите комментарий..."
                            className="flex-1 h-11 px-4 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
                        />
                        <Button
                            variant="dark"
                            size="hug36"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || commentPending}
                            hasIcon
                            icon={<Send size={16} />}
                        />
                    </div>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Удалить идею?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Вы действительно хотите удалить идею «{idea.title}»? Это действие
                            нельзя будет отменить.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                deleteIdea(ideaId, {
                                    onSuccess: () => navigate("/app/ideas"),
                                });
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            Удалить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ContentLayout>
    );
};

export default IdeasDetailRoute;
