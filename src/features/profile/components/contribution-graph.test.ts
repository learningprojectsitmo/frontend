import { describe, expect, it } from "vitest";
import { buildGraph, resolveFirstAt, resolveGridStart, weekdayLabels } from "./contribution-graph";

const DAY = 86_400_000;

function utc(y: number, m: number, d: number): Date {
    return new Date(Date.UTC(y, m - 1, d));
}

function keys(weeks: { key: string }[][]): string[][] {
    return weeks.map((w) => w.map((d) => d.key));
}

describe("resolveGridStart", () => {
    it("начинает сетку с 1-го числа месяца 12 месяцев назад", () => {
        // Сегодня 26.09.2026 → сетка начинается с 1 сентября 2025-го.
        expect(
            resolveGridStart(utc(2026, 9, 26))
                .toISOString()
                .slice(0, 10),
        ).toBe("2025-09-01");
    });

    it("переживает переход через границу года", () => {
        // Январь: 12 месяцев назад — январь прошлого года, а не тот же месяц.
        expect(
            resolveGridStart(utc(2026, 1, 15))
                .toISOString()
                .slice(0, 10),
        ).toBe("2025-01-01");
    });

    it("всегда попадает в первый день месяца", () => {
        for (const [y, m, d] of [
            [2026, 9, 26],
            [2026, 3, 1],
            [2026, 12, 31],
            [2027, 2, 14],
        ] as const) {
            const start = resolveGridStart(utc(y, m, d));
            expect(start.getUTCDate()).toBe(1);
        }
    });
});

describe("weekdayLabels", () => {
    it("начинает подписи с понедельника, если сетка стартует в понедельник", () => {
        // 2025-09-01 — понедельник
        expect(weekdayLabels(utc(2025, 9, 1))).toEqual(["Пн", "", "Ср", "", "Пт", "", "Вс"]);
    });

    it("сдвигает подписи, если сетка стартует не в понедельник", () => {
        // 2025-08-31 — воскресенье: строки должны идти Вс, Пн, …
        expect(weekdayLabels(utc(2025, 8, 31))).toEqual(["Вс", "Пн", "", "Ср", "", "Пт", ""]);
    });

    it("подписывает всегда 7 строк", () => {
        expect(weekdayLabels(utc(2025, 9, 1))).toHaveLength(7);
    });
});

describe("resolveFirstAt", () => {
    it("возвращает дату как есть, без выравнивания по неделе", () => {
        expect(resolveFirstAt("2026-09-24", utc(2026, 9, 26))).toBe("2026-09-24");
    });

    it("игнорирует мусор и будущие даты", () => {
        expect(resolveFirstAt("не дата", utc(2026, 9, 26))).toBeNull();
        expect(resolveFirstAt("2027-01-01", utc(2026, 9, 26))).toBeNull();
        expect(resolveFirstAt(null, utc(2026, 9, 26))).toBeNull();
    });
});

