import { describe, expect, it } from "vitest";
import {
    buildGraph,
    mondayOf,
    resolveFirstAt,
    resolveWindow,
    sumInWindow,
    sundayOf,
    weekdayLabels,
} from "./contribution-graph";

function utc(y: number, m: number, d: number): Date {
    return new Date(Date.UTC(y, m - 1, d));
}

function keys(weeks: { key: string }[][]): string[][] {
    return weeks.map((w) => w.map((d) => d.key));
}

function iso(date: Date): string {
    return date.toISOString().slice(0, 10);
}

describe("mondayOf / sundayOf", () => {
    it("возвращает границы недели для любого дня", () => {
        // 26.09.2026 — суббота: неделя 21–27 сентября.
        expect(iso(mondayOf(utc(2026, 9, 26)))).toBe("2026-09-21");
        expect(iso(sundayOf(utc(2026, 9, 26)))).toBe("2026-09-27");
    });

    it("не сдвигает понедельник и воскресенье", () => {
        expect(iso(mondayOf(utc(2026, 9, 21)))).toBe("2026-09-21");
        expect(iso(sundayOf(utc(2026, 9, 27)))).toBe("2026-09-27");
    });

    it("переходит через границу года", () => {
        expect(iso(mondayOf(utc(2027, 1, 1)))).toBe("2026-12-28");
        expect(iso(sundayOf(utc(2025, 12, 31)))).toBe("2026-01-04");
    });
});

describe("resolveWindow", () => {
    const now = utc(2026, 9, 26);

    it("rolling — последние 12 месяцев, заканчиваясь сегодняшним днём", () => {
        const { start, end } = resolveWindow({ kind: "rolling" }, now);

        expect(iso(start)).toBe("2025-09-27");
        expect(iso(end)).toBe("2026-09-26");
    });

    it("year — календарный год 1 января – 31 декабря", () => {
        const { start, end } = resolveWindow({ kind: "year", year: 2025 }, now);

        expect(iso(start)).toBe("2025-01-01");
        expect(iso(end)).toBe("2025-12-31");
    });

    it("from — ровно год от указанной даты", () => {
        const { start, end } = resolveWindow({ kind: "from", start: "2025-09-01" }, now);

        expect(iso(start)).toBe("2025-09-01");
        expect(iso(end)).toBe("2026-08-31");
    });

    it("from — год от 29 февраля заканчивается 28-го в невисокосном году", () => {
        const { start, end } = resolveWindow({ kind: "from", start: "2024-02-29" }, now);

        expect(iso(start)).toBe("2024-02-29");
        expect(iso(end)).toBe("2025-02-28");
    });

    it("from с мусорной датой откатывается к rolling", () => {
        const { start, end } = resolveWindow({ kind: "from", start: "не дата" }, now);

        expect(iso(start)).toBe("2025-09-27");
        expect(iso(end)).toBe("2026-09-26");
    });
});

