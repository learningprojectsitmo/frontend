import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
        <div className="w-full flex flex-col gap-4 border border-app-border rounded-2xl bg-app-surface p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-app-text text-[15px] font-semibold font-sans leading-6">
                    Этапы проекта
                </div>
                {currentIndex >= 0 && (
                    <div className="text-app-muted text-[13px] font-medium font-sans leading-5">
                        Этап {currentIndex + 1} из {stages.length}
                    </div>
                )}
            </div>

            <ol className="flex items-start gap-0 w-full">
                {stages.map((stage, idx) => {
                    const isCurrent = stage.id === currentStageId;
                    const isPassed = idx < currentIndex;
                    const isDone = isPassed || isCurrent;

                    const circleClass =
                        isPassed
                            ? "bg-green-600 text-white border-green-600"
                            : isCurrent
                              ? "bg-[--app-blue] text-white border-[--app-blue] ring-2 ring-[--app-blue]/30"
                              : "bg-app-ghost text-app-muted border-app-border";

                    return (
                        <React.Fragment key={stage.id}>
                            {idx > 0 && (
                                <li
                                    aria-hidden
                                    className={cn(
                                        "flex-1 min-w-4 h-[2px] mt-3.5 rounded-full",
                                        isDone ? "bg-green-600" : "bg-app-border",
                                    )}
                                />
                            )}
                            <li className="flex flex-col items-center gap-1.5 px-1">
                                <span
                                    className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border",
                                        circleClass,
                                    )}
                                >
                                    {isPassed ? "✓" : idx + 1}
                                </span>
                                <span
                                    className={cn(
                                        "text-[13px] font-medium text-center leading-4",
                                        isCurrent ? "text-[--app-blue]" : "text-app-muted",
                                    )}
                                >
                                    {stage.name}
                                    {stage.requires_approval && (
                                        <span
                                            title="Этап требует утверждения преподавателем"
                                            className="ml-0.5 text-[11px]"
                                            style={{
                                                color: "var(--app-badge-amber-fg)",
                                            }}
                                        >
                                            ⚠
                                        </span>
                                    )}
                                </span>
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>

            {pendingApproval && (
                <div
                    className="text-[13px] font-medium leading-5 rounded-lg px-3 py-2"
                    style={{
                        color: "var(--app-badge-amber-fg)",
                        backgroundColor: "var(--app-badge-amber-bg)",
                    }}
                >
                    Этап ожидает утверждения преподавателем
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                {canAdvance && (
                    <Button variant="blue" size="hug36" onClick={() => onAdvance(projectId)}>
                        Далее
                    </Button>
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
