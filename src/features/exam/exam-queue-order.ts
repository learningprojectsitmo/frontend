import type { QueueItem } from "@/types/exam";

export function getWaitingIds(items: QueueItem[]) {
    return items
        .filter((item) => item.state === "waiting" && item.position !== null)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((item) => item.registration_id);
}

export function applyWaitingOrder(order: number[], waitingIds: number[]) {
    const waiting = new Set(waitingIds);
    let index = 0;
    return order.map((id) => waiting.has(id) ? waitingIds[index++] : id);
}

export function reconcileExamOrder(previous: number[], items: QueueItem[]) {
    const present = new Set(items.map((item) => item.registration_id));
    const retained = previous.filter((id) => present.has(id));
    const known = new Set(retained);
    const waitingIds = getWaitingIds(items);
    const waiting = new Set(waitingIds);
    const newcomers = items.filter((item) => !known.has(item.registration_id));
    const startedAt = (item: QueueItem) => item.started_at ?? item.attempt?.started_at;
    const started = newcomers.filter(startedAt).sort((a, b) =>
        Date.parse(startedAt(a) ?? "") - Date.parse(startedAt(b) ?? "") || a.registration_id - b.registration_id);
    const unstarted = newcomers.filter((item) => !startedAt(item) && !waiting.has(item.registration_id));
    return applyWaitingOrder([
        ...retained,
        ...started.map((item) => item.registration_id),
        ...waitingIds.filter((id) => !known.has(id)),
        ...unstarted.map((item) => item.registration_id),
    ], waitingIds);
}
