import type { ResumeData } from "./resume-card";
import { ResumeCard } from "./resume-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

type ResumeListProps = {
    resumes: ResumeData[];
    onResumeClick?: (id: number) => void;
    onCreateClick?: () => void;
    onShare?: (id: number) => void;
    onDelete?: (id: number) => void;
    onToggleVisibility?: (id: number) => void;
    readOnly?: boolean;
};

export function ResumeList({
    resumes,
    onResumeClick,
    onCreateClick,
    onShare,
    onDelete,
    onToggleVisibility,
    readOnly,
}: ResumeListProps) {
    return (
        <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                    {readOnly ? "Резюме" : "Мои резюме"}
                </h2>
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            icon={<Icon name="import" size={14} />}
                            className="text-[13px] font-semibold gap-1.5 rounded-xl px-2 sm:px-3"
                        >
                            Загрузить резюме
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            icon={<Icon name="plus" size={14} />}
                            className="text-[13px] font-semibold gap-1.5 rounded-xl px-2 sm:px-3"
                            onClick={onCreateClick}
                        >
                            <span className="hidden sm:inline">Создать резюме</span>
                        </Button>
                    </div>
                )}
            </div>
            {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                    <Icon name="rocket" size={120} className="text-gray-300 mb-2" />
                    <h3 className="text-[28px] font-bold text-gray-900">
                        {readOnly ? "У пользователя нет резюме" : "У вас пока нет резюме"}
                    </h3>
                    <p className="text-[15px] text-gray-500 mt-2">
                        {readOnly
                            ? "Видимые резюме появятся здесь"
                            : "Создайте резюме или загрузите существующее"}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {resumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            readOnly={readOnly}
                            onClick={() => onResumeClick?.(resume.id)}
                            onShare={onShare ? () => onShare(resume.id) : undefined}
                            onDelete={onDelete ? () => onDelete(resume.id) : undefined}
                            onToggleVisibility={
                                onToggleVisibility ? () => onToggleVisibility(resume.id) : undefined
                            }
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
