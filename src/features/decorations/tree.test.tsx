// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Инициализирует i18next (без него `useTranslation` вернёт ключи, а не фразы).
import "@/i18n/config";

import { Tree } from "./tree";

// Компонентный тест без @testing-library — как в tableMembers.test.tsx:
// рендерим через react-dom/client и проверяем реальный DOM.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

/** Должен совпадать с константой в tree.tsx. */
const GREETING_TIMEOUT_MS = 4500;

const FIRST_GREETING = "С Новым годом! Ёлка наряжена, дедлайны перенесены.";
const SECOND_GREETING = "Пусть сессия сдастся сама, без пересдач.";

let container: HTMLDivElement;
let root: Root;

const render = (props: Parameters<typeof Tree>[0] = {}) => {
    act(() => {
        root.render(<Tree {...props} />);
    });
};

const treeButton = (): HTMLButtonElement => {
    const button = container.querySelector<HTMLButtonElement>(".holiday-decor__tree");
    if (!button) throw new Error("ёлка не отрендерилась");

    return button;
};

const greeting = (): string | null =>
    container.querySelector(".holiday-decor__tree-greeting")?.textContent ?? null;

const particles = (): number => container.querySelectorAll(".holiday-decor__tree-particle").length;

const clickTree = () => {
    act(() => treeButton().click());
};

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.useFakeTimers();
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
});

describe("Tree: базовый вид", () => {
    it("renders an accessible button and no greeting", () => {
        render();

        expect(treeButton().getAttribute("aria-label")).toBe("Новогодняя ёлочка");
        expect(greeting()).toBeNull();
        // Волны нет до клика — иначе снег выбрасывало бы на каждой загрузке.
        expect(particles()).toBe(0);
    });

    it("does not render anything while the cookie banner is open", () => {
        render({ hidden: true });

        expect(container.querySelector(".holiday-decor__tree-slot")).toBeNull();
    });
});

describe("Tree: клик", () => {
    it("shows the first greeting and a snow burst", () => {
        render();
        clickTree();

        expect(greeting()).toBe(FIRST_GREETING);
        expect(particles()).toBe(10);
        expect(container.querySelector(".holiday-decor__tree-greeting")?.getAttribute("role")).toBe(
            "status",
        );
    });

    it("cycles greetings on repeated clicks", () => {
        render();
        clickTree();
        clickTree();

        expect(greeting()).toBe(SECOND_GREETING);
    });

    it("hides the greeting after the timeout", () => {
        render();
        clickTree();
        act(() => vi.advanceTimersByTime(GREETING_TIMEOUT_MS));

        expect(greeting()).toBeNull();
    });

    it("keeps cycling after the greeting has faded", () => {
        render();
        clickTree();
        act(() => vi.advanceTimersByTime(GREETING_TIMEOUT_MS));
        clickTree();

        // Курсор живёт в ref: следующая фраза, а не снова первая.
        expect(greeting()).toBe(SECOND_GREETING);
    });
});

describe("Tree: reduced motion", () => {
    it("skips the burst and the animations", () => {
        render({ staticMode: true });
        clickTree();

        expect(greeting()).toBe(FIRST_GREETING);
        expect(particles()).toBe(0);
        expect(
            container.querySelector(".holiday-decor__tree-slot")?.className.includes("--static"),
        ).toBe(true);
    });
});
