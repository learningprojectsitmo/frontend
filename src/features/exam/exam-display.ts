import type { Exam, ExamQueue } from "@/types/exam";

export type ExamStatus =
    | "soon"
    | "waiting"
    | "running"
    | "finished"
    | "draft"
    | "planned"
    | "passed";

export function getExamStatus(exam: Exam, queue: ExamQueue | undefined, now: number): ExamStatus {
    if (exam.status !== "published") return "draft";

    const items = queue?.items ?? [];
    const unfinished = items.some((item) => item.state === "waiting" || item.state === "postponed");
    if (items.some((item) => item.state === "running")) return "running";
    // The API finishes a team's defense. The whole exam ends once the last team finishes.
    if (items.some((item) => item.attempt?.finished_at)) return unfinished ? "running" : "finished";
    if (items.some((item) => item.attempt?.started_at)) return "running";

    const startsAt = Date.parse(exam.configuration.starts_at);
    if (now < startsAt) return startsAt - now <= 7 * 24 * 60 * 60 * 1000 ? "soon" : "planned";

    const {
        presentation_minutes,
        questions_minutes,
        transition_minutes,
        assessment_window_minutes,
    } = exam.configuration;
    const estimatedEnd =
        startsAt +
        60_000 *
            (presentation_minutes +
                questions_minutes +
                transition_minutes +
                assessment_window_minutes);
    const scheduledEnd = items.reduce(
        (end, item) => Math.max(end, Date.parse(item.planned_end_at ?? "") || 0),
        estimatedEnd,
    );
    return items.length > 0 && !unfinished && now >= scheduledEnd ? "passed" : "waiting";
}

export const isExamOver = (status: ExamStatus) => status === "finished" || status === "passed";

export const statusMeta: Record<ExamStatus, { label: string; className: string }> = {
    waiting: { label: "Ожидается начало", className: "bg-[--status-inprogress-bg] text-blue-800 dark:text-blue-300" },
    finished: { label: "Завершён", className: "bg-[--status-planned-bg] text-gray-700" },
    soon: { label: "Скоро", className: "bg-app-badge-amber text-app-badge-amber-fg" },
    running: { label: "Идёт", className: "bg-[--status-completed-bg] text-green-800 dark:text-green-300" },
    draft: { label: "Черновик", className: "bg-gray-100 text-gray-600" },
    planned: { label: "Запланирован", className: "bg-app-ghost text-gray-600" },
    passed: { label: "Экзамен прошёл", className: "bg-[--status-planned-bg] text-gray-700" },
};

const statusPriority: Record<ExamStatus, number> = {
    running: 0,
    waiting: 1,
    soon: 2,
    planned: 3,
    finished: 4,
    passed: 5,
    draft: 6,
};

export function sortExamsByRelevance(exams: Exam[], statusByExam: ReadonlyMap<number, ExamStatus>) {
    return [...exams].sort((a, b) => {
        const statusDiff =
            statusPriority[statusByExam.get(a.id) ?? "draft"] -
            statusPriority[statusByExam.get(b.id) ?? "draft"];
        if (statusDiff !== 0) return statusDiff;

        const dateDiff =
            new Date(a.configuration.starts_at).getTime() -
            new Date(b.configuration.starts_at).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.id - b.id;
    });
}

export function formatExamDate(value: string) {
    return new Date(value).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const formatExamTime = (value: string) =>
    new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
