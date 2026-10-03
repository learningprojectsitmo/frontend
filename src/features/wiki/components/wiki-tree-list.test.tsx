// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildWikiTree, type WikiTreeNode } from "@/features/wiki/build-wiki-tree";
import { WikiTreeList } from "@/features/wiki/components/wiki-tree-list";
import type { WikiPageSummary } from "@/types/api";

// Тест на DOM-поведение без @testing-library: в проекте его нет, а тащить
// новую зависимость ради одного компонента не хочется. jsdom уже в devDeps.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

const page = (over: Partial<WikiPageSummary> & { id: number }): WikiPageSummary => ({
    project_id: 1,
    parent_id: null,
    title: `Страница ${over.id}`,
    visibility: "public",
    position: 0,
    updated_at: null,
    ...over,
});

const node = (over: Partial<WikiTreeNode> & { id: number }): WikiTreeNode => ({
    project_id: 1,
    parent_id: null,
    title: `Страница ${over.id}`,
    visibility: "public",
    position: 0,
    updated_at: null,
    children: [],
    ...over,
});

const renderTree = (
    nodes: WikiTreeNode[],
    props: Partial<React.ComponentProps<typeof WikiTreeList>> = {},
) => {
    act(() => {
        root.render(<WikiTreeList nodes={nodes} activeId={null} onSelect={() => {}} {...props} />);
    });
};

const byTitle = (title: string): HTMLElement => {
    const found = [...container.querySelectorAll("span")].find((s) => s.textContent === title);
    if (!found) throw new Error(`Не найдена строка «${title}»`);
    return found;
};

/** У вложенной строки отступ больше, чем у родителя — это и есть вложенность. */
const indentOf = (title: string): number => {
    const row = byTitle(title).closest("div");
    return Number.parseInt(row?.style.paddingLeft ?? "0", 10);
};

const guides = (): HTMLElement[] => [...container.querySelectorAll<HTMLElement>("ul.border-l")];

describe("WikiTreeList", () => {
    it("показывает вложенность растущим отступом", () => {
        renderTree(
            buildWikiTree([
                page({ id: 1, title: "Корень" }),
                page({ id: 2, parent_id: 1, title: "Дитя" }),
                page({ id: 3, parent_id: 2, title: "Внук" }),
            ]),
        );

        expect(indentOf("Корень")).toBe(0);
        expect(indentOf("Дитя")).toBeGreaterThan(indentOf("Корень"));
        expect(indentOf("Внук")).toBeGreaterThan(indentOf("Дитя"));
    });

    it("рисует направляющую для каждого уровня вложенности", () => {
        renderTree(
            buildWikiTree([
                page({ id: 1 }),
                page({ id: 2, parent_id: 1 }),
                page({ id: 3, parent_id: 2 }),
            ]),
        );

        // По одной на каждый уровень ниже корня: их два при трёх страницах.
        expect(guides()).toHaveLength(2);
    });

    it("сворачивает ветку по шеврону и раскрывает обратно", () => {
        renderTree(
            buildWikiTree([
                page({ id: 1, title: "Корень" }),
                page({ id: 2, parent_id: 1, title: "Дитя" }),
            ]),
        );
        expect(guides()).toHaveLength(1);

        const toggle = container.querySelector<HTMLButtonElement>("[aria-expanded]");
        expect(toggle?.getAttribute("aria-expanded")).toBe("true");

        act(() => toggle?.click());
        expect(guides()).toHaveLength(0);

        act(() => container.querySelector<HTMLButtonElement>("[aria-expanded]")?.click());
        expect(guides()).toHaveLength(1);
    });

    it("не даёт шеврон листу — у него нет детей", () => {
        renderTree(buildWikiTree([page({ id: 1, title: "Лист" })]));

        expect(container.querySelector("[aria-expanded]")).toBeNull();
    });

    it("передаёт id страницы в onSelect", () => {
        const selected: number[] = [];
        renderTree(buildWikiTree([page({ id: 7, title: "Корень" })]), {
            onSelect: (id) => selected.push(id),
        });

        act(() => byTitle("Корень").closest("button")?.click());

        expect(selected).toEqual([7]);
    });

    it("помечает активную страницу для скринридера", () => {
        renderTree(buildWikiTree([page({ id: 1, title: "Корень" })]), { activeId: 1 });

        expect(byTitle("Корень").closest("button")?.getAttribute("aria-current")).toBe("page");
    });

    it("рисует действия строки, когда передан слот", () => {
        renderTree([node({ id: 1, title: "Корень" })]);
        expect(container.querySelector('[aria-label^="Удалить"]')).toBeNull();

        renderTree([node({ id: 1, title: "Корень" })], {
            renderActions: (n) => <button aria-label={`Удалить ${n.title}`}>x</button>,
        });
        expect(container.querySelector('[aria-label="Удалить Корень"]')).toBeTruthy();
    });
});
