import { describe, expect, it } from "vitest";
import type { ExamSlot, Registration } from "@/types/exam";
import {
    canBookExamSlot,
    formatScheduleTime,
    hasEarlierFreeSlots,
    insertScheduleBreak,
    moveScheduleBreak,
    removeScheduleSlot,
    updateScheduleSlot,
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

    it("accepts midnight and displays the next date", () => {
        expect(slotScheduleError([slot("1", time(23, 50), time(0, 5, 2))], start)).toBeNull();
        expect(formatScheduleTime(time(0, 5, 2), start)).toMatch(/02\.01\.2026.*00:05/);
    });

    const source = Array.from({ length: 25 }, (_, index) => ({
        ...slot(String(index + 1), time(14, index * 15), time(14, (index + 1) * 15)),
        id: index + 1,
    }));

    it("keeps the first eight slots and shifts the remaining slots after editing slot nine", () => {
        const edited = updateScheduleSlot(source, "9", time(16, 5))!;
        expect(edited.slice(0, 8)).toEqual(source.slice(0, 8));
        expect(edited[9]).toMatchObject({ id: 10, starts_at: time(16, 20) });
        expect(edited.at(-1)?.ends_at).toBe(time(20, 20));
    });

    it("reuses the removed interval and preserves successor IDs", () => {
        const edited = removeScheduleSlot(source, "9")!;
        expect(edited.slice(0, 8)).toEqual(source.slice(0, 8));
        expect(edited[8]).toMatchObject({ id: 10, starts_at: time(16) });
        expect(edited.at(-1)?.ends_at).toBe(time(20));
    });

    it("inserts, moves and removes a break without changing the number of defenses", () => {
        const added = insertScheduleBreak(source, 8, "break", 10)!;
        expect(added[8]).toMatchObject({
            starts_at: time(16),
            ends_at: time(16, 10),
            kind: "break",
        });
        expect(added[9]).toMatchObject({ id: 9, starts_at: time(16, 10) });
        const shifted = moveScheduleBreak(added, "break", 1)!;
        expect(shifted[8]).toMatchObject({ id: 9, starts_at: time(16) });
        expect(shifted[9]).toMatchObject({
            starts_at: time(16, 15),
            ends_at: time(16, 25),
            kind: "break",
        });
        expect(shifted.at(-1)?.ends_at).toBe(time(20, 25));
        expect(removeScheduleSlot(shifted, "break")).toEqual(source);
    });

    it("blocks reflow that would move a locked defense", () => {
        const locked = source.map((row) => (row.id === 10 ? { ...row, can_edit: false } : row));
        expect(updateScheduleSlot(locked, "9", time(16, 5))).toBeNull();
        expect(removeScheduleSlot(locked, "9")).toBeNull();
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

    it("does not suggest compaction across a break", () => {
        const slots = [
            savedSlot(1, true),
            { ...savedSlot(2, false), kind: "break" as const },
            savedSlot(3, false),
        ];
        expect(hasEarlierFreeSlots(slots)).toBe(false);
        expect(planSlotCompaction(slots, [bookedTeam(30, 3)])).toEqual([]);
    });

    it("requires a new selection if the available slot kept its ID but its interval changed", () => {
        const selected = savedSlot(1, true);
        expect(canBookExamSlot(selected, selected)).toBe(true);
        expect(canBookExamSlot({ ...selected, starts_at: time(10, 1) }, selected)).toBe(false);
        expect(canBookExamSlot({ ...selected, kind: "break" }, selected)).toBe(false);
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
