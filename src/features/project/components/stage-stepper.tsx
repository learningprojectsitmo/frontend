import * as React from "react";
import { ApproveStageDialog, RejectStageDialog } from "./stage-dialogs";
import type { BackendProjectStage } from "@/types/api";

interface StageStepperProps {
    stages: BackendProjectStage[];
    currentStageId: number | null;
    pendingApproval: boolean;
    isCurrentUserAuthor: boolean;
    isTeacher: boolean;
    onAdvance: (projectId: number) => void;
    onApprove: (projectId: number) => void;
    onReject: (projectId: number, comment?: string | null) => void;
    projectId: number;
}

export const StageStepper = ({
    stages,
    currentStageId,
    pendingApproval,
    isCurrentUserAuthor,
    isTeacher,
    onAdvance,
    onApprove,
    onReject,
    projectId,
}: StageStepperProps) => {
    if (!stages || stages.length === 0) {
        return null;
    }

    const currentIndex = stages.findIndex((s) => s.id === currentStageId);
    const canAdvance = isCurrentUserAuthor && !pendingApproval && currentIndex < stages.length - 1;
    const canAct = pendingApproval && isTeacher;

    return (
        <div className="w-full flex flex-col gap-3 border border-gray-200 rounded-2xl bg-app-surface p-4">
            <div className="text-gray-900 text-[15px] font-semibold font-sans leading-6">
                Этапы проекта
            </div>
            <ol className="flex items-center gap-2 flex-wrap">
                {stages.map((stage, idx) => {
                    const isCurrent = stage.id === currentStageId;
                    const isPassed = idx < currentIndex;
                    const stateClass = isPassed
                        ? "bg-[#00C950] text-white border-[#00C950]"
                        : isCurrent
                          ? "bg-[#2B7FFF] text-white border-[#2B7FFF]"
                          : "bg-gray-200 text-gray-500 border-gray-300";
                    return (
                        <li key={stage.id} className="flex items-center gap-2">
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold ${stateClass}`}
                            >
                                {isPassed ? "✓" : idx + 1}
                            </span>
                            <span
                                className={`text-[13px] font-medium ${isCurrent ? "text-[#2B7FFF]" : "text-gray-600"}`}
                            >
                                {stage.name}
                                {stage.requires_approval && (
                                    <span
                                        title="Этап требует утверждения преподавателем"
                                        className="ml-1 text-[11px] text-amber-500"
                                    >
                                        ⚠
                                    </span>
                                )}
                            </span>
                            {idx < stages.length - 1 && <span className="text-gray-300">→</span>}
                        </li>
                    );
                })}
            </ol>

            {pendingApproval && (
                <div className="text-amber-700 text-[13px] font-medium leading-5">
                    Этап ожидает утверждения преподавателем
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                {canAdvance && (
                    <button
                        type="button"
                        onClick={() => onAdvance(projectId)}
                        className="h-9 px-3 rounded-lg bg-[#2B7FFF] text-white text-[13px] font-semibold"
                    >
                        Далее
                    </button>
                )}
                {canAct && (
                    <>
                        <ApproveStageDialog
                            stageName={stages[currentIndex]?.name ?? "текущего этапа"}
                            onConfirm={() => onApprove(projectId)}
                        />
                        <RejectStageDialog
                            stageName={stages[currentIndex]?.name ?? "текущего этапа"}
                            onConfirm={(comment) => onReject(projectId, comment)}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

StageStepper.displayName = "StageStepper";
