import { replaceEqualDeep } from "@tanstack/react-query";
import type { ExamQueue } from "@/types/exam";

const receivedAt = new WeakMap<ExamQueue, number>();

export function isOlderExamQueue(incoming: ExamQueue, current: ExamQueue) {
    return Date.parse(incoming.server_now) < Date.parse(current.server_now);
}

export function shareExamQueue(previous: unknown, incoming: unknown) {
    const current = previous as ExamQueue | undefined;
    const next = incoming as ExamQueue;
    if (current && isOlderExamQueue(next, current)) return current;
    const shared = replaceEqualDeep(current, next);
    if (shared !== current || !receivedAt.has(shared)) receivedAt.set(shared, Date.now());
    return shared;
}

export function getExamQueueReceivedAt(queue: ExamQueue | undefined, fallback: number) {
    return (queue && receivedAt.get(queue)) ?? fallback;
}
