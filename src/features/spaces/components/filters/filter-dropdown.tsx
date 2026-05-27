import { useEffect, useRef, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

type FilterDropdownProps = {
    open: boolean;
    onClose: () => void;
    onReset: () => void;
    children: ReactNode;
};

export function FilterDropdown({ open, onClose, onReset, children }: FilterDropdownProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }

        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <>
            <div
                ref={ref}
                className="absolute top-full mt-2 right-0 z-[110] w-[320px] bg-white border border-[#E5E7EB] rounded-[18px] shadow-[0_10px_15px_rgba(0,0,0,0.05),0_25px_50px_rgba(0,0,0,0.12)] p-2 animate-filter-in"
            >
                <div className="flex flex-col gap-1">
                    {children}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        onReset();
                        onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 w-full mt-1 py-2.5 text-[13px] font-medium text-[#EF4444] hover:text-[#DC2626] transition-colors rounded-[10px] hover:bg-[#FEF2F2]"
                >
                    <RotateCcw size={14} />
                    Сбросить фильтры
                </button>
            </div>
        </>
    );
}
