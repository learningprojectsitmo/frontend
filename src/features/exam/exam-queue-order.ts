import type { QueueItem } from "@/types/exam";

export function getPositionedIds(items: QueueItem[]) {
    return items
        .filter((item) => item.position !== null && (item.state === "waiting" || item.state === "postponed"))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((item) => item.registration_id);
}

export function getWaitingIds(items: QueueItem[]) {
    return getPositionedIds(items.filter((item) => item.state === "waiting"));
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
    const positionedIds = getPositionedIds(items);
    const positioned = new Set(positionedIds);
    const newcomers = items.filter((item) => !known.has(item.registration_id));
    const startedAt = (item: QueueItem) => item.started_at ?? item.attempt?.started_at;
    const started = newcomers.filter((item) => !positioned.has(item.registration_id) && startedAt(item)).sort((a, b) =>
        Date.parse(startedAt(a) ?? "") - Date.parse(startedAt(b) ?? "") || a.registration_id - b.registration_id);
    const unstarted = newcomers.filter((item) => !startedAt(item) && !positioned.has(item.registration_id));
    return applyWaitingOrder([
        ...retained,
        ...started.map((item) => item.registration_id),
        ...positionedIds.filter((id) => !known.has(id)),
        ...unstarted.map((item) => item.registration_id),
    ], positionedIds);
}
