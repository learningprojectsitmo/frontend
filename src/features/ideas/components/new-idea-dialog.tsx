import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockTags } from "../api";

type NewIdeaDialogProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string, tags: string[]) => void;
};

export function NewIdeaDialog({ open, onClose, onSubmit }: NewIdeaDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    if (!open) return null;

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit(title.trim(), description.trim(), selectedTags);
        setTitle("");
        setDescription("");
        setSelectedTags([]);
        onClose();
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-[14px] w-full max-w-lg mx-4 p-6 shadow-xl">
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
                            className="w-full h-11 px-4 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
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
                            className="w-full px-4 py-3 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[--grey-4] mb-1.5">
                            Теги
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {mockTags.slice(0, 15).map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.name)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        selectedTags.includes(tag.name)
                                            ? "bg-[--azure-60] text-white"
                                            : "bg-[#F3F4F6] text-[--azure-46] hover:bg-[#E5E7EB]"
                                    }`}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button variant="outlineSoft" size="hug36" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button variant="dark" size="hug36" onClick={handleSubmit} disabled={!title.trim()}>
                        Отправить
                    </Button>
                </div>
            </div>
        </div>
    );
}
