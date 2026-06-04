import { Lightbulb, CircleDot, XCircle, CheckCircle2, List, User } from "lucide-react";
import type { IdeaStatus } from "../types";

type StatusMenuProps = {
    current: IdeaStatus | "all";
    showOnlyMine: boolean;
    onStatusChange: (status: IdeaStatus | "all") => void;
    onMineToggle: () => void;
};

const items: { key: IdeaStatus | "all"; label: string; icon: typeof Lightbulb }[] = [
    { key: "new", label: "Новые идеи", icon: Lightbulb },
    { key: "planned", label: "Запланировано", icon: CircleDot },
    { key: "declined", label: "Отклонено", icon: XCircle },
    { key: "implemented", label: "Реализовано", icon: CheckCircle2 },
];

export function StatusMenu({
    current,
    showOnlyMine,
    onStatusChange,
    onMineToggle,
}: StatusMenuProps) {
    return (
        <div className="bg-white border border-[--color-black-10] rounded-[14px] p-2">
            <div className="space-y-0.5">
                <button
                    type="button"
                    onClick={() => onStatusChange("all")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        current === "all" && !showOnlyMine
                            ? "bg-[--azure-60]/10 text-[--azure-60] border-l-[3px] border-[--azure-60] rounded-l-none"
                            : "text-[--azure-46] hover:bg-[#F3F4F6] hover:text-[--grey-4]"
                    }`}
                >
                    <List size={18} />
                    Все
                </button>
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => onStatusChange(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            current === item.key
                                ? "bg-[--azure-60]/10 text-[--azure-60] border-l-[3px] border-[--azure-60] rounded-l-none"
                                : "text-[--azure-46] hover:bg-[#F3F4F6] hover:text-[--grey-4]"
                        }`}
                    >
                        <item.icon size={18} />
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="border-t border-[--color-black-10] mt-2 pt-2">
                <button
                    type="button"
                    onClick={onMineToggle}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        showOnlyMine
                            ? "bg-[--azure-60]/10 text-[--azure-60] border-l-[3px] border-[--azure-60] rounded-l-none"
                            : "text-[--azure-46] hover:bg-[#F3F4F6] hover:text-[--grey-4]"
                    }`}
                >
                    <User size={18} />
                    Мои идеи
                </button>
            </div>
        </div>
    );
}
