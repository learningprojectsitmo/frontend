import { Icon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch/switch";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown/dropdown-menu";

export type ResumeData = {
    id: number;
    position: string;
    views: string;
    invitations: string;
    lastUpdated: string;
    isVisible: boolean;
};

export function mapResumeFromApi(item: import("@/types/api").ResumeFull): ResumeData {
    return {
        id: item.id,
        position: item.header,
        views: String(item.views_count ?? 0),
        invitations: String(item.invitations_count ?? 0),
        lastUpdated: item.updated_at ? new Date(item.updated_at).toLocaleDateString("ru-RU") : "—",
        isVisible: item.is_visible,
    };
}

type ResumeCardProps = {
    resume: ResumeData;
    onClick?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
    onToggleVisibility?: (id: number) => void;
};

export function ResumeCard({
    resume,
    onClick,
    onShare,
    onDelete,
    onToggleVisibility,
}: ResumeCardProps) {
    return (
        <div className="relative w-full text-left rounded-[22px] border border-gray-200 bg-app-surface p-4 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <button
                type="button"
                onClick={onClick}
                aria-label="Открыть резюме"
                className="absolute inset-0 rounded-[22px] cursor-pointer"
            />

            <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-bold text-gray-900 pointer-events-none">
                    {resume.position}
                </h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer relative z-10"
                        >
                            <Icon name="kebab" size={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                        {onShare && (
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onShare();
                                }}
                            >
                                <Icon name="share" size={14} />
                                Поделиться
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <DropdownMenuItem
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onDelete();
                                }}
                            >
                                <Icon name="trash" size={14} />
                                Удалить
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex items-center gap-6 pointer-events-none">
                <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Просмотры
                    </p>
                    <p className="text-xl font-bold text-gray-900">{resume.views}</p>
                </div>

                <div className="w-px h-10 bg-gray-200 shrink-0" />

                <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Приглашения
                    </p>
                    <p className="text-xl font-bold text-gray-900">{resume.invitations}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 pointer-events-none">
                    Последнее изменение: {resume.lastUpdated}
                </span>
                <div className="flex items-center gap-2 relative z-10 pointer-events-auto">
                    <Switch
                        id={`resume-visibility-${resume.id}`}
                        checked={resume.isVisible}
                        onCheckedChange={() => onToggleVisibility?.(resume.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <label
                        htmlFor={`resume-visibility-${resume.id}`}
                        className="text-xs font-medium cursor-pointer"
                    >
                        <span className={resume.isVisible ? "text-green-600" : "text-gray-500"}>
                            {resume.isVisible ? "Видно всем" : "Скрыто"}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}
