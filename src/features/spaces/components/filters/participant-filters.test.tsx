// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    ParticipantFilters,
    emptyParticipantFilters,
    type ParticipantFiltersState,
} from "@/features/spaces/components/filters/participant-filters";

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

const projectOptions = [
    { value: "1", label: "Новый проект" },
    { value: "2", label: "Второй проект" },
];
const roleOptions = [
    { value: "55", label: "Администратор" },
    { value: "57", label: "Участник" },
];

function render(
    state: ParticipantFiltersState = emptyParticipantFilters,
    onChange = vi.fn(),
    onReset = vi.fn(),
) {
    act(() => {
        root.render(
            <ParticipantFilters
                state={state}
                onChange={onChange}
                onReset={onReset}
                projectOptions={projectOptions}
                roleOptions={roleOptions}
            />,
        );
    });
}

function trigger(): HTMLButtonElement {
    const el = container.querySelector<HTMLButtonElement>("button");
    if (!el) throw new Error("триггер фильтра не найден");
    return el;
}

function click(el: Element) {
    act(() => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
}

function buttonByText(text: string): HTMLButtonElement {
    const el = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
    if (!el) throw new Error(`кнопка «${text}» не найдена`);
    return el;
}

function hasSection(name: string): boolean {
    return [...container.querySelectorAll("button")].some((b) => b.textContent?.includes(name));
}

/**
 * Секции FilterSection свёрнуты по умолчанию, поэтому чтобы увидеть наполнение,
 * секцию надо раскрыть — иначе тест проверял бы пустоту.
 */
function openSection(name: string) {
    click(buttonByText(name));
}

function checkboxes(): HTMLInputElement[] {
    return [...container.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];
}

function dateInputs(): HTMLInputElement[] {
    return [...container.querySelectorAll<HTMLInputElement>('input[type="date"]')];
}

/**
 * React держит собственный value-трекер, поэтому прямой `input.value = ...` он
 * игнорирует. Ставим значение через нативный сеттер прототипа и шлём `input`
 * (его React и слушает вместо `change`).
 */
function setNativeValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (!setter) throw new Error("value setter не найден");
    act(() => {
        setter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
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

describe("ParticipantFilters: единый фильтр", () => {
    it("рисует ровно одну кнопку, а не по кнопке на каждый фильтр", () => {
        // given
        // when
        render();
        // then
        // кнопка-триггер одна, и её текст — обобщённое «Фильтры»
        expect(trigger().textContent).toContain("Фильтры");
    });

    it("открывает панель по клику на триггер", () => {
        // given
        render();
        // when
        click(trigger());
        // then
        expect(buttonByText("Проект")).toBeDefined();
        expect(buttonByText("Роль")).toBeDefined();
        expect(buttonByText("Добавлен")).toBeDefined();
    });

    it("закрывает панель повторным кликом по триггеру", () => {
        // given
        render();
        click(trigger());
        // when
        click(trigger());
        // then
        expect(hasSection("Проект")).toBe(false);
    });

    it("закрывает панель по Escape", () => {
        // given
        render();
        click(trigger());
        // when
        act(() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });
        // then
        expect(hasSection("Проект")).toBe(false);
    });

    it("считает активные фильтры и показывает их на триггере", () => {
        // given
        // when
        render({ projects: ["1"], roles: ["55"], dateFrom: "2026-01-01", dateTo: "" });
        // then
        expect(trigger().textContent).toContain("3");
    });

    it("не показывает счётчик, когда фильтры не заданы", () => {
        // given
        // when
        render();
        // then
        expect(trigger().textContent).not.toContain("0");
    });
});

describe("ParticipantFilters: секции", () => {
    it("скрывает секцию проектов, если проектов нет", () => {
        // given
        // when
        act(() => {
            root.render(
                <ParticipantFilters
                    state={emptyParticipantFilters}
                    onChange={vi.fn()}
                    onReset={vi.fn()}
                    projectOptions={[]}
                    roleOptions={roleOptions}
                />,
            );
        });
        click(trigger());
        // then
        expect(
            [...container.querySelectorAll("button")].some((b) =>
                b.textContent?.includes("Проект"),
            ),
        ).toBe(false);
    });

    it("фильтрует по проектам", () => {
        // given
        const onChange = vi.fn();
        render(emptyParticipantFilters, onChange);
        click(trigger());
        openSection("Проект");
        // when
        click(checkboxes()[0]);
        // then
        expect(onChange).toHaveBeenCalledWith({ ...emptyParticipantFilters, projects: ["1"] });
    });

    it("фильтрует по ролям", () => {
        // given
        const onChange = vi.fn();
        render(emptyParticipantFilters, onChange);
        click(trigger());
        openSection("Роль");
        // when
        click(checkboxes()[1]);
        // then
        expect(onChange).toHaveBeenCalledWith({ ...emptyParticipantFilters, roles: ["57"] });
    });

    it("фильтрует по датам", () => {
        // given
        const onChange = vi.fn();
        render(emptyParticipantFilters, onChange);
        click(trigger());
        openSection("Добавлен");
        // when
        setNativeValue(dateInputs()[0], "2026-02-01");
        // then
        expect(onChange).toHaveBeenCalledWith({
            ...emptyParticipantFilters,
            dateFrom: "2026-02-01",
        });
    });

    it("не даёт выбрать «по» раньше «с»", () => {
        // given
        render({ ...emptyParticipantFilters, dateFrom: "2026-02-01" });
        click(trigger());
        openSection("Добавлен");
        // then
        expect(dateInputs()[0].value).toBe("2026-02-01");
        expect(dateInputs()[1].min).toBe("2026-02-01");
    });

    it("отдаёт весь сброс одним действием", () => {
        // given
        const onReset = vi.fn();
        render(
            { projects: ["1"], roles: ["55"], dateFrom: "2026-01-01", dateTo: "" },
            vi.fn(),
            onReset,
        );
        click(trigger());
        // when
        click(buttonByText("Сбросить"));
        // then
        expect(onReset).toHaveBeenCalled();
    });
});
