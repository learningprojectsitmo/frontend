// @vitest-environment jsdom
import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Attempt, QueueItem } from "@/types/exam";
import { ExamPresentation } from "./exam-presentation";

vi.mock("@/lib/projects", () => ({ useProject: () => ({}) }));

const attempt = { id: 1, version: 1, status: "speaking", paused_at: null } as Attempt;
const timer = { remaining: 45, total: 60, stage: { label: "Защита" } };
const idleTimer = { remaining: 60, total: 60, stage: null };
const team = { project_id: 1 } as QueueItem;

let container: HTMLDivElement;
let root: Root;

function Location() {
    return <output>{useLocation().pathname}</output>;
}

async function render(overrides: Partial<ComponentProps<typeof ExamPresentation>> = {}) {
    await act(async () => {
        root.render(
            <MemoryRouter>
                <ExamPresentation canManage pending={false} canGoForward={false} canStart={false} inTransition={false}
                    timer={timer} attempt={attempt} onToggle={vi.fn()} onQuestions={vi.fn()} onPrevious={vi.fn()}
                    onNext={vi.fn()} timerSettingsHref="/settings" {...overrides} />
                <Location />
            </MemoryRouter>,
        );
    });
}

async function click(text: string) {
    const element = [...document.querySelectorAll<HTMLElement>("button, a")].find((item) =>
        item.textContent?.trim() === text || item.getAttribute("aria-label") === text);
    expect(element, text).toBeDefined();
    await act(async () => element?.click());
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.body.appendChild(document.createElement("div"));
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

describe("exam presentation controls", () => {
    it("shows the last defense action in the current presentation card", async () => {
        await render({ team, finishLastDefenseAction: <button type="button">Завершить выступление последней команды</button> });
        const card = [...container.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === "Текущее выступление");
        expect(card?.textContent).toContain("Завершить выступление последней команды");
        expect(card?.textContent).not.toContain("Следующая команда");
    });

    it("disables Play for the first team until the exam is prepared", async () => {
        const onToggle = vi.fn();
        await render({ attempt: undefined, timer: idleTimer, team, onToggle });
        expect(container.querySelector<HTMLButtonElement>('[aria-label="Начать выступление"]')?.disabled).toBe(true);
        await click("Начать выступление");
        expect(onToggle).not.toHaveBeenCalled();
    });

    it("keeps the timer waiting for Play when the next team is ready", async () => {
        const onToggle = vi.fn();
        await render({ attempt: undefined, timer: idleTimer, team, canStart: true, onToggle });
        expect(container.textContent).toContain("К выступлению готовится");
        expect(container.textContent).toContain("Ожидаем начала");
        expect(container.textContent).not.toContain("Приостановлен");
        expect(onToggle).not.toHaveBeenCalled();
        await click("Начать выступление");
        expect(onToggle).toHaveBeenCalledOnce();
    });

    it("lets the organizer start the next team immediately during the transition", async () => {
        const onToggle = vi.fn();
        await render({
            attempt: undefined,
            timer: { remaining: 30, total: 60, stage: { label: "Переход между командами" } },
            team,
            autoStarting: true,
            canStart: true,
            inTransition: true,
            onToggle,
        });
        expect(container.textContent).toContain("Переход между командами");
        await click("Начать выступление");
        expect(container.textContent).toContain("Выступление начнётся автоматически после перехода.");
        expect(onToggle).toHaveBeenCalledOnce();
    });

    it("confirms questions at zero and enters them immediately during overtime", async () => {
        const onQuestions = vi.fn();
        await render({ timer: { ...timer, remaining: 0 }, onQuestions });
        await click("Перейти к вопросам");
        expect(onQuestions).not.toHaveBeenCalled();
        expect(document.body.textContent).toContain("Перейти к вопросам?");
        await click("Начать вопросы");
        expect(onQuestions).toHaveBeenCalledOnce();

        await render({ timer: { ...timer, remaining: -1 }, onQuestions });
        await click("Перейти к вопросам");
        expect(onQuestions).toHaveBeenCalledTimes(2);
    });

    it("allows one click during overtime even if confirmation was already open", async () => {
        const onQuestions = vi.fn();
        await render({ onQuestions });
        await click("Перейти к вопросам");
        expect(onQuestions).not.toHaveBeenCalled();
        await render({ timer: { ...timer, remaining: -1 }, onQuestions });
        await click("Перейти к вопросам");
        expect(onQuestions).toHaveBeenCalledOnce();
    });

    it("opens the settings page only after confirmation", async () => {
        await render();
        await click("Настройки таймера");
        expect(container.querySelector("output")?.textContent).toBe("/");
        expect(document.body.textContent).toContain("Перейти на страницу настроек?");
        await click("Открыть настройки");
        expect(container.querySelector("output")?.textContent).toBe("/settings");
    });
});
