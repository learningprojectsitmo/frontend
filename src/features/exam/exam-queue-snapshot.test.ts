import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import type { ExamQueue } from "@/types/exam";
import { getExamQueueReceivedAt, shareExamQueue } from "./exam-queue-snapshot";

it("preserves the WebSocket snapshot and its clock anchor when an older REST request completes", async () => {
    const client = new QueryClient();
    const queryKey = ["queue"];
    const saved: ExamQueue = {
        contract_version: 1,
        settings_version: 1,
        queue_revision: 2,
        server_now: "2026-11-20T10:00:01Z",
        eta_stale: false,
        items: [],
        eta: { current: null, items: [] },
    };
    let complete!: (value: ExamQueue) => void;
    const pending = new Promise<ExamQueue>((resolve) => {
        complete = resolve;
    });
    const now = vi.spyOn(Date, "now").mockReturnValue(2000);
    try {
        const request = client.fetchQuery({
            queryKey,
            queryFn: () => pending,
            structuralSharing: shareExamQueue,
        });
        client.setQueryData(queryKey, saved);
        now.mockReturnValue(3000);
        complete({ ...saved, queue_revision: 1, server_now: "2026-11-20T10:00:00Z" });
        await request;
        expect(client.getQueryData(queryKey)).toEqual(saved);
        expect(getExamQueueReceivedAt(client.getQueryData(queryKey), 3000)).toBe(2000);
    } finally {
        now.mockRestore();
        client.clear();
    }
});
