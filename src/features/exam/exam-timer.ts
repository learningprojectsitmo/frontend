import type { Attempt, ExamConfiguration } from "@/types/exam";

export const timerStages = [
    { key: "transition", label: "Переход" },
    { key: "defense", label: "Защита" },
    { key: "questions", label: "Вопросы" },
] as const;

export type TimerDurations = Record<(typeof timerStages)[number]["key"], number>;

export function defaultTimerDurations(configuration: ExamConfiguration): TimerDurations {
    return {
        transition: configuration.transition_minutes * 60,
        defense: configuration.presentation_minutes * 60,
        questions: configuration.questions_minutes * 60,
    };
}

export function timerDuration({ transition, defense, questions }: TimerDurations) {
    return transition + defense + questions;
}

export function getExamTimer(
    attempt: Attempt | null | undefined,
    durations: TimerDurations,
    defaults: TimerDurations,
    snapshotAt: number,
    now: number,
    initialDelayMs = 0,
) {
    const total = timerDuration(durations);
    if (!attempt) return { remaining: total, total, stage: null };

    const clock = attempt.paused_at
        ? Date.parse(attempt.paused_at)
        : Date.parse(attempt.server_now) + Math.max(0, now - snapshotAt);
    const serverRemaining = Date.parse(attempt.phase_deadline) - clock;
    // REST clocks only one phase. Use its elapsed time so pauses and restarts
    // remain anchored to the server while the detail page sequences its stages.
    const questions = attempt.status === "questions";
    const phaseElapsed = Math.max(0, (questions ? defaults.questions : defaults.defense) * 1000 - serverRemaining - initialDelayMs) / 1000;
    const elapsed = questions ? durations.transition + durations.defense + phaseElapsed : phaseElapsed;
    const stage = elapsed < durations.transition ? timerStages[0]
        : elapsed < durations.transition + durations.defense ? timerStages[1]
        : timerStages[2];

    return { remaining: Math.ceil(total - elapsed), total, stage };
}
