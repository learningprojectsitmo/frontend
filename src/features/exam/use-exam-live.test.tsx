// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { useExamLive } from "./use-exam-live";

vi.mock("@/lib/api-client", () => ({ getAccessToken: () => "session-token" }));
vi.mock("@/config/env", () => ({ env: { API_URL: "https://api.example.test/v1" } }));

it("authenticates outside the URL, applies snapshots, and requests resync after a gap", async () => {
    const sockets: FakeSocket[] = [];
    class FakeSocket {
        onopen = () => {};
        onmessage = (_event: { data: string }) => {};
        onclose = () => {};
        send = vi.fn();
        close = vi.fn();
        constructor(readonly url: URL) { sockets.push(this); }
        receive(message: unknown) { this.onmessage({ data: JSON.stringify(message) }); }
    }

    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const element = document.createElement("div");
    const root = createRoot(element);
    const client = new QueryClient();
    function Live() { return <span>{useExamLive(1, 2, true) ? "live" : "rest"}</span>; }
    try {
        await act(async () => root.render(<QueryClientProvider client={client}><Live /></QueryClientProvider>));
        const [connection] = sockets;
        if (!connection) throw new Error("Expected a socket");
        expect(connection.url.href).toBe("wss://api.example.test/v1/workspaces/1/exams/2/live");
        connection.onopen();
        expect(connection.send).toHaveBeenCalledWith(JSON.stringify({ type: "auth", token: "session-token" }));
        const examKey = queryKeys.exams.detail(1, 2);
        const listKey = queryKeys.exams.list(1, "published");
        const slotsKey = queryKeys.exams.slots(1, 2);
        client.setQueryData(examKey, { status: "draft", current_settings_version: 1 });
        client.setQueryData(listKey, { items: [] });
        const queue = { queue_revision: 1, settings_version: 1, server_now: "2026-11-19T10:00:00Z", items: [{ slot_id: 33 }] };
        const snapshot = { type: "snapshot", contract_version: 1, stream_seq: 3, stale: false, queue };
        await act(async () => connection.receive(snapshot));
        expect(element.textContent).toBe("live");
        expect(client.getQueryData(queryKeys.exams.queue(1, 2))).toEqual(queue);
        await act(async () => connection.receive({ type: "heartbeat", contract_version: 1, stream_seq: 4, stale: false }));
        expect(connection.send).toHaveBeenLastCalledWith(JSON.stringify({ type: "resync" }));
        expect(element.textContent).toBe("rest");
        client.setQueryData(slotsKey, { items: [{ id: 33 }] });
        await act(async () => connection.receive({
            ...snapshot,
            stream_seq: 4,
            exam: { status: "published" },
            queue: { ...queue, items: [] },
        }));
        expect(element.textContent).toBe("live");
        expect(client.getQueryState(examKey)?.isInvalidated).toBe(true);
        expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
        expect(client.getQueryState(slotsKey)?.isInvalidated).toBe(true);
        await act(async () => connection.onclose());
        expect(element.textContent).toBe("rest");
    } finally {
        await act(async () => root.unmount());
        client.clear();
        vi.unstubAllGlobals();
    }
});
