import { describe, expect, it } from "vitest";
import type { ExamSlot, Registration } from "@/types/exam";
import {
    hasEarlierFreeSlots,
    planSlotCompaction,
    slotScheduleError,
    slotStartAtTime,
} from "./exam-schedule";

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

const savedSlot = (id: number, is_available: boolean): ExamSlot => ({
    id,
    exam_id: 1,
    workspace_id: 1,
    starts_at: time(10, (id - 1) * 10),
    ends_at: time(10, id * 10),
    is_available,
});

const bookedTeam = (
    id: number,
    slot_id: number,
    started_at: string | null = null,
): Registration => ({
    id,
    exam_id: 1,
    workspace_id: 1,
    project_id: id,
    project_type_id_at_registration: 1,
    slot_id,
    queue_position: id,
    queue_hold: null,
    status: "active",
    version: 1,
    created_source: "manager",
    created_by: 1,
    created_at: start,
    updated_by: 1,
    updated_at: start,
    started_at,
});

describe("slot compaction", () => {
    it("detects an early gap even when the slots arrive out of order", () => {
        expect(hasEarlierFreeSlots([savedSlot(3, false), savedSlot(1, true)])).toBe(true);
        expect(hasEarlierFreeSlots([savedSlot(2, true), savedSlot(1, false)])).toBe(false);
    });

    it("plans moves from left to right, reusing slots freed by earlier moves", () => {
        const moves = planSlotCompaction(
            [savedSlot(3, false), savedSlot(1, true), savedSlot(2, false)],
            [bookedTeam(20, 3), bookedTeam(10, 2)],
            Date.parse(start),
        );
        expect(
            moves.map(({ registration, from, to }) => [registration.id, from.id, to.id]),
        ).toEqual([
            [10, 2, 1],
            [20, 3, 2],
        ]);
    });

    it("fills the earliest free slots at start and keeps held teams in place", () => {
        const moves = planSlotCompaction(
            [
                savedSlot(1, true),
                savedSlot(2, false),
                savedSlot(3, true),
                savedSlot(4, false),
                savedSlot(5, false),
            ],
            [bookedTeam(10, 2), { ...bookedTeam(20, 4), queue_hold: "no_show" }, bookedTeam(30, 5)],
        );
        expect(moves.map(({ from, to }) => [from.id, to.id])).toEqual([[2, 1]]);
    });

    it("keeps started defenses in place and skips expired slots", () => {
        const moves = planSlotCompaction(
            [savedSlot(1, true), savedSlot(2, false), savedSlot(3, true), savedSlot(4, false)],
            [bookedTeam(10, 2, time(10, 10)), bookedTeam(20, 4)],
            Date.parse(time(10, 20)),
        );
        expect(moves.map(({ from, to }) => [from.id, to.id])).toEqual([[4, 3]]);
    });
});
