import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterSectionProps = {
    icon: ReactNode;
    label: string;
    count?: number;
    children: ReactNode;
};

export function FilterSection({ icon, label, count, children }: FilterSectionProps) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center justify-between w-full h-11 px-3 rounded-[10px] hover:bg-[#F3F4F6] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[#6B7280]">{icon}</span>
                    <span className="text-[13px] font-semibold text-[#111827]">{label}</span>
                    {count !== undefined && count > 0 && (
                        <span className="text-[12px] text-[#6B7280]">{count}</span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={cn("text-[#6B7280] transition-transform", open && "rotate-180")}
                    style={{ transitionDuration: "160ms" }}
                />
            </button>
            {open && <div className="px-3 pb-3 pt-1 border-b border-[#F3F4F6]">{children}</div>}
        </div>
    );
}
