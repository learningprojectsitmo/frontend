/**
 * Плашка выбранного дня над лентой. Появляется после клика по ячейке графика:
 * показывает, что лента отфильтрована, и даёт сбросить фильтр.
 */
export function ActivityDayFilter({
    day,
    total,
    onClear,
}: {
    day: string;
    total: number;
    onClear: () => void;
}) {
    return (
        <div className="mb-4 flex items-center gap-2 text-[13px]">
            <span className="text-gray-500">
                {formatDay(day)}: {total} {pluralize(total)}
            </span>
            <button
                type="button"
                onClick={onClear}
                className="text-[#2563EB] hover:underline whitespace-nowrap"
            >
                Показать все дни
            </button>
        </div>
    );
}

function formatDay(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
    });
}

function pluralize(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return "действие";
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20))
        return "действия";
    return "действий";
}
