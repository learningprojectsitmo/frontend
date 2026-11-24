import { getExamQueueReceivedAt } from "./exam-queue-snapshot";
import type { Exam, ExamConfiguration, ExamQueue, QueueItem } from "@/types/exam";

export type ExamStatus =
    | "soon"
    | "waiting"
    | "running"
    | "finished"
    | "draft"
    | "planned"
    | "passed";

export function canChangeExamRegistration(item: QueueItem) {
    return (
        !item.started_at && !item.attempt && item.state !== "running" && item.state !== "finished"
    );
}

export function isAssessmentOpen(item: QueueItem, serverNow: number) {
    const window = item.attempt?.assessment_window;
    return (
        item.state === "finished" &&
        Boolean(
            window &&
            Date.parse(window.opened_at) <= serverNow &&
            serverNow < Date.parse(window.closes_at),
        )
    );
}

export function getQueueTime(queue: ExamQueue | undefined, now: number, receivedAt: number) {
    return queue
        ? Date.parse(queue.server_now) +
              Math.max(0, now - getExamQueueReceivedAt(queue, receivedAt))
        : now;
}

export function shouldShowExamSchedule(startsAt: string, serverNow: number, hasStarted: boolean) {
    return !hasStarted && serverNow < Date.parse(startsAt);
}

export function getExamStatus(
    exam: Exam,
    queue: ExamQueue | undefined,
    now: number,
    receivedAt?: number,
): ExamStatus {
    if (exam.status !== "published") return "draft";

    if (exam.completed_at || exam.archived_at) return "finished";

    const items = queue?.items ?? [];
    const serverNow = receivedAt === undefined ? now : getQueueTime(queue, now, receivedAt);
    if (items.some((item) => item.state === "running" || item.attempt?.started_at)) {
        return "running";
    }
    const startsAt = Date.parse(exam.configuration.starts_at);
    if (serverNow < startsAt)
        return startsAt - serverNow <= 7 * 24 * 60 * 60 * 1000 ? "soon" : "planned";
    return "waiting";
}

export const isExamOver = (status: ExamStatus) => status === "finished" || status === "passed";

export const statusMeta: Record<ExamStatus, { label: string; className: string }> = {
    waiting: {
        label: "Ожидается начало",
        className: "bg-[--status-inprogress-bg] text-blue-800 dark:text-blue-300",
    },
    finished: {
        label: "Завершён",
        className: "bg-[--status-planned-bg] text-gray-700 dark:text-slate-200",
    },
    soon: { label: "Скоро", className: "bg-app-badge-amber text-app-badge-amber-fg" },
    running: {
        label: "Идёт",
        className: "bg-[--status-completed-bg] text-green-800 dark:text-green-300",
    },
    draft: {
        label: "Черновик",
        className: "bg-gray-100 dark:bg-app-ghost text-gray-600 dark:text-app-muted",
    },
    planned: { label: "Запланирован", className: "bg-app-ghost text-gray-600 dark:text-app-muted" },
    passed: {
        label: "Экзамен прошёл",
        className: "bg-[--status-planned-bg] text-gray-700 dark:text-slate-200",
    },
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
        hourCycle: "h23",
    });
}

export const formatExamTime = (value: string) =>
    new Date(value).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

export function getRegistrationDeadline(configuration: ExamConfiguration) {
    return Math.min(
        Date.parse(configuration.starts_at),
        configuration.registration_closes_at
            ? Date.parse(configuration.registration_closes_at)
            : Infinity,
    );
}

export function getExamRegistrationWindow(exam: Exam) {
    return {
        opens: Math.max(
            Date.parse(exam.published_at ?? ""),
            exam.configuration.registration_opens_at
                ? Date.parse(exam.configuration.registration_opens_at)
                : -Infinity,
        ),
        closes: getRegistrationDeadline(exam.configuration),
    };
}

export function formatExamRegistrationWindow(exam: Exam) {
    const { opens, closes } = getExamRegistrationWindow(exam);
    if (!Number.isFinite(opens) || !Number.isFinite(closes) || opens >= closes)
        return "У этого экзамена нет доступного окна записи.";
    return `Запись с ${formatExamDate(new Date(opens).toISOString())} до ${formatExamDate(new Date(closes).toISOString())}.`;
}

export function isExamRegistrationOpen(exam: Exam, now: number) {
    const { opens, closes } = getExamRegistrationWindow(exam);
    return (
        exam.status === "published" &&
        !exam.completed_at &&
        !exam.archived_at &&
        opens <= now &&
        now < closes
    );
}
