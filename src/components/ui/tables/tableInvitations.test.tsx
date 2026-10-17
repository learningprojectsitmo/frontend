// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TableInvitations } from "@/components/ui/tables/tableInvitations";
import { type Replycant } from "@/types/tables/forTables";

// Компонентный тест на DOM-поведение без @testing-library — как в
// tableMembers.test.tsx: подход тот же, MemoryRouter нужен из-за <Link>.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

const CURRENT_USER_ID = 1;

const baseInvitation: Replycant = {
    id: 7,
    name: "Петрова Анна",
    priority: 0,
    contacts: "anna@example.com",
    resumeUrl: "/app/resume?id=3",
    responseDate: "2026-02-01",
    role: "Разработчик",
    type: "invitation",
    responseStatus: "pending",
    status: "invite",
    userId: 42,
    allowMultiProjectParticipation: true,
    busyInOtherProject: false,
};

function renderTable(props: Partial<Parameters<typeof TableInvitations>[0]> = {}) {
    act(() => {
        root.render(
            <MemoryRouter>
                <TableInvitations
                    headerList={["Имя", "Роль"]}
                    members={[baseInvitation]}
                    currentUserId={CURRENT_USER_ID}
                    {...props}
                />
            </MemoryRouter>,
        );
    });
}

const findAction = (label: string): HTMLButtonElement | null =>
    [...container.querySelectorAll("button")].find((b) => b.textContent === label) ?? null;

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

describe("TableInvitations: отзыв приглашения руководителем", () => {
    it("показывает кнопку отзыва и передаёт id приглашения", () => {
        // given
        const onCancelInvitation = vi.fn();
        // when
        renderTable({ canManage: true, onCancelInvitation });
        // then
        const button = findAction("Отозвать");
        expect(button).not.toBeNull();
        act(() => {
            button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(onCancelInvitation).toHaveBeenCalledWith(7);
    });

    it("не показывает отзыв тому, кто не управляет проектом", () => {
        // given
        // when
        renderTable({ canManage: false });
        // then
        expect(findAction("Отозвать")).toBeNull();
        expect(container.textContent).toContain("Приглашение отправлено");
    });

    it("не показывает отзыв приглашённому: своё приглашение он решает сам", () => {
        // given
        const ownInvitation = { ...baseInvitation, userId: CURRENT_USER_ID };
        // when
        renderTable({ canManage: true, members: [ownInvitation] });
        // then
        expect(findAction("Отозвать")).toBeNull();
        expect(findAction("Принять")).not.toBeNull();
        expect(findAction("Отклонить")).not.toBeNull();
    });

    it("подписывает уже отозванное приглашение, а не «В команде»", () => {
        // given
        const cancelled = { ...baseInvitation, responseStatus: "cancelled" as const };
        // when
        renderTable({ canManage: true, members: [cancelled] });
        // then
        expect(container.textContent).toContain("Отозвано руководителем");
        expect(findAction("Отозвать")).toBeNull();
    });
});

describe("TableInvitations: сворачивание групп", () => {
    const groups = [
        {
            key: "10",
            projectName: "Проект Альфа",
            workspaceName: "Пространство",
            items: [baseInvitation],
        },
        {
            key: "20",
            projectName: "Проект Бета",
            workspaceName: "Пространство",
            items: [{ ...baseInvitation, id: 8, name: "Иванов Иван" }],
        },
    ];

    const renderGrouped = (props: Partial<Parameters<typeof TableInvitations>[0]> = {}) => {
        act(() => {
            root.render(
                <MemoryRouter>
                    <TableInvitations
                        headerList={["Имя", "Роль"]}
                        members={[]}
                        grouped
                        groups={groups}
                        {...props}
                    />
                </MemoryRouter>,
            );
        });
    };

    const clickGroupHeader = (projectName: string) => {
        const header = [...container.querySelectorAll("tr")].find((tr) =>
            tr.textContent?.includes(projectName),
        );
        expect(header).toBeTruthy();
        act(() => {
            header!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
    };

    it("по умолчанию все группы свёрнуты: строки участников не в DOM", () => {
        // given
        // when
        renderGrouped();
        // then
        expect(container.textContent).toContain("Проект Альфа");
        expect(container.textContent).not.toContain("Петрова Анна");
        expect(container.textContent).not.toContain("Иванов Иван");
    });

    it("клик по заголовку группы разворачивает её строки", () => {
        // given
        renderGrouped();
        // when
        clickGroupHeader("Проект Альфа");
        // then
        expect(container.textContent).toContain("Петрова Анна");
        expect(container.textContent).not.toContain("Иванов Иван");
    });

    it("в управляемом режиме вызывает onExpandedChange с новой картой", () => {
        // given
        const onExpandedChange = vi.fn();
        // when
        renderGrouped({ expanded: {}, onExpandedChange });
        clickGroupHeader("Проект Альфа");
        // then
        expect(onExpandedChange).toHaveBeenCalledWith({ "10": true });
    });

    it("разворачивает все группы, когда expanded передан со всеми ключами true", () => {
        // given
        // when
        renderGrouped({ expanded: { "10": true, "20": true } });
        // then
        expect(container.textContent).toContain("Петрова Анна");
        expect(container.textContent).toContain("Иванов Иван");
    });
});
