import { Rocket, FileText, FolderOpen } from "lucide-react";

const icons = {
    rocket: Rocket,
    "file-text": FileText,
    "folder-open": FolderOpen,
} as const;

type EmptyStateProps = {
    icon: keyof typeof icons;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    const Icon = icons[icon];

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                <Icon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-[14px] text-gray-500 max-w-sm mb-7 leading-relaxed">{description}</p>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="inline-flex items-center h-10 px-5 rounded-[10px] bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors dark:bg-gray-100 dark:hover:bg-gray-200"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
