import type { Attempt, ExamConfiguration, ExamQueue, QueueItem } from "@/types/exam";

export function getExamTimer(
    attempt: Attempt | null | undefined,
    configuration: Pick<ExamConfiguration, "presentation_minutes" | "questions_minutes">,
    snapshotAt: number,
    now: number,
) {
    if (!attempt)
        return {
            remaining: configuration.presentation_minutes * 60,
            total: configuration.presentation_minutes * 60,
            stage: null,
        };
    const questions = attempt.status === "questions";
    const stage = { label: questions ? "Вопросы" : "Защита" };
    const clock = attempt.paused_at
        ? Date.parse(attempt.paused_at)
        : Date.parse(attempt.server_now) + Math.max(0, now - snapshotAt);
    const remaining = Math.ceil((Date.parse(attempt.phase_deadline) - clock) / 1000);
    const phaseSeconds =
        (questions ? configuration.questions_minutes : configuration.presentation_minutes) * 60;
    return { remaining, total: Math.max(phaseSeconds, remaining), stage };
}

export type ExamAutoStart = {
    finishedAttemptId: number;
    registrationId: number;
    deadline: number;
    transitionMinutes: number;
};

export function readExamAutoStart(key: string): ExamAutoStart | null {
    try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return null;
        const plan = JSON.parse(raw) as Partial<ExamAutoStart> | null;
        if (
            plan &&
            Number.isSafeInteger(plan.finishedAttemptId) &&
            Number.isSafeInteger(plan.registrationId) &&
            Number.isFinite(plan.deadline) &&
            Number.isFinite(plan.transitionMinutes)
        )
            return plan as ExamAutoStart;
    } catch {
        // A blocked session store must not interrupt the running exam.
    }
    return null;
}

export function writeExamAutoStart(key: string, plan: ExamAutoStart | null) {
    try {
        if (plan) window.sessionStorage.setItem(key, JSON.stringify(plan));
        else window.sessionStorage.removeItem(key);
    } catch {
        // The transition can still run in memory for this page.
    }
}

function latestAttempt(items: readonly QueueItem[]) {
    let latest: Attempt | undefined;
    let time = -Infinity;
    for (const { attempt } of items) {
        if (!attempt) continue;
        const timestamp = Date.parse(
            attempt.finished_at ?? attempt.postponed_at ?? attempt.phase_started_at,
        );
        if (timestamp > time) {
            latest = attempt;
            time = timestamp;
        }
    }
    return { attempt: latest, time };
}

export function getExamAutoStartState(
    plan: ExamAutoStart,
    { items, eta_stale }: Pick<ExamQueue, "items" | "eta_stale">,
    serverNow: number,
) {
    if (eta_stale) return "waiting";
    const latest = latestAttempt(items).attempt;
    if (
        items.some((item) => item.state === "running") ||
        latest?.id !== plan.finishedAttemptId ||
        latest.status !== "finished" ||
        !items.some(
            (item) =>
                item.registration_id === plan.registrationId &&
                item.position === 1 &&
                (item.state === "waiting" || item.state === "postponed"),
        )
    )
        return "changed";
    return serverNow >= plan.deadline ? "ready" : "waiting";
}

export function getExamTransitionTimer(
    items: readonly QueueItem[],
    minutes: number,
    serverNow: number,
) {
    const total = minutes * 60;
    if (total <= 0) return null;

    const latest = latestAttempt(items);
    const remaining = Math.min(total, Math.ceil((latest.time + total * 1000 - serverNow) / 1000));
    return latest.attempt?.status === "finished" && remaining > 0
        ? { remaining, total, stage: { label: "Переход между командами" } }
        : null;
}
