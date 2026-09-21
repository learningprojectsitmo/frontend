// Общие лимиты и хелперы валидации полей резюме — значения совпадают с
// ограничениями в backend/src/schema/resume.py.

export const LIMITS = {
    header: 200,
    name: 100,
    role: 100,
    level: 50,
    years: 50,
    university: 200,
    platform: 100,
    link: 500,
    companyPosition: 200,
    duration: 100,
    text: 10000,
    experienceDescription: 5000,
} as const;

const normalizeUrl = (value: string): string => {
    const v = value.trim();
    if (!/^https?:\/\//i.test(v)) return `https://${v}`;
    return v;
};

export const isValidHttpUrl = (raw: string): boolean => {
    if (!raw.trim()) return false;
    try {
        const url = new URL(normalizeUrl(raw));
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

export const isValidPeriod = (from: string, to: string): boolean => {
    // Формат «YYYY-MM» c нулями — лексическое сравнение даёт корректный порядок.
    if (!from || !to) return true;
    return to >= from;
};
