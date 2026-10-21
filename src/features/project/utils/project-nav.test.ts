import { describe, expect, it } from "vitest";

import { buildProjectNavHref } from "./project-nav";

describe("buildProjectNavHref", () => {
    it("ведёт на соседний проект", () => {
        // given
        const params = new URLSearchParams("id=28");

        // when
        const href = buildProjectNavHref(29, params);

        // then
        expect(href).toBe("/app/project?id=29");
    });

    it("сохраняет открытую вкладку", () => {
        // given — человек смотрит канбан и листает проекты
        const params = new URLSearchParams("id=28&tab=kanban");

        // when
        const href = buildProjectNavHref(29, params);

        // then
        expect(href).toBe("/app/project?id=29&tab=kanban");
    });

    it("сбрасывает режим правки: он относится к конкретному проекту", () => {
        // given
        const params = new URLSearchParams("id=28&edit=true");

        // when
        const href = buildProjectNavHref(29, params);

        // then
        expect(href).toBe("/app/project?id=29");
        expect(href).not.toContain("edit");
    });

    it("не меняет исходные параметры", () => {
        // given
        const params = new URLSearchParams("id=28&tab=wiki");

        // when
        buildProjectNavHref(29, params);

        // then
        expect(params.get("id")).toBe("28");
    });

    it("экранирует имя вкладки", () => {
        // given
        const params = new URLSearchParams("id=28&tab=%D0%B2%D0%BA%D0%BB%D0%B0%D0%B4%D0%BA%D0%B0");

        // when
        const href = buildProjectNavHref(29, params);

        // then
        expect(href).toBe("/app/project?id=29&tab=%D0%B2%D0%BA%D0%BB%D0%B0%D0%B4%D0%BA%D0%B0");
    });
});
