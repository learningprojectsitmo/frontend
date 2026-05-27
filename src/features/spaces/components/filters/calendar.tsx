import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

type CalendarProps = {
    selected: Date | null;
    range?: { from: Date; to: Date } | null;
    onSelect: (date: Date) => void;
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
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function Calendar({ selected, range, onSelect }: CalendarProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const days = useMemo(
        () => getMonthDays(viewYear, viewMonth),
        [viewYear, viewMonth],
    );

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
        <div className="w-[280px] bg-white rounded-[18px] border border-[#E5E7EB] shadow-[0_20px_40px_rgba(0,0,0,0.12)] p-3">
            <div className="flex items-center justify-between h-[52px] px-4">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                >
                    <ChevronLeft size={16} className="text-[#6B7280]" />
                </button>
                <span className="text-[14px] font-semibold text-[#111827]">
                    {MONTHS_RU[viewMonth]} {viewYear}
                </span>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors"
                >
                    <ChevronRight size={16} className="text-[#6B7280]" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 px-3 mb-1">
                {WEEKDAYS.map((d) => (
                    <div
                        key={d}
                        className="flex items-center justify-center h-8 text-[11px] font-medium text-[#9CA3AF]"
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
                    const inRange =
                        range &&
                        day >= range.from &&
                        day <= range.to;

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onSelect(day)}
                            className={cn(
                                "flex items-center justify-center h-8 w-8 text-[13px] font-medium rounded-[10px] transition-colors",
                                isSelected && "bg-[#2563EB] text-white",
                                inRange && !isSelected && "bg-[#DBEAFE] text-[#2563EB]",
                                !isSelected && !inRange && "hover:bg-[#F3F4F6] text-[#111827]",
                                isToday && !isSelected && "ring-1 ring-[#2563EB]",
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
