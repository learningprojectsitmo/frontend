import type { ExamSlot, Registration } from "@/types/exam";

export type LocalSlot = {
    key: string;
    id?: number;
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
        if (!sameDay(start, examDate) || !sameDay(end, examDate)) {
            return "Начало и конец каждого слота должны приходиться на день экзамена.";
        }
        if (end <= start) return "Время окончания слота должно быть позже начала.";
        if (index > 0 && Date.parse(ordered[index - 1].ends_at) > start.getTime()) {
            return "Слоты пересекаются. Измените время начала или длительность.";
        }
    }
    return null;
}

export function resizeDraftSlots(slots: LocalSlot[], durationMinutes: number): LocalSlot[] {
    let shift = 0;
    const duration = durationMinutes * minute;
    return slots
        .slice()
        .sort((left, right) => Date.parse(left.starts_at) - Date.parse(right.starts_at))
        .map((slot) => {
            const originalStart = Date.parse(slot.starts_at);
            const start = originalStart + shift;
            shift += duration - (Date.parse(slot.ends_at) - originalStart);
            return {
                ...slot,
                starts_at: new Date(start).toISOString(),
                ends_at: new Date(start + duration).toISOString(),
            };
        });
}

export function hasEarlierFreeSlots(slots: readonly ExamSlot[]) {
    const lastBookedStart = slots.reduce(
        (latest, slot) =>
            slot.is_available ? latest : Math.max(latest, Date.parse(slot.starts_at)),
        -Infinity,
    );
    return slots.some((slot) => slot.is_available && Date.parse(slot.starts_at) < lastBookedStart);
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
