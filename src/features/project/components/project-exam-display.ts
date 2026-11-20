import type { Exam, ExamQueue } from "@/types/exam";

export function getProjectExamState(
    exam: Exam,
    queue: ExamQueue | undefined,
    now: number,
    slotsEnd = 0,
) {
    const startsAt = Date.parse(exam.configuration.starts_at);
    const items = queue?.items ?? [];
    const {
        presentation_minutes,
        questions_minutes,
        transition_minutes,
        assessment_window_minutes,
    } = exam.configuration;
    const defaultEnd =
        startsAt +
        60_000 *
            (presentation_minutes +
                questions_minutes +
                transition_minutes +
                assessment_window_minutes);
    const lastFinish = Math.max(
        0,
        ...items.map(({ attempt }) => Date.parse(attempt?.finished_at ?? "") || 0),
    );
    const scheduledEnd =
        Math.max(slotsEnd, ...items.map((item) => Date.parse(item.planned_end_at ?? "") || 0)) ||
        defaultEnd;
    const active = items.some((item) => item.state === "running");
    if (active) return { status: "running" as const, end: scheduledEnd };
    if (
        lastFinish &&
        items.every((item) => item.state === "finished" || item.state === "no_show")
    ) {
        return { status: "finished" as const, end: lastFinish };
    }
    if (now < startsAt) return { status: "upcoming" as const, end: startsAt };
    if (
        now < scheduledEnd ||
        (lastFinish > 0 &&
            items.some((item) => item.state === "waiting" || item.state === "postponed"))
    ) {
        return { status: "running" as const, end: scheduledEnd };
    }
    return { status: "finished" as const, end: lastFinish || scheduledEnd };
}

const pluralRules = new Intl.PluralRules("ru");
const dayForms: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "день", few: "дня" };
const hourForms: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "час", few: "часа" };

export function formatExamCountdown(milliseconds: number): string {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    // Show seconds on the last day for a precise start, and use days and hours for longer waits.
    if (days > 0) {
        const day = pluralRules.select(days);
        const hour = pluralRules.select(hours);
        return `${days} ${dayForms[day] ?? "дней"} ${hours} ${hourForms[hour] ?? "часов"}`;
    }
    return [hours, Math.floor((seconds % 3600) / 60), seconds % 60]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}
