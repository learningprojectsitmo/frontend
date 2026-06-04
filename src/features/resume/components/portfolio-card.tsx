import { useState } from "react";
import { type ResumeLink } from "@/types/api";
import { Icon } from "@/components/ui/icons";
import { useCreateResumeLink, useDeleteResumeLink } from "@/lib/resume";

type Props = {
    links: ResumeLink[];
    isEditing?: boolean;
    resumeId: number;
};

const platformLabels: Record<string, string> = {
    behance: "Behance",
    dribbble: "Dribbble",
};

export const PortfolioCard = ({ links, isEditing, resumeId }: Props) => {
    const [newPlatform, setNewPlatform] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [showForm, setShowForm] = useState(false);

    const createMutation = useCreateResumeLink(resumeId);
    const deleteMutation = useDeleteResumeLink(resumeId);

    const handleAdd = () => {
        if (!newPlatform.trim() || !newUrl.trim()) return;
        createMutation.mutate(
            { resumeId, data: { platform: newPlatform.trim(), url: newUrl.trim() } },
            {
                onSuccess: () => {
                    setNewPlatform("");
                    setNewUrl("");
                    setShowForm(false);
                },
            },
        );
    };

    const handleDelete = (linkId: number) => {
        deleteMutation.mutate(linkId);
    };

    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight">Портфолио</h3>
                {isEditing && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-[13px] font-medium text-blue-500 hover:text-blue-700"
                    >
                        + Добавить
                    </button>
                )}
            </div>
            <div className="space-y-3">
                {links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between group">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline min-w-0 truncate"
                        >
                            <span className="truncate">
                                {platformLabels[link.platform.toLowerCase()] || link.platform}
                            </span>
                        </a>
                        {isEditing && (
                            <button
                                onClick={() => handleDelete(link.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icon name="trash" size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {isEditing && showForm && (
                <div className="mt-4 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        placeholder="Название (Behance, GitHub...)"
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200"
                    />
                    <input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="URL"
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-xs text-gray-500 px-3 py-1.5"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={
                                !newPlatform.trim() || !newUrl.trim() || createMutation.isPending
                            }
                            className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {createMutation.isPending ? "..." : "Добавить"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
