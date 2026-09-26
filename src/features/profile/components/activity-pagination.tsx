export function ActivityPagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Назад
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-gray-400 text-sm">...</span>
                        )}
                        <button
                            onClick={() => onPageChange(p)}
                            aria-current={p === page ? "page" : undefined}
                            className={`w-8 h-8 text-sm font-medium rounded-[8px] transition-colors ${
                                p === page
                                    ? "bg-[#2563EB] text-white"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            {p}
                        </button>
                    </span>
                ))}

            <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Вперёд
            </button>
        </div>
    );
}
