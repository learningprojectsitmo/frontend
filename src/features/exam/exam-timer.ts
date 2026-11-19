import type { Attempt, ExamConfiguration } from "@/types/exam";

export function getExamTimer(
    attempt: Attempt | null | undefined,
    configuration: Pick<ExamConfiguration, "presentation_minutes" | "questions_minutes">,
    snapshotAt: number,
    now: number,
) {
    if (!attempt) return { remaining: configuration.presentation_minutes * 60, total: configuration.presentation_minutes * 60, stage: null };
    const questions = attempt.status === "questions";
    const stage = { label: questions ? "Вопросы" : "Защита" };
    const clock = attempt.paused_at
        ? Date.parse(attempt.paused_at)
        : Date.parse(attempt.server_now) + Math.max(0, now - snapshotAt);
    const remaining = Math.ceil((Date.parse(attempt.phase_deadline) - clock) / 1000);
    const phaseSeconds = (questions ? configuration.questions_minutes : configuration.presentation_minutes) * 60;
    return { remaining, total: Math.max(phaseSeconds, remaining), stage };
}
