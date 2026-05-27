import { ListFilter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterTriggerProps = {
    activeCount: number;
    open: boolean;
    onClick: () => void;
};

export function FilterTrigger({ activeCount, open, onClick }: FilterTriggerProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-2 h-10 px-[14px] rounded-[10px] text-[13px] font-medium transition-colors",
                "bg-white border border-[#E5E7EB] text-[#111827]",
                "hover:bg-[#F9FAFB]",
            )}
        >
            <ListFilter size={16} className="text-[#6B7280]" />
            <span>Фильтры</span>
            {activeCount > 0 && (
                <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[#2563EB] text-white text-[11px] font-semibold">
                    {activeCount}
                </span>
            )}
            <ChevronDown
                size={16}
                className={cn(
                    "text-[#6B7280] transition-transform",
                    open && "rotate-180",
                )}
                style={{ transitionDuration: "160ms" }}
            />
        </button>
    );
}
