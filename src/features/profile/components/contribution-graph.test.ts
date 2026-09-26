import { describe, expect, it } from "vitest";
import {
    buildGraph,
    resolveFirstAt,
    resolveGridEnd,
    resolveGridStart,
    weekdayLabels,
} from "./contribution-graph";

const DAY = 86_400_000;

function utc(y: number, m: number, d: number): Date {
    return new Date(Date.UTC(y, m - 1, d));
}

function keys(weeks: { key: string }[][]): string[][] {
    return weeks.map((w) => w.map((d) => d.key));
}

describe("resolveGridStart", () => {
    it("начинает с понедельника недели, где лежит 1-е число месяца", () => {
        // Сегодня 26.09.2026, 1 сентября — вторник, поэтому сетка начинается
        // с понедельника 31 августа: колонка должна быть полной неделей.
        expect(
            resolveGridStart(utc(2026, 9, 26))
                .toISOString()
                .slice(0, 10),
        ).toBe("2026-08-31");
    });

    it("отступает назад, а не вперёд, с любого дня недели", () => {
        // Якорь — 1-е число месяца, и оно может попасть на любой день недели.
        // Понедельник ищется только назад от него, иначе первая колонка
        // оказалась бы обрезанной.
        //   01.08.2026 — сб → пн 27.07
        //   01.09.2026 — вт → пн 31.08
        //   01.02.2026 — вс → пн 26.01
        const cases = [
            [[2026, 8, 15], "2026-07-27"],
            [[2026, 9, 26], "2026-08-31"],
            [[2026, 2, 14], "2026-01-26"],
        ] as const;

        for (const [[y, m, d], expected] of cases) {
            expect(
                resolveGridStart(utc(y, m, d))
                    .toISOString()
                    .slice(0, 10),
            ).toBe(expected);
        }
    });

    it("всегда начинается с понедельника", () => {
        for (const [y, m, d] of [
            [2026, 9, 26],
            [2026, 1, 15],
            [2026, 3, 1],
            [2026, 12, 31],
            [2027, 2, 14],
            [2028, 2, 10],
        ] as const) {
            expect(resolveGridStart(utc(y, m, d)).getUTCDay()).toBe(1);
        }
    });

    it("не отрывается от начала месяца больше чем на неделю", () => {
        for (const [y, m, d] of [
            [2026, 9, 26],
            [2026, 3, 1],
            [2027, 2, 14],
        ] as const) {
            const first = new Date(Date.UTC(y, m - 1, 1));
            const start = resolveGridStart(utc(y, m, d));
            const back = Math.round((first.getTime() - start.getTime()) / DAY);

            expect(back).toBeGreaterThanOrEqual(0);
            expect(back).toBeLessThanOrEqual(6);
        }
    });
});

describe("resolveGridEnd", () => {
    it("закрывает окно воскресеньем ровно через 52 недели", () => {
        const start = resolveGridStart(utc(2026, 9, 26));
        const end = resolveGridEnd(start);

        expect(end.toISOString().slice(0, 10)).toBe("2027-08-29");
        expect(end.getUTCDay()).toBe(0);
        expect((end.getTime() - start.getTime()) / DAY + 1).toBe(364);
    });

    it("не схлопывается на переходе через границу года", () => {
        const start = resolveGridStart(utc(2026, 1, 15));
        const end = resolveGridEnd(start);

        // Декабрь 2025 → декабрь 2026: окно всегда одно и то же по длине.
        expect(start.toISOString().slice(0, 10)).toBe("2025-12-29");
        expect(end.toISOString().slice(0, 10)).toBe("2026-12-27");
        expect((end.getTime() - start.getTime()) / DAY + 1).toBe(364);
    });

    it("даёт одинаковую длину окна в любой месяц, включая високосный февраль", () => {
        // Длина задаётся неделями, а не месяцами, поэтому 29 февраля ничего
        // не ломает: окно всегда 52 полные колонки.
        for (const [y, m, d] of [
            [2026, 9, 26],
            [2027, 2, 14],
            [2028, 2, 10],
            [2028, 3, 1],
        ] as const) {
            const start = resolveGridStart(utc(y, m, d));
            const end = resolveGridEnd(start);
            expect((end.getTime() - start.getTime()) / DAY + 1).toBe(364);
            expect(start.getUTCDay()).toBe(1);
            expect(end.getUTCDay()).toBe(0);
        }
    });
});

