import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

type CalendarProps = {
    selected: Date | null;
    range?: { from: Date; to: Date } | null;
    onSelect: (date: Date) => void;
    className?: string;
};

function getMonthDays(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(year, month, d));
    }

    return days;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

const MONTHS_RU = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
];

export function Calendar({ selected, range, onSelect, className }: CalendarProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    return (
        <div
            className={cn(
                "w-[280px] rounded-[14px] border border-app-border bg-app-surface p-3 shadow-[0_12px_32px_rgba(0,0,0,0.12)]",
                className,
            )}
        >
            <div className="flex items-center justify-between h-[52px] px-4">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="rounded-lg p-1 text-app-muted transition-colors hover:bg-app-ghost hover:text-app-text"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-[14px] font-semibold text-app-text">
                    {MONTHS_RU[viewMonth]} {viewYear}
                </span>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="rounded-lg p-1 text-app-muted transition-colors hover:bg-app-ghost hover:text-app-text"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 px-3">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="flex h-8 items-center justify-center text-[11px] font-medium text-app-muted"
                    >
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-3 pb-3">
                {days.map((day, i) => {
                    if (!day) {
                        return <div key={`empty-${i}`} className="h-8 w-8" />;
                    }

                    const isSelected = selected && isSameDay(day, selected);
                    const isToday = isSameDay(day, today);
                    const inRange = range && day >= range.from && day <= range.to;

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onSelect(day)}
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-[10px] text-[13px] font-medium transition-colors",
                                isSelected && "bg-[--app-blue] text-white",
                                inRange && !isSelected && "text-[--app-blue] bg-[--app-blue]/10",
                                !isSelected && !inRange && "text-app-text hover:bg-app-ghost",
                                isToday && !isSelected && "ring-1 ring-[--app-blue]",
                            )}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default Calendar;
