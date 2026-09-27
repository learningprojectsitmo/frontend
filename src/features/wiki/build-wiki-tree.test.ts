import { describe, expect, it } from "vitest";

import { buildWikiTree } from "@/features/wiki/build-wiki-tree";
import type { WikiPageSummary } from "@/types/api";

const page = (over: Partial<WikiPageSummary> & { id: number }): WikiPageSummary => ({
    project_id: 1,
    parent_id: null,
    title: `Страница ${over.id}`,
    visibility: "public",
    position: 0,
    updated_at: null,
    ...over,
});

describe("buildWikiTree", () => {
    it("превращает плоский список в дерево по parent_id", () => {
        const tree = buildWikiTree([
            page({ id: 1, title: "Корень" }),
            page({ id: 2, parent_id: 1, title: "Дитя" }),
            page({ id: 3, parent_id: 2, title: "Внук" }),
        ]);

        expect(tree).toHaveLength(1);
        expect(tree[0].title).toBe("Корень");
        expect(tree[0].children[0].title).toBe("Дитя");
        expect(tree[0].children[0].children[0].title).toBe("Внук");
    });

    it("сортирует корни и детей по position", () => {
        const tree = buildWikiTree([
            page({ id: 1, title: "Поздняя", position: 9 }),
            page({ id: 2, title: "Ранняя", position: 1 }),
            page({ id: 3, parent_id: 2, title: "Поздний ребёнок", position: 5 }),
            page({ id: 4, parent_id: 2, title: "Ранний ребёнок", position: 2 }),
        ]);

        expect(tree.map((n) => n.title)).toEqual(["Ранняя", "Поздняя"]);
        expect(tree[0].children.map((n) => n.title)).toEqual(["Ранний ребёнок", "Поздний ребёнок"]);
    });

    it("при равном position сортирует по заголовку, чтобы порядок не прыгал", () => {
        const tree = buildWikiTree([
            page({ id: 1, title: "Яблоко" }),
            page({ id: 2, title: "Апельсин" }),
        ]);

        expect(tree.map((n) => n.title)).toEqual(["Апельсин", "Яблоко"]);
    });

    it("поднимает в корень страницу с отсутствующим родителем, а не теряет её", () => {
        // Такой набор вернуть нельзя: при create/update чужой parent_id даёт 404.
        // Но если бэкенд отдаст Private в Public — страница не пропала бы молча.
        const tree = buildWikiTree([page({ id: 1, parent_id: 99, title: "Сирота" })]);

        expect(tree).toHaveLength(1);
        expect(tree[0].title).toBe("Сирота");
    });

    it("не зацикливается на взаимном родительстве", () => {
        // Цикл сервер не даст поставить (проверка в update_page), но helper
        // не должен упасть или потерять страницы, если данные придут битыми.
        const tree = buildWikiTree([page({ id: 1, parent_id: 2 }), page({ id: 2, parent_id: 1 })]);

        expect(tree.flatMap((n) => [n.id, ...n.children.map((c) => c.id)])).toEqual([1, 2]);
    });

    it("разрывает цикл из трёх узлов, а не роняет список", () => {
        // 1→3→2→1: без разрыва ни у одной страницы не осталось бы корня,
        // и сайдбар показал бы пустоту вместо трёх страниц.
        const tree = buildWikiTree([
            page({ id: 1, parent_id: 3 }),
            page({ id: 2, parent_id: 1 }),
            page({ id: 3, parent_id: 2 }),
        ]);

        expect(tree.flatMap((n) => [n.id, ...n.children.map((c) => c.id)]).sort()).toEqual([
            1, 2, 3,
        ]);
    });

    it("не мутирует исходный массив", () => {
        const pages = [
            page({ id: 2, title: "Поздняя", position: 5 }),
            page({ id: 1, title: "Ранняя" }),
        ];

        buildWikiTree(pages);

        expect(pages.map((p) => p.id)).toEqual([2, 1]);
    });

    it("возвращает пустой список на пустых данных", () => {
        expect(buildWikiTree([])).toEqual([]);
    });

    it("не добавляет children в исходные объекты", () => {
        const pages = [page({ id: 1 })];

        buildWikiTree(pages);

        expect(pages[0]).not.toHaveProperty("children");
    });
});