describe("weekdayLabels", () => {
    it("подписывает строки от понедельника к воскресенью", () => {
        expect(weekdayLabels(utc(2025, 9, 1))).toEqual(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
    });

    it("не зависит от даты: сетка всегда начинается с понедельника", () => {
        // Окно якорится на понедельнике, поэтому разворот подписей всегда
        // один и тот же — иначе строки разъезжаются с ячейками.
        for (const [y, m, d] of [
            [2026, 9, 26],
            [2026, 1, 15],
            [2027, 2, 14],
        ] as const) {
            expect(weekdayLabels(resolveGridStart(utc(y, m, d)))).toEqual([
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
        // Раньше подписывались только Пн/Ср/Пт, и по пустым строкам было
        // нельзя понять, какой день где стоит.
        const labels = weekdayLabels(resolveGridStart(utc(2026, 9, 26)));

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

describe("buildGraph", () => {
    const now = utc(2026, 9, 26);

    it("оканчивается концом окна, а сегодня внутри", () => {
        const { weeks } = buildGraph([], "2026-09-20", now);
        const flat = weeks.flat();

        expect(flat.at(-1)?.key).toBe("2027-08-29");
        expect(flat.some((d) => d.key > "2027-08-29")).toBe(false);
        // Сегодня — не последний день сетки: дальше идут будущие дни.
        expect(flat.find((d) => d.key === "2026-09-26")).toBeDefined();
        expect(flat.at(-1)?.isFuture).toBe(true);
    });

    it("помечает дни после сегодняшнего как будущие", () => {
        const { weeks } = buildGraph([], "2026-09-20", now);
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-26")?.isFuture).toBe(false);
        expect(flat.find((d) => d.key === "2026-09-27")?.isFuture).toBe(true);
        expect(flat.every((d) => (d.key <= "2026-09-26" ? !d.isFuture : d.isFuture))).toBe(true);
    });

    it("обнуляет активность из будущего, даже если бэкенд её прислал", () => {
        // Иначе будущая ячейка красилась бы по счётчику, которого ещё нет.
        const { weeks, total } = buildGraph(
            [
                { date: "2026-09-26", count: 2 },
                { date: "2026-09-27", count: 50 },
                { date: "2027-01-01", count: 50 },
            ],
            "2026-09-20",
            now,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-27")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2027-01-01")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2026-09-27")?.level).toBe(0);
        expect(total).toBe(2);
    });

    it("не даёт будущим дням исказить максимум интенсивности", () => {
        // 50 в будущем не должны поймать и 3 действия сегодняшнего дня.
        const { weeks } = buildGraph(
            [
                { date: "2026-09-26", count: 3 },
                { date: "2026-10-01", count: 50 },
            ],
            "2026-09-20",
            now,
        );

        expect(weeks.flat().find((d) => d.key === "2026-09-26")?.level).toBe(4);
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

    it("заполняет все колонки целиком, без обрезанного хвоста", () => {
        // Окно — целое число недель, поэтому ни одна колонка не короче семи
        // ячеек и последняя неделя не выглядит обрезанной.
        const { weeks } = buildGraph([], "2026-09-20", now);

        expect(weeks.every((w) => w.length === 7)).toBe(true);
        expect(keys(weeks).at(-1)).toEqual([
            "2027-08-23",
            "2027-08-24",
            "2027-08-25",
            "2027-08-26",
            "2027-08-27",
            "2027-08-28",
            "2027-08-29",
        ]);
    });

    it("рисует сетку шириной в год даже для аккаунта двухдневной давности", () => {
        const { weeks } = buildGraph([], "2026-09-26", now);

        // Раньше здесь было 5 колонок, и виджет выглядел как обрывок.
        // Сетка идёт с 31.08.2026 по 29.08.2027 — 364 дня, 52 недели.
        expect(weeks.length).toBe(52);
        expect(weeks.flat()).toHaveLength(364);
    });

    it("начинает колонки с понедельника и подписывает месяцы по всей сетке", () => {
        const { weeks, months } = buildGraph([], "2026-09-26", now);

        // 1 сентября 2026 — вторник, поэтому неделя начинается 31 августа.
        expect(weeks[0][0].key).toBe("2026-08-31");
        // «Авг» на первом столбце не подписываем: там лежит один день.
        expect(months[0]).toEqual({ label: "Сен", col: 1 });
    });

    it("не подписывает месяц, который уместился в одну колонку", () => {
        const { weeks, months } = buildGraph([], "2026-09-26", now);

        // Подпись допустима, только если за ней хотя бы пара колонок: иначе
        // она висит над обрезком в один-два дня и врёт о ширине месяца.
        for (let i = 0; i < months.length; i++) {
            const next = months[i + 1]?.col ?? weeks.length;
            expect(next - months[i].col).toBeGreaterThanOrEqual(2);
        }
        // «Авг» остаётся один раз — в августе 2027, а не в однодневном хвосте.
        expect(months.filter((m) => m.label === "Авг")).toHaveLength(1);
        expect(months.at(-1)).toEqual({ label: "Авг", col: 48 });
    });

    it("кладёт каждый день на строку его дня недели", () => {
        // 26.09.2026 — суббота, значит шестая строка (индекс 5).
        const { weeks } = buildGraph([], "2026-09-26", now);
        const col = weeks.findIndex((w) => w.some((d) => d.key === "2026-09-26"));
        const row = weeks[col].findIndex((d) => d.key === "2026-09-26");

        expect(row).toBe(5);
        expect(weekdayLabels(resolveGridStart(utc(2026, 9, 26)))[row]).toBe("Сб");
    });

    it("подписывает текущий месяц один раз, а год — в январе", () => {
        const { months } = buildGraph([], "2026-09-26", now);

        // Окно начинается с сентября, поэтому «Сен» не должен повторяться
        // в конце, как было при взгляде назад.
        expect(months.filter((m) => m.label === "Сен")).toHaveLength(1);
        expect(months.some((m) => m.label === "Янв 27")).toBe(true);
        expect(months.some((m) => m.label === "Авг")).toBe(true);
    });

    it("подписывает год только в январе", () => {
        const { months } = buildGraph([], "2026-01-05", utc(2026, 3, 1));

        // Подписи идут по всей сетке, а не от даты регистрации. Сетка при
        // today=01.03.2026 стартует с 23.02, и февраль занимает ровно одну
        // колонку, поэтому первая подпись — «Мар», а не «Фев».
        expect(months[0]).toEqual({ label: "Мар", col: 1 });
        expect(months.at(-1)).toEqual({ label: "Фев", col: 49 });
        expect(months.some((m) => m.label === "Янв 27")).toBe(true);
        expect(months.some((m) => m.label === "Фев")).toBe(true);
        expect(months.every((m) => !/Янв 26/.test(m.label))).toBe(true);
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

    it("покрывает ровно одну колонку на каждый отрезок в 7 дней", () => {
        const { weeks } = buildGraph([], "2026-09-01", now);

        for (const week of weeks) {
            expect(week.length).toBeLessThanOrEqual(7);
        }
    });

    it("считает дни без дырок между началом и концом окна", () => {
        const { weeks } = buildGraph([], "2026-09-06", now);
        const flat = weeks.flat();
        const gridStart = resolveGridStart(now);
        const gridEnd = resolveGridEnd(gridStart);
        const expected = Math.floor((gridEnd.getTime() - gridStart.getTime()) / DAY) + 1;

        expect(flat).toHaveLength(expected);
        expect(flat[0].key).toBe("2026-08-31");
        expect(flat.at(-1)!.key).toBe("2027-08-29");
        // Ни дырок, ни повторов: каждая дата в окне встречается ровно один раз.
        expect(new Set(flat.map((d) => d.key)).size).toBe(flat.length);
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
        // Старый ответ API мог бы содержать дни до окна активности — они не
        // рисуются, иначе подпись «Активность с …» противоречила бы картинке.
        const { weeks, total } = buildGraph(
            [
                { date: "2026-09-10", count: 99 },
                { date: "2026-09-25", count: 2 },
            ],
            "2026-09-24",
            now,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2026-09-10")?.count).toBe(0);
        expect(flat.find((d) => d.key === "2026-09-10")?.isBeforeWindow).toBe(true);
        expect(total).toBe(2);
    });

    it("не рисует дни, которые вообще вне окна", () => {
        // Окно начинается 01.09.2026, поэтому прошлый год на картинке не места.
        const { weeks, total } = buildGraph(
            [
                { date: "2025-10-01", count: 99 },
                { date: "2026-09-26", count: 4 },
            ],
            "2024-03-11",
            now,
        );
        const flat = weeks.flat();

        expect(flat.find((d) => d.key === "2025-10-01")).toBeUndefined();
        expect(flat[0].key).toBe("2026-08-31");
        expect(total).toBe(4);
    });
});
