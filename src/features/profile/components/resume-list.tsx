import type { ResumeData } from "./resume-card";
import { ResumeCard } from "./resume-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

type ResumeListProps = {
    resumes: ResumeData[];
    onResumeClick?: (id: number) => void;
};

export function ResumeList({ resumes, onResumeClick }: ResumeListProps) {
    return (
        <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-gray-900">Мои резюме</h2>
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
                    >
                        <span className="hidden sm:inline">Создать резюме</span>
                    </Button>
                </div>
            </div>
            {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                    <Icon name="rocket" size={120} className="text-gray-300 mb-6" />
                    <h3 className="text-[28px] font-bold text-gray-900">У вас пока нет резюме</h3>
                    <p className="text-[15px] text-gray-500 mt-2">
                        Создайте резюме или загрузите существующее
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {resumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            onClick={() => onResumeClick?.(resume.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
