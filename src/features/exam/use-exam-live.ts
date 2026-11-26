import { isOlderExamQueue } from "./exam-queue-snapshot";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { env } from "@/config/env";
import type { Exam, ExamQueue } from "@/types/exam";

type Message =
    | { type: "hello"; contract_version: number }
    | {
          type: "snapshot";
          contract_version: number;
          stream_seq: number;
          stale: boolean;
          queue: ExamQueue;
          exam?: Pick<Exam, "status" | "started_at" | "completed_at" | "archived_at">;
      }
    | { type: "heartbeat"; contract_version: number; stream_seq: number; stale: boolean }
    | { type: "error"; code: string };

export function useExamLive(workspaceId: number, examId: number, enabled: boolean) {
    const client = useQueryClient();
    const [connected, setConnected] = useState(false);
    useEffect(() => {
        if (!enabled) return;
        const key = queryKeys.exams.queue(workspaceId, examId);
        const examKey = queryKeys.exams.detail(workspaceId, examId);
        const url = new URL(env.API_URL, window.location.origin);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        url.pathname = `${url.pathname.replace(/\/+$/, "")}/workspaces/${workspaceId}/exams/${examId}/live`;
        url.search = "";
        url.hash = "";

        let disposed = false;
        let socket: WebSocket | undefined;
        let retry: number | undefined;
        let watchdog: number | undefined;
        let backoff = 1000;
        let lastSequence: number | undefined;
        let lastResync = -Infinity;

        const monitor = (connection: WebSocket) => {
            window.clearTimeout(watchdog);
            watchdog = window.setTimeout(() => connection.close(), 65_000);
        };
        const reconnect = () => {
            retry = window.setTimeout(connect, backoff * (0.8 + Math.random() * 0.4));
            backoff = Math.min(backoff * 2, 30_000);
        };
        function connect() {
            if (disposed) return;
            const token = getAccessToken();
            if (!token) {
                reconnect();
                return;
            }
            let connection: WebSocket;
            try {
                connection = new WebSocket(url);
            } catch {
                reconnect();
                return;
            }
            socket = connection;
            let applied: number | undefined;
            lastResync = -Infinity;
            monitor(connection);
            connection.onopen = () => {
                if (!disposed)
                    connection.send(
                        JSON.stringify({ type: "auth", token, last_stream_seq: lastSequence }),
                    );
            };
            connection.onmessage = (event) => {
                if (disposed) return;
                let message: Message;
                try {
                    message = JSON.parse(String(event.data)) as Message;
                } catch {
                    connection.close();
                    return;
                }
                if (!message || typeof message !== "object") {
                    connection.close();
                    return;
                }
                monitor(connection);
                if (message.type === "error") {
                    setConnected(false);
                    // eslint-disable-next-line no-console
                    console.warn("Канал экзамена сообщил об ошибке", message.code);
                    return;
                }
                if (message.contract_version !== 1) {
                    connection.close();
                    return;
                }
                if (
                    message.type === "snapshot" &&
                    !message.stale &&
                    !message.queue?.eta_stale &&
                    message.queue &&
                    (applied === undefined || message.stream_seq >= applied)
                ) {
                    const snapshot = message.queue;
                    applied = lastSequence = message.stream_seq;
                    backoff = 1000;
                    const previous = client.getQueryData<ExamQueue>(key);
                    if (!previous || !isOlderExamQueue(snapshot, previous))
                        client.setQueryData(key, snapshot);
                    const exam = client.getQueryData<Exam>(examKey);
                    const lifecycleChanged =
                        exam &&
                        message.exam &&
                        (exam.status !== message.exam.status ||
                            (exam.started_at ?? null) !== (message.exam.started_at ?? null) ||
                            (exam.completed_at ?? null) !== (message.exam.completed_at ?? null) ||
                            (exam.archived_at ?? null) !== (message.exam.archived_at ?? null));
                    if (
                        exam &&
                        (exam.current_settings_version !== snapshot.settings_version ||
                            lifecycleChanged)
                    ) {
                        void client.invalidateQueries(
                            { queryKey: examKey },
                            { cancelRefetch: false },
                        );
                        if (lifecycleChanged) {
                            void client.invalidateQueries(
                                {
                                    queryKey: queryKeys.exams.list(workspaceId).slice(0, 3),
                                },
                                { cancelRefetch: false },
                            );
                        }
                    }
                    if (
                        !previous ||
                        snapshot.queue_revision !== previous.queue_revision ||
                        snapshot.items.length !== previous.items.length ||
                        snapshot.items.some(
                            (item, index) => previous.items[index]?.slot_id !== item.slot_id,
                        )
                    ) {
                        void client.invalidateQueries({
                            queryKey: queryKeys.exams.slots(workspaceId, examId),
                        });
                        void client.invalidateQueries({
                            queryKey: queryKeys.exams
                                .registrations(workspaceId, examId)
                                .slice(0, 4),
                        });
                    }
                    setConnected(true);
                    return;
                }
                if (
                    (message.type === "snapshot" || message.type === "heartbeat") &&
                    (message.stale ||
                        (message.type === "snapshot" && message.queue?.eta_stale) ||
                        applied === undefined ||
                        message.stream_seq > applied)
                ) {
                    setConnected(false);
                    if (Date.now() - lastResync >= 5000) {
                        lastResync = Date.now();
                        connection.send(JSON.stringify({ type: "resync" }));
                    }
                }
            };
            connection.onerror = () => connection.close();
            connection.onclose = (event) => {
                if (disposed) return;
                window.clearTimeout(watchdog);
                setConnected(false);
                void client.invalidateQueries({ queryKey: key }, { cancelRefetch: false });
                if (event?.code !== 4403 && event?.code !== 4404) reconnect();
            };
        }
        connect();
        return () => {
            disposed = true;
            window.clearTimeout(retry);
            window.clearTimeout(watchdog);
            socket?.close();
            setConnected(false);
        };
    }, [client, workspaceId, examId, enabled]);
    return connected;
}
