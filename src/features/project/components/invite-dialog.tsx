import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useAcceptResponse, useInviteToProject } from "@/lib/projects";
import { useWorkspaceResumes } from "@/lib/spaces";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Replycant } from "@/types/tables/forTables";
import type { BackendVacancy } from "@/types/api";

type InviteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: number;
    workspaceId: number;
    vacancies: BackendVacancy[];
    replycants: Replycant[];
    memberUserIds: Set<number>;
};

export const InviteDialog = ({
    open,
    onOpenChange,
    projectId,
    workspaceId,
    vacancies,
    replycants,
    memberUserIds,
}: InviteDialogProps) => {
    const [activeTab, setActiveTab] = useState<string>("responses");
    const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
    const acceptResponseMutation = useAcceptResponse();
    const inviteMutation = useInviteToProject();
    const { data: workspaceResumes } = useWorkspaceResumes(workspaceId);

    const pendingResponses = replycants.filter(
        (r) => r.type === "response" && r.responseStatus === "pending",
    );

    const resumeCandidates = (workspaceResumes?.items ?? []).filter(
        (r) =>
            !r.in_team &&
            !memberUserIds.has(r.participant_id) &&
            !pendingResponses.some((p) => p.userId === r.participant_id),
    );

    const handleAccept = (responseId: number) => {
        acceptResponseMutation.mutate(
            { projectId, responseId },
            {
                onSuccess: () => {
                    toast.success("Отклик принят");
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error("Не удалось принять отклик");
                },
            },
        );
    };

    const handleInvite = (userId: number, resumeId: number) => {
        inviteMutation.mutate(
            { projectId, userId, vacancyId: selectedVacancyId, resumeId },
            {
                onSuccess: () => {
                    toast.success("Приглашение отправлено");
                    setSelectedVacancyId(null);
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error("Не удалось отправить приглашение");
                },
            },
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setSelectedVacancyId(null);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Пригласить участника</DialogTitle>
                </DialogHeader>

                <Tabs
                    tabs={[
                        { value: "responses", label: "Из откликов" },
                        { value: "resumes", label: "Из резюме" },
                    ]}
                    value={activeTab}
                    onValueChange={setActiveTab}
                    variant="text"
                />

                {activeTab === "responses" ? (
                    <div className="space-y-2 mt-4">
                        {pendingResponses.length === 0 ? (
                            <p className="text-sm text-gray-600">Нет ожидающих откликов.</p>
                        ) : (
                            pendingResponses.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-app-surface"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold text-gray-900 truncate">
                                            {r.name}
                                        </p>
                                        <p className="text-[13px] text-gray-600 truncate">
                                            {r.role || "Без роли"}
                                        </p>
                                        {r.resumeUrl && (
                                            <a
                                                href={r.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[13px] font-medium text-[#2563EB] hover:text-[#1d4ed8]"
                                            >
                                                Открыть резюме
                                            </a>
                                        )}
                                    </div>
                                    <Button
                                        variant="dark"
                                        size="hug36"
                                        disabled={acceptResponseMutation.isPending}
                                        onClick={() => handleAccept(r.id)}
                                    >
                                        Пригласить
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 mt-4">
                        {vacancies.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">
                                    Выберите роль (необязательно):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {vacancies.map((vacancy) => (
                                        <button
                                            key={vacancy.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedVacancyId(
                                                    selectedVacancyId === vacancy.id
                                                        ? null
                                                        : vacancy.id,
                                                )
                                            }
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all",
                                                selectedVacancyId === vacancy.id
                                                    ? "border-[#2B7FFF] bg-blue-50 text-gray-900"
                                                    : "border-gray-200 bg-app-surface text-gray-600 hover:border-gray-300",
                                            )}
                                        >
                                            {vacancy.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {resumeCandidates.length === 0 ? (
                            <p className="text-sm text-gray-600">
                                Нет доступных резюме для приглашения.
                            </p>
                        ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                {resumeCandidates.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-app-surface"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-semibold text-gray-900 truncate">
                                                {r.participant_name}
                                            </p>
                                            <p className="text-[13px] text-gray-600 truncate">
                                                {r.header}
                                            </p>
                                            {r.skills.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {r.skills.slice(0, 3).map((skill, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="dark"
                                            size="hug36"
                                            disabled={inviteMutation.isPending}
                                            onClick={() => handleInvite(r.participant_id, r.id)}
                                        >
                                            Пригласить
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
