const ROLLING_LABEL = "Последние 12 месяцев";

/**
 * Выбор года рядом с графиком активности — как список лет в профиле GitHub.
 * На десктопе — вертикальная колонка справа, на мобильных — горизонтальные
 * чипы над графиком.
 */
export function ActivityYearSelector({
    years,
    value,
    onChange,
}: {
    /** Годы от регистрации до текущего, по возрастанию. */
    years: number[];
    /** Выбранный год; null — скользящее окно «последние 12 месяцев». */
    value: number | null;
    onChange: (year: number | null) => void;
}) {
    const options = [
        { key: "rolling", label: ROLLING_LABEL, year: null as number | null },
        // Свежие годы сверху — как в GitHub.
        ...[...years].reverse().map((year) => ({ key: String(year), label: String(year), year })),
    ];

    const renderOption = (option: (typeof options)[number], horizontal: boolean) => {
        const active = value === option.year;
        return (
            <button
                key={option.key}
                type="button"
                onClick={() => onChange(option.year)}
                aria-pressed={active}
                className={
                    "rounded-md text-[13px] transition-colors " +
                    (horizontal ? "px-3 py-1 whitespace-nowrap " : "px-2 py-1 text-left ") +
                    (active
                        ? "bg-[#2563EB] text-white font-medium"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900")
                }
            >
                {option.label}
            </button>
        );
    };

    return (
        <nav aria-label="Выбор года активности" className="shrink-0">
            <div className="hidden sm:flex flex-col gap-0.5 w-[150px]">
                {options.map((option) => renderOption(option, false))}
            </div>
            <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1">
                {options.map((option) => renderOption(option, true))}
            </div>
        </nav>
    );
}
