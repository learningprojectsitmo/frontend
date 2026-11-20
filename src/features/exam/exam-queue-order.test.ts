import { describe, expect, it } from "vitest";
import type { QueueItem } from "@/types/exam";
import { applyWaitingOrder, getPositionedIds, reconcileExamOrder } from "./exam-queue-order";

function team(registration_id: number, state: QueueItem["state"], position: number | null, started_at: string | null = null): QueueItem {
    return {
        registration_id,
        project_id: registration_id,
        project_type_id: 1,
        slot_id: null,
        planned_start_at: null,
        planned_end_at: null,
        position,
        state,
        registration_version: 1,
        started_at,
        attempt: null,
    };
}

describe("reconcileExamOrder", () => {
    it("keeps the same numbering as the API moves started and finished teams", () => {
        const initial = reconcileExamOrder([], [team(9, "waiting", 1), team(4, "waiting", 2), team(2, "waiting", 3)]);
        const during = reconcileExamOrder(initial, [team(4, "running", null), team(2, "waiting", 1), team(9, "finished", null)]);
        expect(during).toEqual([9, 4, 2]);
    });

    it("reconstructs an ordinary completed prefix on first load", () => {
        expect(reconcileExamOrder([], [
            team(2, "running", null, "2026-11-19T12:10:00Z"),
            team(8, "waiting", 1),
            team(4, "finished", null, "2026-11-19T12:00:00Z"),
        ])).toEqual([4, 2, 8]);
    });

    it("uses the new server position when a postponed team is put next", () => {
        const items = [
            team(2, "waiting", 2),
            team(4, "postponed", 1, "2026-11-19T12:00:00Z"),
            team(9, "finished", null),
            team(8, "postponed", null),
        ];
        expect(getPositionedIds(items)).toEqual([4, 2]);
        expect(reconcileExamOrder([9, 2, 4, 8], items)).toEqual([9, 4, 2, 8]);
    });

    it("places restored teams after finished and running teams even if stored earlier", () => {
        const historicalOrder = [4, 9, 2, 8, 7];
        const snapshot = [
            team(9, "finished", null),
            team(2, "running", null),
            team(8, "waiting", 1),
            team(7, "waiting", 2),
        ];
        expect(reconcileExamOrder(historicalOrder, [
            ...snapshot,
            team(4, "waiting", 3),
        ])).toEqual([9, 2, 8, 7, 4]);
        expect(reconcileExamOrder(historicalOrder, [
            snapshot[0],
            snapshot[1],
            team(4, "postponed", 1, "2026-11-19T11:00:00Z"),
            team(8, "waiting", 2),
            team(7, "waiting", 3),
        ])).toEqual([9, 2, 4, 8, 7]);
    });

    it("keeps the returned team's position as the reference for a waiting-team swap", () => {
        const items = [team(9, "waiting", 1), team(4, "postponed", 2), team(2, "waiting", 3)];
        expect(applyWaitingOrder(getPositionedIds(items), [2, 9])).toEqual([2, 4, 9]);
    });

    it("supports queue edits and new registrations while retaining running and finished rows", () => {
        const initial = [9, 4, 2, 5];
        expect(applyWaitingOrder(initial, [5, 2])).toEqual([9, 4, 5, 2]);
        expect(reconcileExamOrder(initial, [
            team(4, "running", null),
            team(5, "waiting", 1),
            team(2, "waiting", 2),
            team(7, "waiting", 3),
            team(9, "finished", null),
        ])).toEqual([9, 4, 5, 2, 7]);
    });
});
