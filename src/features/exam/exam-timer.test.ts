import { describe, expect, it } from "vitest";
import type { Attempt } from "@/types/exam";
import { getExamTimer } from "./exam-timer";

const start = Date.parse("2026-11-19T12:00:00Z");
const iso = (time: number) => new Date(time).toISOString();
const defaults = { transition: 60, defense: 420, questions: 120 };
const custom = { transition: 5, defense: 10, questions: 3 };
const attempt = {
    status: "speaking",
    server_now: iso(start),
    phase_deadline: iso(start + 420_000),
    paused_at: null,
} as Attempt;

describe("getExamTimer", () => {
    it("runs all three local stages and counts up after the deadline", () => {
        const read = (elapsed: number) => getExamTimer(attempt, custom, defaults, start, start + elapsed * 1000);
        expect(read(0)).toMatchObject({ total: 18, remaining: 18, stage: { key: "transition" } });
        expect(read(5)).toMatchObject({ remaining: 13, stage: { key: "defense" } });
        expect(read(15)).toMatchObject({ remaining: 3, stage: { key: "questions" } });
        expect(read(18).remaining).toBe(0);
        expect(read(21).remaining).toBe(-3);
    });

    it("keeps the entire slot duration frozen on the server pause", () => {
        const paused = { ...attempt, paused_at: iso(start + 2500) };
        expect(getExamTimer(paused, custom, defaults, start, start + 60_000, 2500)).toMatchObject({
            remaining: 18,
            stage: { key: "transition" },
        });
    });

    it("uses the shifted deadline when resuming", () => {
        const resumed = {
            ...attempt,
            server_now: iso(start + 60_000),
            phase_deadline: iso(start + 480_000),
        };
        expect(getExamTimer(resumed, custom, defaults, start, start + 6_000)).toMatchObject({
            remaining: 12,
            stage: { key: "defense" },
        });
    });

    it("keeps elapsed time when editing durations on pause", () => {
        const paused = { ...attempt, paused_at: iso(start + 7000) };
        const edited = { ...custom, defense: 20 };
        expect(getExamTimer(paused, edited, defaults, start, start + 60_000)).toMatchObject({
            total: 28,
            remaining: 21,
            stage: { key: "defense" },
        });
    });

    it("skips a zero-second transition", () => {
        expect(getExamTimer(attempt, { ...custom, transition: 0 }, defaults, start, start).stage?.key).toBe("defense");
    });
});
