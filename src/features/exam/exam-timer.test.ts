// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { Attempt, QueueItem } from "@/types/exam";
import {
    getExamAutoStartState,
    getExamTimer,
    getExamTransitionTimer,
    readExamAutoStart,
    writeExamAutoStart,
} from "./exam-timer";

const start = Date.parse("2026-11-19T12:00:00Z");
const iso = (time: number) => new Date(time).toISOString();
const configuration = { presentation_minutes: 7, questions_minutes: 2 };
const attempt = {
    status: "speaking",
    server_now: iso(start),
    phase_deadline: iso(start + 420_000),
    paused_at: null,
} as Attempt;

describe("getExamTimer", () => {
    it("stays in the server phase when its deadline passes", () => {
        expect(getExamTimer(attempt, configuration, start, start + 425_000)).toEqual({
            remaining: -5,
            total: 420,
            stage: { label: "Защита" },
        });
    });

    it("uses the new deadline once the server switches to questions", () => {
        const questions = {
            ...attempt,
            status: "questions" as const,
            server_now: iso(start + 50_000),
            phase_deadline: iso(start + 170_000),
        };
        expect(getExamTimer(questions, configuration, start, start + 3000)).toEqual({
            remaining: 117,
            total: 120,
            stage: { label: "Вопросы" },
        });
    });

    it("keeps the countdown frozen at the server pause time", () => {
        const paused = { ...attempt, paused_at: iso(start + 2500) };
        expect(getExamTimer(paused, configuration, start, start + 60_000).remaining).toBe(418);
    });

    it("uses the shifted deadline when resuming", () => {
        const resumed = {
            ...attempt,
            server_now: iso(start + 60_000),
            phase_deadline: iso(start + 480_000),
        };
        expect(getExamTimer(resumed, configuration, start, start + 6000).remaining).toBe(414);
    });
});

describe("getExamTransitionTimer", () => {
    const finished = {
        attempt: { ...attempt, status: "finished", finished_at: iso(start) },
    } as QueueItem;

    it("counts from the server finish time without continuing into overtime", () => {
        expect(getExamTransitionTimer([finished], 2, start + 25_000)).toEqual({
            remaining: 95,
            total: 120,
            stage: { label: "Переход между командами" },
        });
        expect(getExamTransitionTimer([finished], 2, start + 120_000)).toBeNull();
    });

    it("does not show a transition before the first defense or when disabled", () => {
        expect(getExamTransitionTimer([], 2, start)).toBeNull();
        expect(getExamTransitionTimer([finished], 0, start)).toBeNull();
    });

    it("does not reuse a past transition after a newer defense was postponed", () => {
        const postponed = {
            attempt: { ...attempt, status: "postponed", postponed_at: iso(start + 30_000) },
        } as QueueItem;
        expect(getExamTransitionTimer([postponed, finished], 2, start + 40_000)).toBeNull();
    });
});

describe("automatic start after a transition", () => {
    const finished = {
        registration_id: 1,
        state: "finished",
        attempt: { ...attempt, id: 10, status: "finished", finished_at: iso(start) },
    } as QueueItem;
    const following = {
        registration_id: 2,
        position: 1,
        state: "waiting",
        attempt: null,
    } as QueueItem;
    const plan = {
        finishedAttemptId: 10,
        registrationId: 2,
        transitionMinutes: 1,
        deadline: start + 60_000,
    };

    const snapshot = (...items: QueueItem[]) => ({ items, eta_stale: false });

    it("restores the explicitly queued transition on a reload of the same exam", () => {
        const key = "exam-auto-start:11:1";
        window.sessionStorage.clear();
        writeExamAutoStart(key, plan);
        const restored = readExamAutoStart(key);
        expect(restored).toEqual(plan);
        expect(readExamAutoStart("exam-auto-start:11:2")).toBeNull();
        expect(getExamAutoStartState(restored!, snapshot(finished, following), plan.deadline)).toBe(
            "ready",
        );
        writeExamAutoStart(key, null);
        expect(readExamAutoStart(key)).toBeNull();
    });

    it("waits until the deadline and starts immediately for a zero-minute transition", () => {
        const items = snapshot(finished, following);
        expect(getExamAutoStartState(plan, items, start + 59_999)).toBe("waiting");
        expect(getExamAutoStartState(plan, items, start + 60_000)).toBe("ready");
        expect(
            getExamAutoStartState({ ...plan, deadline: start, transitionMinutes: 0 }, items, start),
        ).toBe("ready");
    });

    it("does not start or cancel from a queue snapshot the server marked stale", () => {
        const stale = { items: [], eta_stale: true };
        expect(getExamAutoStartState(plan, stale, plan.deadline)).toBe("waiting");
    });

    it("cancels when another team becomes next or a different attempt has started", () => {
        expect(
            getExamAutoStartState(
                plan,
                snapshot(finished, { ...following, registration_id: 3 }),
                start,
            ),
        ).toBe("changed");
        const running = { ...following, state: "running", position: null } satisfies QueueItem;
        expect(getExamAutoStartState(plan, snapshot(finished, following, running), start)).toBe(
            "changed",
        );
        const newer = {
            ...finished,
            attempt: { ...finished.attempt!, id: 11, finished_at: iso(start + 1000) },
        };
        expect(
            getExamAutoStartState(plan, snapshot(finished, newer, following), start + 60_000),
        ).toBe("changed");
    });
});
