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
                className="flex items-center justify-between w-full h-11 px-3 rounded-[10px] hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">{icon}</span>
                    <span className="text-[13px] font-semibold text-gray-900">{label}</span>
                    {count !== undefined && count > 0 && (
                        <span className="text-[12px] text-gray-500">{count}</span>
                    )}
                </div>
                <ChevronDown
                    size={16}
                    className={cn("text-gray-500 transition-transform", open && "rotate-180")}
                    style={{ transitionDuration: "160ms" }}
                />
            </button>
            {open && <div className="px-3 pb-3 pt-1 border-b border-gray-100">{children}</div>}
        </div>
    );
}
