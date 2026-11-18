import { describe, expect, it } from "vitest";
import { slotScheduleError, slotStartAtTime } from "./exam-schedule";

const time = (hours: number, minutes = 0, day = 1) =>
    new Date(2026, 0, day, hours, minutes).toISOString();
const start = time(10);
const slot = (key: string, starts_at: string, ends_at: string) => ({ key, starts_at, ends_at });

describe("exam slot schedule", () => {
    it("uses the exact exam start when the time picker selects the exam's minute", () => {
        const examStart = new Date(2026, 0, 1, 10, 0, 42, 500).toISOString();
        expect(slotStartAtTime(examStart, "10:00").toISOString()).toBe(examStart);
        expect(slotStartAtTime(examStart, "10:01").toISOString()).toBe(time(10, 1));
        expect(slotStartAtTime(examStart, "09:59").toISOString()).toBe(time(9, 59));
    });

    it("allows adjacent slots in any input order", () => {
        expect(
            slotScheduleError(
                [slot("2", time(10, 15), time(10, 30)), slot("1", start, time(10, 15))],
                start,
            ),
        ).toBeNull();
    });

    it("rejects a slot earlier than the exam", () => {
        expect(slotScheduleError([slot("1", time(9, 59), time(10, 14))], start)).toContain(
            "раньше",
        );
    });

    it("rejects a batch that crosses midnight", () => {
        expect(slotScheduleError([slot("1", time(23, 50), time(0, 5, 2))], start)).toContain(
            "день экзамена",
        );
    });

    it("rejects overlap with an already saved slot", () => {
        expect(
            slotScheduleError(
                [
                    { ...slot("saved", start, time(10, 15)), id: 1 },
                    slot("draft", time(10, 10), time(10, 25)),
                ],
                start,
            ),
        ).toContain("пересекаются");
    });
});
