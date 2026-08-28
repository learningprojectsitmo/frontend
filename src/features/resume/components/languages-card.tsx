import { useState } from "react";
import { type ResumeLanguage } from "@/types/api";
import { Icon } from "@/components/ui/icons";
import { useCreateResumeLanguage, useDeleteResumeLanguage } from "@/lib/resume";

const LANGUAGE_FLAGS: Record<string, string> = {
    Русский: "🇷🇺",
    English: "🇬🇧",
    Deutsch: "🇩🇪",
    Français: "🇫🇷",
    Español: "🇪🇸",
    中文: "🇨🇳",
    日本語: "🇯🇵",
};

type Props = {
    languages: ResumeLanguage[];
    isEditing?: boolean;
    resumeId: number;
};

export const LanguagesCard = ({ languages, isEditing, resumeId }: Props) => {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [level, setLevel] = useState("");

    const createMutation = useCreateResumeLanguage(resumeId);
    const deleteMutation = useDeleteResumeLanguage(resumeId);

    const handleAdd = () => {
        if (!name.trim()) return;
        createMutation.mutate(
            { resumeId, data: { name: name.trim(), level: level || null } },
            {
                onSuccess: () => {
                    setName("");
                    setLevel("");
                    setShowForm(false);
                },
            },
        );
    };

    return (
        <div className="bg-app-surface rounded-3xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight">Языки</h3>
                {isEditing && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-[13px] font-medium text-blue-500 hover:text-blue-700"
                    >
                        + Добавить
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {languages.map((lang) => (
                    <div
                        key={lang.id}
                        className="flex items-center justify-between text-sm group gap-2"
                    >
                        <span className="text-gray-900 min-w-0 truncate">
                            {LANGUAGE_FLAGS[lang.name] && `${LANGUAGE_FLAGS[lang.name]} `}
                            {lang.name}
                        </span>
                        <div className="flex items-center gap-2">
                            {lang.level && <span className="text-gray-400">{lang.level}</span>}
                            {isEditing && (
                                <button
                                    onClick={() => deleteMutation.mutate(lang.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {isEditing && showForm && (
                <div className="mt-4 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Язык"
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200"
                    />
                    <input
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        placeholder="Уровень (A1, B2, Родной...)"
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
                            disabled={!name.trim() || createMutation.isPending}
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
