// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectNavButtons } from "@/features/project/components/project-nav-buttons";
import type { ProjectNeighborItemResponse } from "@/types/api";

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const neighbor = (
    overrides: Partial<ProjectNeighborItemResponse> = {},
): ProjectNeighborItemResponse => ({
    id: 27,
    name: "Предыдущий проект",
    status: { name: "draft", color: "#999999" },
    ...overrides,
});

let container: HTMLDivElement;
let root: Root;
const onNavigate = vi.fn();

function render(props: {
    prev?: ProjectNeighborItemResponse | null;
    next?: ProjectNeighborItemResponse | null;
}) {
    act(() => {
        root.render(
            <ProjectNavButtons prev={props.prev} next={props.next} onNavigate={onNavigate} />,
        );
    });
}

function buttonByLabel(label: string): HTMLButtonElement | undefined {
    const found = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    return found ?? undefined;
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    onNavigate.mockReset();
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe("ProjectNavButtons", () => {
    it("переходит к соседу по нажатию", () => {
        // given
        render({ prev: neighbor({ id: 27 }), next: neighbor({ id: 29, name: "Следующий" }) });

        // when
        act(() => {
            buttonByLabel("Следующий проект")?.click();
        });

        // then
        expect(onNavigate).toHaveBeenCalledWith(29);
    });

    it("гасит кнопку, если соседа нет", () => {
        // given — текущий проект первый в списке
        render({ prev: null, next: neighbor({ id: 29 }) });

        // then
        expect(buttonByLabel("Предыдущий проект")?.disabled).toBe(true);
        expect(buttonByLabel("Следующий проект")?.disabled).toBe(false);
    });

    it("не переходит при нажатии на погашенную кнопку", () => {
        // given
        render({ prev: null, next: null });

        // when
        act(() => {
            buttonByLabel("Предыдущий проект")?.click();
        });

        // then
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it("показывает название соседа в подсказке", () => {
        // given
        render({ prev: neighbor({ id: 27, name: "Frontend" }), next: null });

        // then
        expect(buttonByLabel("Предыдущий проект")?.getAttribute("title")).toBe(
            "Предыдущий проект: Frontend",
        );
        expect(buttonByLabel("Следующий проект")?.getAttribute("title")).toBe(
            "Нет более поздних проектов",
        );
    });
});
