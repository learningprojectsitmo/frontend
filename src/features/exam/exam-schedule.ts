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
