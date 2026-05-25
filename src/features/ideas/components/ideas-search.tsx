import { Search, ArrowUpDown } from "lucide-react";
import type { IdeasSort } from "../types";

type IdeasSearchProps = {
    search: string;
    sort: IdeasSort;
    onSearchChange: (value: string) => void;
    onSortChange: (value: IdeasSort) => void;
};

export function IdeasSearch({ search, sort, onSearchChange, onSortChange }: IdeasSearchProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--azure-46]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Поиск по идеям"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
                />
            </div>
            <div className="relative">
                <select
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value as IdeasSort)}
                    className="appearance-none h-11 pl-4 pr-10 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors cursor-pointer"
                >
                    <option value="newest">Сначала новые</option>
                    <option value="popular">Популярные</option>
                </select>
                <ArrowUpDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[--azure-46] pointer-events-none" />
            </div>
        </div>
    );
}
