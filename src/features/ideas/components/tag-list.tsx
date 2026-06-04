import type { IdeaTag } from "../types";

type TagListProps = {
    tags: IdeaTag[];
    totalTags: number;
    activeTag: string | null;
    showAll: boolean;
    onTagClick: (tag: string | null) => void;
    onShowMore: () => void;
};

export function TagList({
    tags,
    totalTags,
    activeTag,
    showAll,
    onTagClick,
    onShowMore,
}: TagListProps) {
    return (
        <div className="bg-white border border-[--color-black-10] rounded-[14px] p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Теги</h3>
            {tags.length === 0 ? (
                <div className="text-center py-6">
                    <p className="text-sm font-semibold text-gray-800 mb-1">Тегов пока нет</p>
                    <p className="text-xs text-gray-500">
                        Создайте идею с тегом, и он появится здесь
                    </p>
                </div>
            ) : (
                <div className="space-y-0.5">
                    {tags.map((tag) => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => onTagClick(activeTag === tag.name ? null : tag.name)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                                activeTag === tag.name
                                    ? "bg-[--azure-60]/10 text-[--azure-60] font-medium"
                                    : "text-[--azure-46] hover:bg-[#F3F4F6] hover:text-[--grey-4]"
                            }`}
                        >
                            <span>{tag.name}</span>
                            <span className="text-xs text-[--azure-46]">{tag.count}</span>
                        </button>
                    ))}
                </div>
            )}
            {!showAll && totalTags > tags.length && (
                <button
                    type="button"
                    onClick={onShowMore}
                    className="w-full text-left px-3 py-2 mt-1 text-sm text-[--azure-60] hover:text-[--azure-54] font-medium transition-colors"
                >
                    Показать еще {totalTags - tags.length} тегов
                </button>
            )}
        </div>
    );
}
