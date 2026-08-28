import { useState, useMemo, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTags, useCreateTag } from "@/lib/api-ideas";

type NewIdeaDialogProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string, tags: string[]) => void;
};

export function NewIdeaDialog({ open, onClose, onSubmit }: NewIdeaDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestionRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: allTags = [] } = useTags();
    const { mutate: createTag } = useCreateTag();

    const suggestedTags = useMemo(() => {
        if (!customTag.trim()) return [];
        const q = customTag.trim().toLowerCase();
        return allTags.filter(
            (t) => t.name.toLowerCase().includes(q) && !selectedTags.includes(t.name),
        );
    }, [customTag, allTags, selectedTags]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                suggestionRef.current &&
                !suggestionRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!open) return null;

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit(title.trim(), description.trim(), selectedTags);
        setTitle("");
        setDescription("");
        setSelectedTags([]);
        setCustomTag("");
        onClose();
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
        );
    };

    const handleAddCustomTag = () => {
        const name = customTag.trim();
        if (!name || selectedTags.includes(name)) return;
        const exists = allTags.some((t) => t.name === name);
        if (!exists) {
            createTag(name);
        }
        setSelectedTags((prev) => [...prev, name]);
        setCustomTag("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-app-surface rounded-[14px] w-full max-w-lg mx-4 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-[--grey-4]">Новая идея</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[--grey-4] mb-1.5">
                            Заголовок
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Кратко опишите вашу идею"
                            className="w-full h-11 px-4 bg-app-surface border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--grey-4] mb-1.5">
                            Описание
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Подробно опишите ваше предложение..."
                            rows={4}
                            className="w-full px-4 py-3 bg-app-surface border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--grey-4] mb-1.5">
                            Теги
                        </label>
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[--azure-60] text-white"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className="hover:text-white/80 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="relative flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={customTag}
                                    onChange={(e) => {
                                        setCustomTag(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (suggestedTags.length > 0) {
                                                const tag = suggestedTags[0];
                                                setSelectedTags((prev) => [...prev, tag.name]);
                                                setCustomTag("");
                                                setShowSuggestions(false);
                                            } else {
                                                handleAddCustomTag();
                                            }
                                        }
                                    }}
                                    placeholder="Создать свой тег..."
                                    className="w-full h-9 px-3 bg-app-surface border border-[--color-black-10] rounded-[8px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
                                />
                                {showSuggestions && suggestedTags.length > 0 && (
                                    <div
                                        ref={suggestionRef}
                                        className="absolute left-0 right-0 top-full mt-1 z-10 bg-app-surface border border-[--color-black-10] rounded-[10px] shadow-lg overflow-hidden"
                                    >
                                        {suggestedTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTags((prev) => [...prev, tag.name]);
                                                    setCustomTag("");
                                                    setShowSuggestions(false);
                                                    inputRef.current?.focus();
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[--grey-4] hover:bg-gray-100 transition-colors text-left"
                                            >
                                                {tag.name}
                                                <span className="text-xs text-[--azure-46]">
                                                    {tag.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="outlineSoft"
                                size="hug36"
                                onClick={handleAddCustomTag}
                                disabled={!customTag.trim()}
                                hasIcon
                                icon={<Plus size={16} />}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button variant="outlineSoft" size="hug36" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        variant="dark"
                        size="hug36"
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                    >
                        Отправить
                    </Button>
                </div>
            </div>
        </div>
    );
}
