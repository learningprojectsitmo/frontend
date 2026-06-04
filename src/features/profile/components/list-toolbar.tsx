import { Search, List } from "lucide-react";
import { Icon } from "@/components/ui/icons";

type ListToolbarProps = {
    searchPlaceholder?: string;
    searchValue: string;
    onSearch: (q: string) => void;
    filtersCount: number;
    onOpenFilters: () => void;
    viewMode: "grid" | "list";
    onChangeView: (mode: "grid" | "list") => void;
};

export function ListToolbar({
    title,
    searchPlaceholder = "Поиск...",
    searchValue,
    onSearch,
    filtersCount,
    onOpenFilters,
    viewMode,
    onChangeView,
}: ListToolbarProps) {
    return (
        <div className="mb-6 flex items-center justify-between">
            {title && <h2 className="text-lg font-semibold text-app-text">{title}</h2>}

            <div className={`flex items-center gap-3 ${title ? "" : "w-full justify-between"}`}>
                {/* Search */}
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-[240px] h-10 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[14px] text-app-text placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-colors"
                    />
                </div>

                {/* Filters button */}
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className="inline-flex items-center gap-2 h-10 px-[14px] rounded-[10px] bg-white border border-[#E5E7EB] text-[13px] font-medium text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2 4H14M4.5 8H11.5M7 12H9"
                            stroke="#6B7280"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span>Фильтры</span>
                    {filtersCount > 0 && (
                        <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[#2563EB] text-white text-[11px] font-semibold">
                            {filtersCount}
                        </span>
                    )}
                </button>

                {/* Grid/List toggle */}
                <div className="flex items-center h-10 bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => onChangeView("grid")}
                        className={`px-3 h-full flex items-center transition-colors ${
                            viewMode === "grid"
                                ? "bg-[#111827] text-white"
                                : "text-[#6B7280] hover:bg-gray-50"
                        }`}
                    >
                        <Icon name="grid" size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeView("list")}
                        className={`px-3 h-full flex items-center transition-colors ${
                            viewMode === "list"
                                ? "bg-[#111827] text-white"
                                : "text-[#6B7280] hover:bg-gray-50"
                        }`}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
