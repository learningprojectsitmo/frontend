import { useMemo, useState } from "react";
import { type ResumeInterest } from "@/types/api";
import { Icon } from "@/components/ui/icons";
import {
    useCreateResumeInterest,
    useDeleteResumeInterest,
    useInterestSuggestions,
} from "@/lib/resume";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { LIMITS } from "@/features/resume/validation";
import { SectionEmptyState } from "./section-empty-state";
import { AutocompleteInput } from "./autocomplete-input";

type Props = {
    interests: ResumeInterest[];
    isEditing?: boolean;
    resumeId: number;
    ensureResumeId?: () => Promise<number | null>;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const InterestsCard = ({ interests, isEditing, resumeId, ensureResumeId }: Props) => {
    const [showForm, setShowForm] = useState(false);
    const [isEnsuring, setIsEnsuring] = useState(false);
    const [name, setName] = useState("");

    const createMutation = useCreateResumeInterest(resumeId);
    const deleteMutation = useDeleteResumeInterest(resumeId);

    const debouncedQuery = useDebouncedValue(name, 250);
    const { data: rawSuggestions = [] } = useInterestSuggestions(debouncedQuery);

    const normalized = normalize(name);
    const existingNames = useMemo(
        () => new Set(interests.map((item) => normalize(item.name))),
        [interests],
    );
    const suggestions = useMemo(
        () => rawSuggestions.filter((s) => !existingNames.has(normalize(s))),
        [rawSuggestions, existingNames],
    );
    const isDuplicate = normalized.length > 0 && existingNames.has(normalized);

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
        if (!name.trim() || isDuplicate) return;
        createMutation.mutate(
            { resumeId, data: { name: name.trim() } },
            {
                onSuccess: () => {
                    setName("");
                    setShowForm(false);
                },
            },
        );
    };

    const handleCancel = () => {
        setName("");
        setShowForm(false);
    };

    return (
        <div className="bg-app-surface rounded-3xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                    Интересы
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
            {interests.length === 0 && !showForm ? (
                <SectionEmptyState description="Добавьте интересы, чтобы рассказать о себе больше" />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {interests.map((item) => (
                        <div key={item.id} className="group relative">
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                                {item.name}
                            </span>
                            {isEditing && resumeId !== 0 && (
                                <button
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    className="absolute -top-1.5 -right-1.5 bg-red-400 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <Icon name="trash" size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {isEditing && showForm && (
                <div className="mt-3 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                    <AutocompleteInput
                        value={name}
                        onChange={setName}
                        placeholder="Название интереса"
                        suggestions={suggestions}
                        isDuplicate={isDuplicate}
                        onEnter={handleAdd}
                        maxLength={LIMITS.name}
                        autoFocus
                    />
                    {isDuplicate && <p className="text-xs text-red-500">Такой интерес уже есть</p>}
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={handleCancel}
                            className="text-xs text-gray-500 px-3 py-1.5"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!name.trim() || isDuplicate || createMutation.isPending}
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
