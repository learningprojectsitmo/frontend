import type { QueueItem } from "@/types/exam";

export function getPositionedIds(items: QueueItem[]) {
    return items
        .filter(
            (item) =>
                item.position !== null && (item.state === "waiting" || item.state === "postponed"),
        )
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((item) => item.registration_id);
}

export function getWaitingIds(items: QueueItem[]) {
    return getPositionedIds(items.filter((item) => item.state === "waiting"));
}

export function applyWaitingOrder(order: number[], waitingIds: number[]) {
    const waiting = new Set(waitingIds);
    let index = 0;
    return order.map((id) => (waiting.has(id) ? waitingIds[index++] : id));
}

export function reconcileExamOrder(previous: number[], items: QueueItem[]) {
    const present = new Set(items.map((item) => item.registration_id));
    const retained = previous.filter((id) => present.has(id));
    const known = new Set(retained);
    const positionedIds = getPositionedIds(items);
    const positioned = new Set(positionedIds);
    const newcomers = items.filter((item) => !known.has(item.registration_id));
    const startedAt = (item: QueueItem) => item.started_at ?? item.attempt?.started_at;
    const wasStarted = (item: QueueItem) =>
        Boolean(startedAt(item)) || item.state === "running" || item.state === "finished";
    const started = newcomers
        .filter((item) => !positioned.has(item.registration_id) && wasStarted(item))
        .sort(
            (a, b) =>
                Number(a.state === "running") - Number(b.state === "running") ||
                Date.parse(startedAt(a) ?? "") - Date.parse(startedAt(b) ?? "") ||
                a.registration_id - b.registration_id,
        );
    const unstarted = newcomers.filter(
        (item) => !wasStarted(item) && !positioned.has(item.registration_id),
    );
    const history = [...retained, ...started.map((item) => item.registration_id)];
    const protectedIds = new Set(
        items
            .filter((item) => item.state === "finished" || item.state === "running")
            .map((item) => item.registration_id),
    );
    // Positions apply only to future defenses. A restored row can have a historical
    // index before the current defense in session storage.
    const lastProtected = history.reduce(
        (last, id, index) => (protectedIds.has(id) ? index : last),
        -1,
    );
    const prefix = history.slice(0, lastProtected + 1).filter((id) => !positioned.has(id));
    const tail = history.slice(lastProtected + 1);
    const tailIds = new Set(tail);
    return [
        ...prefix,
        ...applyWaitingOrder(
            [
                ...tail,
                ...positionedIds.filter((id) => !tailIds.has(id)),
                ...unstarted.map((item) => item.registration_id),
            ],
            positionedIds,
        ),
    ];
}