describe("buildGraph", () => {
    const now = utc(2026, 9, 26);

    it("оканчивается сегодняшним днём", () => {
        const { weeks } = buildGraph([], "2026-09-20", now);
        const flat = weeks.flat();

        expect(flat.at(-1)?.key).toBe("2026-09-26");
        expect(flat.some((d) => d.key > "2026-09-26")).toBe(false);
    });

    it("помечает дни до первой даты как пустые, а не выкидывает их", () => {
        const { weeks } = buildGraph([], "2026-09-20", now);
        const flat = weeks.flat();

        // Колонки до первой даты есть — сетка всегда шириной в год, — но они
        // не могут содержать действий, иначе подпись «Активность с …» врёт.
        expect(flat.length).toBeGreaterThan(300);
        const before = flat.filter((d) => d.key < "2026-09-20");
        expect(before.length).toBeGreaterThan(0);
        expect(before.every((d) => d.isBeforeWindow && d.count === 0)).toBe(true);
        expect(flat.filter((d) => d.key >= "2026-09-20").every((d) => !d.isBeforeWindow)).toBe(
            true,
        );
    });

    it("не рисует вымышленные дни в неполной последней неделе", () => {
        // Сетка стартует с понедельника 2025-09-01, поэтому 23.09.2026 (среда)
        // замыкает неполную колонку: 21-е, 22-е, 23-е.
        const { weeks } = buildGraph([], "2026-09-20", utc(2026, 9, 23));
        const last = keys(weeks).at(-1);

        expect(weeks.at(-1)!.length).toBe(3);
        expect(last).toEqual(["2026-09-21", "2026-09-22", "2026-09-23"]);
    });

    it("рисует сетку шириной в год даже для аккаунта двухдневной давности", () => {
        const { weeks } = buildGraph([], "2026-09-26", now);

        // Раньше здесь было 5 колонок, и виджет выглядел как обрывок.
        // Сетка идёт с 1.09.2025 по 26.09.2026 — 13 месяцев, 56 недель.
        expect(weeks.length).toBe(56);
    });

    it("начинает колонки с 1-го сентября и подписывает его первым", () => {
        const { weeks, months } = buildGraph([], "2026-09-26", now);

        expect(weeks[0][0].key).toBe("2025-09-01");
        expect(months[0]).toEqual({ label: "Сен", col: 0 });
    });

    it("подставляет счётчики из summary по ключу дня", () => {
        const { weeks } = buildGraph(
            [
                { date: "2026-09-21", count: 4 },
                { date: "2026-09-26", count: 1 },
            ],
            "2026-09-20",
            now,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-21")?.count).toBe(4);
        expect(flat.find((d) => d.key === "2026-09-26")?.count).toBe(1);
        expect(flat.find((d) => d.key === "2026-09-22")?.count).toBe(0);
    });

    it("раскладывает интенсивность по 4 уровням", () => {
        const summary = [
            { date: "2026-09-20", count: 1 },
            { date: "2026-09-21", count: 3 },
            { date: "2026-09-22", count: 6 },
            { date: "2026-09-23", count: 8 },
        ];
        const { weeks } = buildGraph(summary, "2026-09-20", now);
        const flat = weeks.flat();
        const level = (key: string) => flat.find((d) => d.key === key)?.level;

        expect(level("2026-09-20")).toBe(1);
        expect(level("2026-09-21")).toBe(2);
        expect(level("2026-09-22")).toBe(3);
        expect(level("2026-09-23")).toBe(4);
    });

    it("подписывает год только в январе", () => {
        const { months } = buildGraph([], "2026-01-05", utc(2026, 3, 1));

        // Подписи идут по всей сетке, а не от даты регистрации.
        expect(months[0].col).toBe(0);
        expect(months.some((m) => m.label === "Янв 26")).toBe(true);
        expect(months.some((m) => m.label === "Фев")).toBe(true);
    });

    it("покрывает ровно одну колонку на каждый отрезок в 7 дней", () => {
        const { weeks } = buildGraph([], "2026-09-01", now);

        for (const week of weeks) {
            expect(week.length).toBeLessThanOrEqual(7);
        }
    });

    it("считает дни без дырок между началом сетки и сегодня", () => {
        const { weeks } = buildGraph([], "2026-09-06", now);
        const flat = weeks.flat().filter((d) => d.key !== "");
        const gridStart = resolveGridStart(now);
        const expected = Math.floor((now.getTime() - gridStart.getTime()) / DAY) + 1;

        expect(flat).toHaveLength(expected);
    });

    it("учитывает активность за весь день, а не до текущего часа", () => {
        // Ключи строятся в UTC: локальный вечер 26-го в UTC+3 относится к 26-му UTC-дню
        const { weeks } = buildGraph([{ date: "2026-09-26", count: 7 }], "2026-09-26", now);

        expect(
            keys(weeks)
                .flat()
                .filter((k) => k === "2026-09-26"),
        ).toHaveLength(1);
        expect(weeks.flat().find((d) => d.key === "2026-09-26")?.count).toBe(7);
    });

    it("считает total только по окну, игнорируя более старые дни", () => {
        // Аккаунт зарегистрирован в 2024, но окно ограничено годом.
        const summary = [
            { date: "2024-03-11", count: 500 },
            { date: "2026-09-25", count: 3 },
            { date: "2026-09-26", count: 4 },
        ];

        const { total } = buildGraph(summary, "2024-03-11", now);

        expect(total).toBe(7);
    });

    it("total совпадает с суммой по отрисованным дням", () => {
        const summary = [
            { date: "2026-09-01", count: 2 },
            { date: "2026-09-02", count: 5 },
            { date: "2026-09-03", count: 1 },
        ];
        const { weeks, total } = buildGraph(summary, "2026-09-01", now);
        const fromDays = weeks.flat().reduce((acc, d) => acc + d.count, 0);

        expect(total).toBe(fromDays);
    });

    it("возвращает динамическую первую дату для подписи", () => {
        expect(buildGraph([], "2026-09-26", now).firstAt).toBe("2026-09-26");
        expect(buildGraph([], "2024-03-11", now).firstAt).toBe("2024-03-11");
    });

    it("не показывает подпись, если первая дата неизвестна или из будущего", () => {
        expect(buildGraph([], null, now).firstAt).toBeNull();
        expect(buildGraph([], "не дата", now).firstAt).toBeNull();
        expect(buildGraph([], "2027-01-01", now).firstAt).toBeNull();
    });

    it("обнуляет данные раньше первой даты, даже если бэкенд их прислал", () => {
        // Старый ответ API мог бы содержать дни до окна — они не рисуются,
        // иначе подпись «Активность с …» противоречила бы картинке.
        const { weeks, total } = buildGraph(
            [
                { date: "2025-10-01", count: 99 },
                { date: "2026-09-25", count: 2 },
            ],
            "2026-09-24",
            now,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2025-10-01")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2025-10-01")?.isBeforeWindow).toBe(true);
        expect(total).toBe(2);
    });
});
