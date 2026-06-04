export const formatPeriod = (periodFrom: string | null, periodTo: string | null): string => {
    const from = periodFrom
        ? new Date(periodFrom).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
        : "";
    const to = periodTo
        ? new Date(periodTo).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
        : "настоящее время";
    return [from, to].filter(Boolean).join(" — ");
};

const MONTH_WORDS = ["месяц", "месяца", "месяцев"] as const;
const YEAR_WORDS = ["год", "года", "лет"] as const;

const pluralize = (count: number, words: readonly [string, string, string]): string => {
    if (count % 10 === 1 && count % 100 !== 11) return words[0];
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20))
        return words[1];
    return words[2];
};

export const calculateTotalDuration = (items: { duration: string }[]): string => {
    const totalMonths = items.reduce((acc, item) => {
        const match = item.duration.match(/(?:(\d+)\s*год)?\s*(?:(\d+)\s*месяц)?/);
        const years = match?.[1] ? Number.parseInt(match[1]) : 0;
        const months = match?.[2] ? Number.parseInt(match[2]) : 0;
        return acc + years * 12 + months;
    }, 0);

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts: string[] = [];
    if (years) parts.push(`${years} ${pluralize(years, YEAR_WORDS)}`);
    if (months) parts.push(`${months} ${pluralize(months, MONTH_WORDS)}`);
    return parts.join(" ");
};
