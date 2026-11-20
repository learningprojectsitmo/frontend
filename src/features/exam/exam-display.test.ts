import { describe, expect, it } from "vitest";
import type { Attempt, Exam, ExamQueue, QueueItem } from "@/types/exam";
import { canChangeExamRegistration, formatExamDate, formatExamRegistrationWindow, getExamStatus, getQueueTime, isAssessmentOpen, isExamRegistrationOpen, shouldShowExamSchedule } from "./exam-display";

const start = Date.parse("2026-11-19T10:00:00Z");
const exam: Exam = {
    id: 1,
    workspace_id: 1,
    created_by: 1,
    published_by: 1,
    created_at: "2026-11-01T10:00:00Z",
    published_at: "2026-11-01T11:00:00Z",
    status: "published",
    current_settings_version: 1,
    configuration: {
        starts_at: new Date(start).toISOString(),
        title: "Экзамен",
        description: null,
        connection_url: null,
        project_type_ids: [1],
        registration_opens_at: null,
        registration_closes_at: null,
        weights: { teacher: 100, manager: 0, member: 0 },
        max_score: 25,
        presentation_minutes: 7,
        questions_minutes: 7,
        transition_minutes: 1,
        assessment_window_minutes: 3,
    },
};

const attempt: Attempt = {
    id: 1,
    workspace_id: 1,
    exam_id: 1,
    registration_id: 1,
    project_id: 1,
    project_type_id: 1,
    status: "speaking",
    version: 1,
    settings_version: 1,
    started_at: exam.configuration.starts_at,
    phase_started_at: exam.configuration.starts_at,
    phase_deadline: "2026-11-19T10:07:00Z",
    paused_at: null,
    postponed_at: null,
    postponed_phase: null,
    paused_seconds: 0,
    finished_at: null,
    created_by: 1,
    created_at: exam.configuration.starts_at,
    updated_at: exam.configuration.starts_at,
    remaining_seconds: 420,
    server_now: exam.configuration.starts_at,
    assessment_window: null,
};

const team: QueueItem = {
    registration_id: 1,
    project_id: 1,
    project_type_id: 1,
    slot_id: null,
    planned_start_at: null,
    planned_end_at: null,
    position: 1,
    state: "waiting",
    registration_version: 1,
    started_at: null,
    attempt: null,
};
const queue = (...items: QueueItem[]): ExamQueue => ({
    items,
    queue_revision: 1,
    server_now: exam.configuration.starts_at,
    settings_version: 1,
    eta_stale: false,
    contract_version: 1,
    eta: { current: null, items: [] },
});

describe("exam schedule display", () => {
    it("hides empty schedule rows at the planned time even before the first attempt", () => {
        expect(shouldShowExamSchedule(exam.configuration.starts_at, start - 1, false)).toBe(true);
        expect(shouldShowExamSchedule(exam.configuration.starts_at, start, false)).toBe(false);
    });

    it("hides the schedule when the first team starts early", () => {
        expect(shouldShowExamSchedule(exam.configuration.starts_at, start - 1, true)).toBe(false);
    });
});

describe("exam status", () => {
    it("waits for the teacher when the scheduled start arrives or passes", () => {
        expect(getExamStatus(exam, queue(team), start - 1)).toBe("soon");
        expect(getExamStatus(exam, queue(team), start)).toBe("waiting");
        expect(getExamStatus(exam, queue(team), start + 60 * 60_000)).toBe("waiting");
    });

    it("reports a live defense even after the scheduled end", () => {
        expect(
            getExamStatus(exam, queue({ ...team, state: "running", attempt }), start + 60 * 60_000),
        ).toBe("running");
    });

    it("ends the exam after the last defense and keeps it running between teams", () => {
        const finished: QueueItem = {
            ...team,
            state: "finished",
            attempt: { ...attempt, status: "finished", finished_at: "2026-11-19T10:06:00Z" },
        };
        expect(getExamStatus(exam, queue(finished, { ...team, registration_id: 2 }), start)).toBe(
            "running",
        );
        expect(getExamStatus(exam, queue(finished), start)).toBe("finished");
    });

    it("keeps the last assessment open until the server deadline despite client clock skew", () => {
        const closesAt = start + 180_000;
        const finished: QueueItem = {
            ...team,
            state: "finished",
            attempt: {
                ...attempt,
                status: "finished",
                finished_at: exam.configuration.starts_at,
                assessment_window: {
                    opened_at: exam.configuration.starts_at,
                    closes_at: new Date(closesAt).toISOString(),
                    project_type_id: 1,
                    settings_version: 1,
                },
            },
        };
        const snapshot = queue(finished);
        const receivedAt = start + 3600_000;

        expect(isAssessmentOpen(team, start)).toBe(false);
        expect(isAssessmentOpen(finished, start - 1)).toBe(false);
        expect(isAssessmentOpen(finished, getQueueTime(snapshot, receivedAt, receivedAt))).toBe(true);
        expect(isAssessmentOpen(finished, closesAt)).toBe(false);
        expect(getExamStatus(exam, snapshot, receivedAt + 179_999, receivedAt)).toBe("running");
        expect(getExamStatus(exam, snapshot, receivedAt + 180_000, receivedAt)).toBe("finished");
    });

    it("marks a past exam with only no-shows as passed", () => {
        expect(getExamStatus(exam, queue({ ...team, state: "no_show" }), start + 60 * 60_000)).toBe(
            "passed",
        );
    });
});

describe("exam registration period", () => {
    it("prints the effective registration interval rather than the raw configuration", () => {
        const opensAt = new Date(start - 60_000).toISOString();
        const publishedAt = new Date(start - 30_000).toISOString();
        const closesAt = new Date(start - 5_000).toISOString();
        const publishedExam: Exam = {
            ...exam,
            published_at: publishedAt,
            configuration: { ...exam.configuration, registration_opens_at: opensAt, registration_closes_at: closesAt },
        };
        expect(formatExamRegistrationWindow(publishedExam)).toBe(
            `Запись с ${formatExamDate(publishedAt)} до ${formatExamDate(closesAt)}.`,
        );
        expect(formatExamRegistrationWindow({ ...publishedExam, published_at: closesAt })).toContain("нет доступного окна");
    });

    it("leaves registration open until the server's default cutoff at the exam start", () => {
        expect(isExamRegistrationOpen(exam, start - 1)).toBe(true);
        expect(isExamRegistrationOpen(exam, start)).toBe(false);
    });

    it("uses the configured opening and closing times", () => {
        const opens = start - 180_000;
        const closes = start - 60_000;
        const scheduled = {
            ...exam,
            configuration: {
                ...exam.configuration,
                registration_opens_at: new Date(opens).toISOString(),
                registration_closes_at: new Date(closes).toISOString(),
            },
        };
        expect(isExamRegistrationOpen(scheduled, opens - 1)).toBe(false);
        expect(isExamRegistrationOpen(scheduled, opens)).toBe(true);
        expect(isExamRegistrationOpen(scheduled, closes)).toBe(false);
    });
});

describe("exam action eligibility", () => {
    it("keeps registration management separate from management of a started attempt", () => {
        expect(canChangeExamRegistration(team)).toBe(true);
        expect(canChangeExamRegistration({ ...team, state: "no_show" })).toBe(true);
        expect(canChangeExamRegistration({ ...team, state: "postponed", started_at: attempt.started_at })).toBe(false);
        expect(canChangeExamRegistration({ ...team, state: "running", attempt })).toBe(false);
        expect(canChangeExamRegistration({ ...team, state: "finished", attempt })).toBe(false);
    });
});
