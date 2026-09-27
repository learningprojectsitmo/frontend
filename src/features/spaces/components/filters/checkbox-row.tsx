import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxRowProps = {
    label: string;
    checked: boolean;
    onChange: () => void;
};

/** Одна строка-чекбокс в стиле `CheckboxGroup`, но без рамки группы и поиска. */
export function CheckboxRow({ label, checked, onChange }: CheckboxRowProps) {
    return (
        <label
            className={cn(
                "flex items-center gap-2.5 h-9 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors",
            )}
        >
            <div
                className={cn(
                    "w-4 h-4 rounded-[5px] border-2 flex items-center justify-center transition-colors shrink-0",
                    checked ? "bg-[#2563EB] border-[#2563EB]" : "border-gray-300 bg-app-surface",
                )}
            >
                {checked && <Check size={12} className="text-white stroke-[3]" />}
            </div>
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
            <span className="text-[13px] font-normal text-gray-900 truncate">{label}</span>
        </label>
    );
}
