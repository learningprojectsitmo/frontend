// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TableMembers } from "@/components/ui/tables/tableMembers";
import { type Member } from "@/types/tables/forTables";

// Компонентный тест на DOM-поведение без @testing-library: его в проекте нет,
// а тянуть новую зависимость ради одной таблицы не хочется. Подход тот же, что
// в wiki-tree-list.test.tsx, плюс MemoryRouter — таблица рендерит <Link>.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

const baseMember: Member = {
    id: 1,
    userId: 55,
    name: "Иванов Иван",
    role: "Участник",
    workspaceRole: "Участник",
    contacts: { telegram: "@admin_tg", email: "ivanov@example.com", linkedin: null },
    resumeUrl: "/app/resume?id=1&workspaceId=19",
    dateAdded: "2026-01-15T10:00:00",
    status: "default",
    projects: [{ id: 42, title: "Новый проект" }],
};

function renderTable(props: Partial<Parameters<typeof TableMembers>[0]> = {}) {
    act(() => {
        root.render(
            <MemoryRouter>
                <TableMembers members={[baseMember]} showProject {...props} />
            </MemoryRouter>,
        );
    });
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
});

describe("TableMembers: проекты", () => {
    it("рендерит название проекта ссылкой на страницу проекта", () => {
        // given
        // when
        renderTable();
        // then
        const link = container.querySelector<HTMLAnchorElement>('a[href="/app/project?id=42"]');
        expect(link).not.toBeNull();
        expect(link?.textContent).toBe("Новый проект");
    });

    it("не кликабельная ссылка на проект не остаётся: это <a>, а не <span>", () => {
        // given
        // when
        renderTable();
        // then
        const link = container.querySelector<HTMLAnchorElement>('a[href="/app/project?id=42"]');
        expect(link?.tagName).toBe("A");
        // и сам текст проекта не обёрнут в span-имитацию ссылки
        expect(container.querySelector("span")?.textContent).not.toBe("Новый проект");
    });

    it("ссылается на каждый проект участника", () => {
        // given
        const member = {
            ...baseMember,
            projects: [
                { id: 1, title: "Первый" },
                { id: 2, title: "Второй" },
            ],
        };
        // when
        renderTable({ members: [member] });
        // then
        expect(container.querySelector('a[href="/app/project?id=1"]')?.textContent).toBe("Первый");
        expect(container.querySelector('a[href="/app/project?id=2"]')?.textContent).toBe("Второй");
    });

    it("не рендерит колонку проектов, если showProject выключен", () => {
        // given
        // when
        renderTable({ showProject: false });
        // then
        expect(container.querySelector('a[href="/app/project?id=42"]')).toBeNull();
        const headers = [...container.querySelectorAll("th")].map((th) => th.textContent);
        expect(headers).not.toContain("Проекты");
    });

    it("показывает прочерк, если у участника нет проектов", () => {
        // given
        // when
        renderTable({ members: [{ ...baseMember, projects: [] }] });
        // then
        expect(container.querySelector('a[href^="/app/project"]')).toBeNull();
        expect(container.textContent).toContain("—");
    });
});

describe("TableMembers: контакт Telegram", () => {
    it("открывается в новой вкладке и ведёт на t.me без @", () => {
        // given
        // when
        renderTable();
        // then
        const link = container.querySelector<HTMLAnchorElement>('a[href="https://t.me/admin_tg"]');
        expect(link).not.toBeNull();
        expect(link?.getAttribute("target")).toBe("_blank");
        expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("рисует иконку, а не текст «tg»", () => {
        // given
        // when
        renderTable();
        // then
        const link = container.querySelector<HTMLAnchorElement>('a[href="https://t.me/admin_tg"]');
        expect(link?.textContent?.trim()).toBe("");
        expect(link?.querySelector("svg")).not.toBeNull();
        expect(link?.getAttribute("aria-label")).toBe("Telegram");
    });

    it("останавливает всплытие клика, чтобы не сработал обработчик строки", () => {
        // given
        const onRowClick = vi.fn();
        // when
        renderTable({ onRowClick });
        const link = container.querySelector<HTMLAnchorElement>('a[href="https://t.me/admin_tg"]')!;
        act(() => {
            link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        });
        // then
        expect(onRowClick).not.toHaveBeenCalled();
    });

    it("останавливает всплытие и на ссылке проекта", () => {
        // given
        const onRowClick = vi.fn();
        // when
        renderTable({ onRowClick });
        const link = container.querySelector<HTMLAnchorElement>('a[href="/app/project?id=42"]')!;
        act(() => {
            link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        });
        // then
        expect(onRowClick).not.toHaveBeenCalled();
    });
});
