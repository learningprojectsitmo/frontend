import type { ExamSlot, Registration } from "@/types/exam";

export type LocalSlot = {
    key: string;
    id?: number;
    kind?: ExamSlot["kind"];
    can_edit?: boolean;
    can_delete?: boolean;
    starts_at: string;
    ends_at: string;
};

export const minute = 60_000;

export function slotStartAtTime(examStart: string, time: string): Date {
    const exam = new Date(examStart);
    const [hours, minutes] = time.split(":").map(Number);

    // The picker shows minutes, but saved exams may start partway through a minute.
    if (hours === exam.getHours() && minutes === exam.getMinutes()) return exam;
    return new Date(exam.setHours(hours, minutes, 0, 0));
}

const sameDay = (left: Date, right: Date) => left.toDateString() === right.toDateString();

export function formatScheduleTime(value: string, examStart: string) {
    const date = new Date(value);
    const time = date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });
    return sameDay(date, new Date(examStart))
        ? time
        : `${date.toLocaleDateString("ru-RU")}, ${time}`;
}

export function slotScheduleError(slots: LocalSlot[], examStart: string) {
    const examDate = new Date(examStart);
    const ordered = slots
        .slice()
        .sort((left, right) => Date.parse(left.starts_at) - Date.parse(right.starts_at));
    for (const [index, slot] of ordered.entries()) {
        const start = new Date(slot.starts_at);
        const end = new Date(slot.ends_at);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()))
            return "Проверьте время слота.";
        if (start < examDate) return "Слот не может начинаться раньше начала экзамена.";
        if (end <= start) return "Время окончания слота должно быть позже начала.";
        if (index > 0 && Date.parse(ordered[index - 1].ends_at) > start.getTime()) {
            return "Слоты пересекаются. Измените время начала или длительность.";
        }
    }
    return null;
}

const startOf = (slot: Pick<LocalSlot, "starts_at">) => Date.parse(slot.starts_at);
const endOf = (slot: LocalSlot) => Date.parse(slot.ends_at);
const durationOf = (slot: LocalSlot) => endOf(slot) - startOf(slot);
const iso = (ms: number) => new Date(ms).toISOString();

function shiftSlot(slot: LocalSlot, delta: number): LocalSlot {
    return delta === 0
        ? slot
        : { ...slot, starts_at: iso(startOf(slot) + delta), ends_at: iso(endOf(slot) + delta) };
}

export function updateScheduleSlot(
    slots: LocalSlot[],
    key: string,
    startsAt: string,
    duration?: number,
): LocalSlot[] | null {
    const index = slots.findIndex((row) => row.key === key);
    const slot = slots[index];
    if (!slot || slot.can_edit === false) return null;
    const start = Date.parse(startsAt);
    const end = start + (duration ?? durationOf(slot));
    const delta = end - endOf(slot);
    const rest = slots.slice(index + 1);
    if (delta && rest.some((row) => row.can_edit === false)) return null;
    return [
        ...slots.slice(0, index),
        { ...slot, starts_at: startsAt, ends_at: iso(end) },
        ...rest.map((row) => shiftSlot(row, delta)),
    ];
}

export function removeScheduleSlot(slots: LocalSlot[], key: string): LocalSlot[] | null {
    const index = slots.findIndex((row) => row.key === key);
    const slot = slots[index];
    const rest = slots.slice(index + 1);
    if (!slot || slot.can_delete === false || rest.some((row) => row.can_edit === false))
        return null;
    return [...slots.slice(0, index), ...rest.map((row) => shiftSlot(row, -durationOf(slot)))];
}

export function insertScheduleBreak(
    slots: LocalSlot[],
    index: number,
    key: string,
    minutes: number,
    fallbackStart?: string,
): LocalSlot[] | null {
    const rest = slots.slice(index);
    if (rest.some((row) => row.can_edit === false)) return null;
    const start = slots[index]
        ? startOf(slots[index])
        : slots.length
          ? endOf(slots[slots.length - 1])
          : Date.parse(fallbackStart ?? "");
    if (!Number.isFinite(start)) return null;
    const duration = minutes * minute;
    return [
        ...slots.slice(0, index),
        { key, kind: "break", starts_at: iso(start), ends_at: iso(start + duration) },
        ...rest.map((row) => shiftSlot(row, duration)),
    ];
}

export function moveScheduleBreak(
    slots: LocalSlot[],
    key: string,
    direction: -1 | 1,
): LocalSlot[] | null {
    const index = slots.findIndex((row) => row.key === key && row.kind === "break");
    if (index < 0 || !slots[index + direction]) return null;
    const firstIndex = Math.min(index, index + direction);
    const first = slots[firstIndex];
    const second = slots[firstIndex + 1];
    if (first.can_edit === false || second.can_edit === false) return null;
    return [
        ...slots.slice(0, firstIndex),
        shiftSlot(second, startOf(first) - startOf(second)),
        shiftSlot(first, endOf(second) - durationOf(first) - startOf(first)),
        ...slots.slice(firstIndex + 2),
    ];
}

export function resizeDraftSlots(slots: LocalSlot[], durationMinutes: number): LocalSlot[] {
    let shift = 0;
    const duration = durationMinutes * minute;
    return slots
        .slice()
        .sort((left, right) => startOf(left) - startOf(right))
        .map((slot) => {
            if (slot.kind === "break") return shiftSlot(slot, shift);
            const start = startOf(slot) + shift;
            shift += duration - durationOf(slot);
            return {
                ...slot,
                starts_at: iso(start),
                ends_at: iso(start + duration),
            };
        });
}

export function canBookExamSlot(current: ExamSlot, selected: ExamSlot) {
    return (
        current.kind !== "break" &&
        current.is_available &&
        current.id === selected.id &&
        current.starts_at === selected.starts_at &&
        current.ends_at === selected.ends_at
    );
}

export function hasEarlierFreeSlots(slots: readonly ExamSlot[]) {
    let hasGap = false;
    for (const slot of [...slots].sort((a, b) => startOf(a) - startOf(b))) {
        if (slot.kind === "break") hasGap = false;
        else if (slot.is_available) hasGap = true;
        else if (hasGap) return true;
    }
    return false;
}

export function planSlotCompaction(
    slots: readonly ExamSlot[],
    registrations: readonly Registration[],
    now = -Infinity,
) {
    const occupied = new Map(
        registrations
            .filter((registration) => registration.status === "active")
            .map((registration) => [registration.slot_id, registration]),
    );
    const free: ExamSlot[] = [];
    const moves: { registration: Registration; from: ExamSlot; to: ExamSlot }[] = [];
    for (const slot of [...slots].sort(
        (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
    )) {
        if (slot.kind === "break") {
            free.length = 0;
            continue;
        }
        const registration = occupied.get(slot.id);
        if (slot.is_available && !registration) {
            if (Date.parse(slot.ends_at) > now) free.push(slot);
        } else if (
            !slot.is_available &&
            registration &&
            !registration.started_at &&
            !registration.queue_hold &&
            Date.parse(slot.ends_at) > now &&
            free.length
        ) {
            const to = free.shift()!;
            moves.push({ registration, from: slot, to });
            free.push(slot);
        } else {
            // Keep teams on their side of occupied slots that cannot be moved.
            free.length = 0;
        }
    }
    return moves;
}