describe("weekdayLabels", () => {
    it("подписывает строки от понедельника к воскресенью", () => {
        expect(weekdayLabels(utc(2025, 9, 1))).toEqual(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
    });

    it("не зависит от даты: сетка всегда начинается с понедельника", () => {
        // Колонка равна неделе и всегда начинается с понедельника, поэтому
        // разворот подписей всегда один и тот же — иначе строки разъезжаются.
        for (const [y, m, d] of [
            [2026, 9, 26],
            [2026, 1, 15],
            [2027, 2, 14],
        ] as const) {
            expect(weekdayLabels(mondayOf(utc(y, m, d)))).toEqual([
                "Пн",
                "Вт",
                "Ср",
                "Чт",
                "Пт",
                "Сб",
                "Вс",
            ]);
        }
    });

    it("подписывает все семь дней, без пропусков", () => {
        const labels = weekdayLabels(mondayOf(utc(2026, 9, 26)));

        expect(labels).toHaveLength(7);
        expect(labels.every((l) => l.length > 0)).toBe(true);
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

describe("buildGraph: rolling (профиль)", () => {
    const now = utc(2026, 9, 26);

    it("покрывает 53 недели от понедельника до воскресенья", () => {
        const { weeks, windowStart, windowEnd } = buildGraph([], "2026-09-20", now);

        expect(windowStart).toBe("2025-09-27");
        expect(windowEnd).toBe("2026-09-26");
        expect(weeks).toHaveLength(53);
        expect(weeks.flat()).toHaveLength(53 * 7);
        expect(weeks.every((w) => w.length === 7)).toBe(true);
        expect(weeks[0][0].key).toBe("2025-09-22");
        expect(weeks.at(-1)!.at(-1)!.key).toBe("2026-09-27");
    });

    it("сегодня стоит в предпоследней колонке, а завтра — единственный будущий день", () => {
        const { weeks } = buildGraph([], "2026-09-20", now);
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-26")?.isFuture).toBe(false);
        expect(flat.find((d) => d.key === "2026-09-27")?.isFuture).toBe(true);
        expect(flat.filter((d) => d.isFuture).map((d) => d.key)).toEqual(["2026-09-27"]);
    });

    it("помечает дни до начала окна пустыми, а не выкидывает их", () => {
        const { weeks } = buildGraph([], "2026-09-20", now);
        const flat = weeks.flat();

        // Первая неделя начинается раньше окна: 22–26 сентября 2025.
        const before = flat.filter((d) => d.key < "2025-09-27");
        expect(before.map((d) => d.key)).toEqual([
            "2025-09-22",
            "2025-09-23",
            "2025-09-24",
            "2025-09-25",
            "2025-09-26",
        ]);
        expect(before.every((d) => d.isBeforeWindow && d.count === 0)).toBe(true);
    });

    it("обнуляет активность из будущего и за пределами окна", () => {
        const { weeks, total } = buildGraph(
            [
                { date: "2025-09-26", count: 99 },
                { date: "2026-09-26", count: 2 },
                { date: "2026-09-27", count: 50 },
            ],
            "2026-09-20",
            now,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2025-09-26")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2026-09-27")?.count).toBe(0);
        expect(total).toBe(2);
    });

    it("не даёт будущим дням исказить максимум интенсивности", () => {
        const { weeks } = buildGraph(
            [
                { date: "2026-09-26", count: 3 },
                { date: "2026-09-27", count: 50 },
            ],
            "2026-09-20",
            now,
        );

        expect(weeks.flat().find((d) => d.key === "2026-09-26")?.level).toBe(4);
    });

    it("кладёт каждый день на строку его дня недели", () => {
        // 26.09.2026 — суббота, значит шестая строка (индекс 5).
        const { weeks } = buildGraph([], "2026-09-26", now);
        const col = weeks.findIndex((w) => w.some((d) => d.key === "2026-09-26"));
        const row = weeks[col].findIndex((d) => d.key === "2026-09-26");

        expect(row).toBe(5);
        expect(weekdayLabels(mondayOf(now))[row]).toBe("Сб");
    });

    it("подписывает январь с годом и не подписывает обрезки месяцев", () => {
        const { weeks, months } = buildGraph([], "2026-09-26", now);

        for (let i = 0; i < months.length; i++) {
            const next = months[i + 1]?.col ?? weeks.length;
            expect(next - months[i].col).toBeGreaterThanOrEqual(2);
        }
        expect(months.some((m) => m.label === "Янв 26")).toBe(true);
        expect(months.some((m) => m.label === "Сен")).toBe(true);
    });

    it("считает total только по окну, игнорируя более старые дни", () => {
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
});

describe("sumInWindow", () => {
    const now = utc(2026, 9, 26);

    it("для rolling считает только последние 12 месяцев", () => {
        const summary = [
            { date: "2025-09-26", count: 99 },
            { date: "2025-09-27", count: 2 },
            { date: "2026-09-26", count: 3 },
            { date: "2026-09-27", count: 99 },
        ];

        expect(sumInWindow(summary, { kind: "rolling" }, now)).toBe(5);
    });

    it("для года считает дни этого года и не считает будущие", () => {
        const summary = [
            { date: "2025-12-31", count: 99 },
            { date: "2026-01-01", count: 4 },
            { date: "2026-09-20", count: 1 },
            { date: "2026-12-31", count: 99 },
            { date: "2027-01-01", count: 99 },
        ];

        expect(sumInWindow(summary, { kind: "year", year: 2026 }, now)).toBe(5);
    });

    it("совпадает с total из buildGraph", () => {
        const summary = [
            { date: "2026-09-01", count: 2 },
            { date: "2026-09-02", count: 5 },
            { date: "2026-09-26", count: 1 },
        ];
        const mode = { kind: "rolling" } as const;

        expect(sumInWindow(summary, mode, now)).toBe(buildGraph(summary, null, now, mode).total);
    });
});

describe("buildGraph: year (выбранный год)", () => {
    const now = utc(2026, 9, 26);
    const mode = { kind: "year", year: 2026 } as const;

    it("окно — календарный год, сетка выровнена по неделям", () => {
        const { weeks, windowStart, windowEnd } = buildGraph([], "2024-03-11", now, mode);

        expect(windowStart).toBe("2026-01-01");
        expect(windowEnd).toBe("2026-12-31");
        // 01.01.2026 — четверг, поэтому неделя начинается 29.12.2025.
        expect(weeks[0][0].key).toBe("2025-12-29");
        expect(weeks.at(-1)!.at(-1)!.key).toBe("2027-01-03");
        expect(weeks).toHaveLength(53);
    });

    it("помечает дни соседних лет вне окна и не считает их", () => {
        const { weeks, total } = buildGraph(
            [
                { date: "2025-12-31", count: 99 },
                { date: "2026-06-15", count: 4 },
                { date: "2027-01-01", count: 99 },
            ],
            "2024-03-11",
            now,
            mode,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2025-12-31")?.isBeforeWindow).toBe(true);
        expect(flat.find((d) => d.key === "2025-12-31")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2027-01-01")?.isAfterWindow).toBe(true);
        expect(flat.find((d) => d.key === "2027-01-01")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2026-06-15")?.count).toBe(4);
        expect(total).toBe(4);
    });

    it("будущие дни текущего года остаются будущими", () => {
        const { weeks } = buildGraph([], "2024-03-11", now, mode);
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-26")?.isFuture).toBe(false);
        expect(flat.find((d) => d.key === "2026-09-27")?.isFuture).toBe(true);
        expect(flat.find((d) => d.key === "2026-12-31")?.isFuture).toBe(true);
    });

    it("для прошедшего года вся полоса заполнена, будущих дней нет", () => {
        const { weeks } = buildGraph([], "2024-03-11", now, { kind: "year", year: 2025 });

        expect(weeks.flat().some((d) => d.isFuture)).toBe(false);
        expect(weeks.length).toBe(53);
    });
});

describe("buildGraph: from (учебный год проекта)", () => {
    const now = utc(2026, 9, 26);
    const mode = { kind: "from", start: "2025-09-01" } as const;

    it("окно — год от даты создания проекта", () => {
        const { weeks, windowStart, windowEnd } = buildGraph([], "2025-09-01", now, mode);

        expect(windowStart).toBe("2025-09-01");
        expect(windowEnd).toBe("2026-08-31");
        // 01.09.2025 — понедельник, 31.08.2026 — понедельник.
        expect(weeks[0][0].key).toBe("2025-09-01");
        expect(weeks.at(-1)!.at(-1)!.key).toBe("2026-09-06");
        expect(weeks).toHaveLength(53);
    });

    it("активность после конца учебного года не попадает в график", () => {
        const { weeks, total } = buildGraph(
            [
                { date: "2025-10-01", count: 3 },
                { date: "2026-09-10", count: 99 },
            ],
            "2025-09-01",
            now,
            mode,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2025-10-01")?.count).toBe(3);
        // 10.09.2026 вообще не попадает в сетку: она кончается 06.09.2026.
        expect(flat.find((d) => d.key === "2026-09-10")).toBeUndefined();
        // Хвост первой недели после 31.08.2026 нарисован, но пустой.
        expect(flat.find((d) => d.key === "2026-09-01")?.isAfterWindow).toBe(true);
        expect(flat.find((d) => d.key === "2026-09-01")?.count).toBe(0);
        expect(total).toBe(3);
    });

    it("для свежего проекта будущие дни идут после сегодняшнего", () => {
        const { weeks } = buildGraph([], "2026-09-26", now, {
            kind: "from",
            start: "2026-09-26",
        });
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-26")?.isFuture).toBe(false);
        expect(flat.find((d) => d.key === "2026-09-27")?.isFuture).toBe(true);
        expect(flat.filter((d) => d.isFuture).length).toBeGreaterThan(300);
    });
});
