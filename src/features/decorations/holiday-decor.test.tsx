// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePublicAppSettings } from "@/lib/app-settings";
import { useUser } from "@/lib/auth";

import { HolidayDecor } from "./holiday-decor";

// Снег — canvas, гирлянда и шары — разметка: проверяем только состав декора,
// поэтому тяжёлые компоненты заменяются маркерами.
vi.mock("./snow", () => ({ Snow: () => <span data-testid="snow" /> }));
vi.mock("./garland", () => ({ Garland: () => <span data-testid="garland" /> }));
vi.mock("./ornaments", () => ({ Ornaments: () => <span data-testid="ornaments" /> }));
vi.mock("./tree", () => ({ Tree: () => <span data-testid="tree" /> }));
vi.mock("./use-prefers-reduced-motion", () => ({ usePrefersReducedMotion: () => false }));
vi.mock("@/lib/app-settings", () => ({ usePublicAppSettings: vi.fn() }));
vi.mock("@/lib/auth", () => ({ useUser: vi.fn() }));
vi.mock("@/features/privacy/cookie-consent-provider", () => ({
    useCookieConsent: () => ({ consent: "accepted" }),
}));

const mockedPublicSettings = vi.mocked(usePublicAppSettings);
const mockedUser = vi.mocked(useUser);

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

const settings = (flags: Record<string, boolean>) =>
    mockedPublicSettings.mockReturnValue({ data: flags } as never);

const present = (testId: string) => Boolean(container.querySelector(`[data-testid=${testId}]`));

const render = async () => {
    await act(async () => {
        root.render(<HolidayDecor />);
    });
};

describe("HolidayDecor", () => {
    beforeEach(() => {
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
        mockedUser.mockReturnValue({ data: undefined } as never);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.clearAllMocks();
    });

    it("рисует и снег, и ёлку, когда включены оба флага", async () => {
        settings({ new_year_decorations_enabled: true, new_year_tree_enabled: true });

        await render();

        expect(present("snow")).toBe(true);
        expect(present("tree")).toBe(true);
    });

    it("показывает ёлку отдельно от остальных украшений", async () => {
        settings({ new_year_decorations_enabled: false, new_year_tree_enabled: true });

        await render();

        expect(present("tree")).toBe(true);
        expect(present("snow")).toBe(false);
        expect(present("garland")).toBe(false);
    });

    it("не рисует ёлку, когда включены только обычные украшения", async () => {
        settings({ new_year_decorations_enabled: true, new_year_tree_enabled: false });

        await render();

        expect(present("snow")).toBe(true);
        expect(present("tree")).toBe(false);
    });

    it("ничего не рисует, пока администратор не включил флаги", async () => {
        settings({ new_year_decorations_enabled: false, new_year_tree_enabled: false });

        await render();

        expect(container.childElementCount).toBe(0);
    });

    it("уважает личный отказ пользователя от декора", async () => {
        settings({ new_year_decorations_enabled: false, new_year_tree_enabled: true });
        mockedUser.mockReturnValue({ data: { show_decorations: false } } as never);

        await render();

        expect(container.childElementCount).toBe(0);
    });
});
