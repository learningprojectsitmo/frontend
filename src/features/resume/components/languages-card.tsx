import { useState } from "react";
import { type ResumeLanguage } from "@/types/api";
import { Icon } from "@/components/ui/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { useCreateResumeLanguage, useDeleteResumeLanguage } from "@/lib/resume";
import { FLAG_OPTIONS, DEFAULT_FLAG } from "@/lib/language-flags";
import { LIMITS } from "@/features/resume/validation";
import { SectionEmptyState } from "./section-empty-state";

type Props = {
    languages: ResumeLanguage[];
    isEditing?: boolean;
    resumeId: number;
    ensureResumeId?: () => Promise<number | null>;
};

export const LanguagesCard = ({ languages, isEditing, resumeId, ensureResumeId }: Props) => {
    const [showForm, setShowForm] = useState(false);
    const [isEnsuring, setIsEnsuring] = useState(false);
    const [name, setName] = useState("");
    const [level, setLevel] = useState("");
    const [flag, setFlag] = useState("");

    const createMutation = useCreateResumeLanguage(resumeId);
    const deleteMutation = useDeleteResumeLanguage(resumeId);

    const handleAddClick = async () => {
        if (resumeId === 0) {
            setIsEnsuring(true);
            try {
                const rid = await ensureResumeId?.();
                if (!rid) return;
            } finally {
                setIsEnsuring(false);
            }
        }
        setShowForm(true);
    };

    const handleAdd = () => {
        if (!name.trim()) return;
        createMutation.mutate(
            {
                resumeId,
                data: { name: name.trim(), level: level || null, flag: flag || DEFAULT_FLAG },
            },
            {
                onSuccess: () => {
                    setName("");
                    setLevel("");
                    setFlag("");
                    setShowForm(false);
                },
            },
        );
    };

    return (
        <div className="bg-app-surface rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                    Языки
                </h3>
                {isEditing && !showForm && (
                    <button
                        onClick={handleAddClick}
                        disabled={isEnsuring}
                        className="text-[13px] font-medium text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-500"
                    >
                        + Добавить
                    </button>
                )}
            </div>
            {languages.length === 0 && !showForm ? (
                <SectionEmptyState description="Добавьте информацию о ваших языках, чтобы с вами было легче общаться" />
            ) : (
                <div className="flex flex-col gap-2">
                    {languages.map((lang) => (
                        <div
                            key={lang.id}
                            className="flex items-center justify-between text-sm group"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base">{lang.flag}</span>
                                <span className="text-gray-900 font-medium">{lang.name}</span>
                                {lang.level && (
                                    <span className="text-gray-500">({lang.level})</span>
                                )}
                            </div>
                            {isEditing && resumeId !== 0 && (
                                <button
                                    onClick={() => deleteMutation.mutate(lang.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {isEditing && showForm && (
                <div className="mt-3 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Язык"
                        maxLength={LIMITS.name}
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <input
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        placeholder="Уровень"
                        maxLength={LIMITS.level}
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <Select value={flag || DEFAULT_FLAG} onValueChange={setFlag}>
                        <SelectTrigger className="h-9 text-sm px-3 py-2 rounded-lg bg-app-surface">
                            <SelectValue placeholder="Флаг" />
                        </SelectTrigger>
                        <SelectContent>
                            {FLAG_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <span className="flex items-center gap-2">
                                        <span className="text-base leading-none">
                                            {option.value}
                                        </span>
                                        {option.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
