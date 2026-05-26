import { Icon } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/button/icon-button";

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
        views: "—",
        invitations: "—",
        lastUpdated: item.updated_at ? new Date(item.updated_at).toLocaleDateString("ru-RU") : "—",
        isVisible: true,
    };
}

type ResumeCardProps = {
    resume: ResumeData;
    onClick?: () => void;
};

export function ResumeCard({ resume, onClick }: ResumeCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left rounded-[22px] border border-gray-200 bg-white p-4 sm:p-6 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-gray-900">{resume.position}</h3>
                <IconButton
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600"
                    icon={<Icon name="kebab" size={16} />}
                    variant="ghost"
                />
            </div>

            <div className="flex items-center gap-6">
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
                <span className="text-xs text-gray-400">
                    Последнее изменение: {resume.lastUpdated}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Icon
                        name={resume.isVisible ? "eye-on" : "eye-off"}
                        size={14}
                        className={resume.isVisible ? "text-green-500" : "text-gray-400"}
                    />
                    <span className={resume.isVisible ? "text-green-600" : "text-gray-500"}>
                        {resume.isVisible ? "Видно всем" : "Скрыто"}
                    </span>
                </div>
            </div>
        </button>
    );
}
