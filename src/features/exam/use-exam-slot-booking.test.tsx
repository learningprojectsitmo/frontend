// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

import { examApi } from "@/lib/exams";
import type { Exam } from "@/types/exam";
import { useExamSlotBooking } from "./use-exam-slot-booking";

vi.mock("@/lib/auth", () => ({ useUser: () => ({ data: { id: 7 } }) }));
vi.mock("@/lib/projects", () => ({
    getCreatedProjects: async () => ({ items: [{ id: 10 }] }),
    getProject: async () => ({ id: 10, author_id: 7, workspace_id: 2, project_type_id: 3 }),
}));

afterEach(() => vi.restoreAllMocks());

it("checks its own team's availability again after a conflicting booking", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const exam = {
        status: "published",
        published_at: "2026-11-20T10:00:00Z",
        configuration: { starts_at: "2026-11-30T10:00:00Z", project_type_ids: [3] },
    } as Exam;
    const now = Date.parse("2026-11-27T10:00:00Z");
    const blocked = vi
        .spyOn(examApi, "blockedProjects")
        .mockResolvedValueOnce([])
        .mockResolvedValue([10]);
    vi.spyOn(examApi, "slots").mockResolvedValue({ items: [], has_more: false });
    vi.spyOn(examApi, "registrations").mockResolvedValue({
        items: [],
        has_more: false,
        limit: 100,
        offset: 0,
    });
    const register = vi.spyOn(examApi, "register").mockRejectedValue({
        isAxiosError: true,
        response: { status: 409, data: { detail: { code: "project_already_registered" } } },
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const root = createRoot(document.createElement("div"));
    let booking!: ReturnType<typeof useExamSlotBooking>;
    function Booking() {
        booking = useExamSlotBooking(2, 1, exam, now, true);
        return null;
    }

    async function waitUntil(condition: () => boolean) {
        for (let index = 0; index < 10 && !condition(); index++) {
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0));
            });
        }
        expect(condition()).toBe(true);
    }

    try {
        await act(async () => {
            root.render(
                <QueryClientProvider client={client}>
                    <Booking />
                </QueryClientProvider>,
            );
        });
        await waitUntil(() => booking.canBook);
        expect(blocked).toHaveBeenCalledWith(2, 1, true);
        await act(async () => booking.setSelecting(true));
        await act(async () => booking.bookWithoutSlot());
        expect(booking.canConfirm).toBe(true);
        await act(async () => booking.confirm());
        await waitUntil(() => booking.hasOtherBooking);
        expect(register).toHaveBeenCalledWith(2, 1, { project_id: 10, slot_id: null }, true);
        expect(blocked).toHaveBeenCalledTimes(2);
        expect(booking.canBook).toBe(false);
    } finally {
        act(() => root.unmount());
        client.clear();
    }
});
