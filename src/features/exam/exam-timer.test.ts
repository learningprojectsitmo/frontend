import { describe, expect, it } from "vitest";
import type { Attempt } from "@/types/exam";
import { getExamTimer } from "./exam-timer";

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
