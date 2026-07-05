import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApplyForProject } from "@/lib/projects";
import { useProfile } from "@/lib/profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { BackendVacancy } from "@/types/api";

type ApplyDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: number;
    vacancies: BackendVacancy[];
};

export const ApplyDialog = ({ open, onOpenChange, projectId, vacancies }: ApplyDialogProps) => {
    const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
    const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
    const applyMutation = useApplyForProject();
    const { data: profile } = useProfile();
    const resumes = profile?.resumes ?? [];

    const handleSubmit = () => {
        applyMutation.mutate(
            { projectId, vacancyId: selectedVacancyId, resumeId: selectedResumeId },
            {
                onSuccess: () => {
                    toast.success("Отклик отправлен");
                    setSelectedVacancyId(null);
                    setSelectedResumeId(null);
                    onOpenChange(false);
                },
                onError: (error) => {
                    toast.error(error?.message || "Не удалось откликнуться");
                },
            },
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setSelectedVacancyId(null);
            setSelectedResumeId(null);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Откликнуться на проект</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {vacancies.length > 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-[#0A0A0A]">Выберите роль:</p>
                            {vacancies.map((vacancy) => (
                                <button
                                    key={vacancy.id}
                                    type="button"
                                    onClick={() => setSelectedVacancyId(vacancy.id)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all",
                                        selectedVacancyId === vacancy.id
                                            ? "border-[#2B7FFF] bg-blue-50 ring-1 ring-[#2B7FFF]"
                                            : "border-gray-200 bg-white hover:border-gray-300",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[15px] font-semibold text-[#0A0A0A]">
                                                    {vacancy.title}
                                                </span>
                                                {vacancy.required_count > 0 && (
                                                    <span className="text-[11px] font-medium text-[#4A5565] bg-gray-100 px-1.5 py-0.5 rounded-md">
                                                        осталось {vacancy.required_count}
                                                    </span>
                                                )}
                                            </div>
                                            {vacancy.tasks.length > 0 && (
                                                <div className="mt-1.5 flex flex-col gap-0.5">
                                                    {vacancy.tasks.map((task, i) => (
                                                        <div
                                                            key={i}
                                                            className="text-[13px] text-[#4A5565] flex items-center gap-1.5"
                                                        >
                                                            <span className="w-1 h-1 rounded-full bg-[#4A5565] shrink-0" />
                                                            {task}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {selectedVacancyId === vacancy.id && (
                                            <div className="w-5 h-5 rounded-full bg-[#2B7FFF] flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="size-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[#4A5565]">
                            В проекте нет указанных ролей. Вы можете просто откликнуться.
                        </p>
                    )}

                    {resumes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-[#0A0A0A]">
                                Прикрепить резюме (необязательно):
                            </p>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {resumes.map((resume) => (
                                    <button
                                        key={resume.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedResumeId(
                                                selectedResumeId === resume.id ? null : resume.id,
                                            )
                                        }
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg border transition-all text-sm",
                                            selectedResumeId === resume.id
                                                ? "border-[#2B7FFF] bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-300",
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-[#0A0A0A]">
                                                {resume.header}
                                            </span>
                                            {selectedResumeId === resume.id && (
                                                <Check className="size-4 text-[#2B7FFF]" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="hug36"
                        onClick={() => handleOpenChange(false)}
                    >
                        Отмена
                    </Button>
                    <Button
                        type="button"
                        variant="dark"
                        size="hug36"
                        disabled={applyMutation.isPending}
                        onClick={handleSubmit}
                    >
                        {applyMutation.isPending ? "Отправка..." : "Отправить отклик"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
