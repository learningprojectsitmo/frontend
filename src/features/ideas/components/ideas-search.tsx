import { Search, ArrowUpDown, Check } from "lucide-react";
import type { IdeasSort } from "../types";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown/dropdown-menu";

type IdeasSearchProps = {
    search: string;
    sort: IdeasSort;
    onSearchChange: (value: string) => void;
    onSortChange: (value: IdeasSort) => void;
};

const sortLabels: Record<IdeasSort, string> = {
    newest: "Сначала новые",
    popular: "Популярные",
};

export function IdeasSearch({ search, sort, onSearchChange, onSortChange }: IdeasSearchProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--azure-46]"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Поиск по идеям"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] placeholder:text-[--azure-46] outline-none focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-2 h-11 px-4 bg-white border border-[--color-black-10] rounded-[12px] text-sm text-[--grey-4] outline-none hover:border-[--azure-60] focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20 transition-colors"
                    >
                        <ArrowUpDown size={16} className="text-[--azure-46]" />
                        {sortLabels[sort]}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    {(["newest", "popular"] as IdeasSort[]).map((value) => (
                        <DropdownMenuItem
                            key={value}
                            onClick={() => onSortChange(value)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            {sortLabels[value]}
                            {sort === value && <Check size={16} className="text-[--azure-60]" />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
