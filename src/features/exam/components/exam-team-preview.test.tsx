// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { expect, it } from "vitest";

import { ExamTeamPreview } from "./exam-team-preview";

it.each(["click", "hover"])(
    "shows the team count and link on %s with three avatars",
    async (open) => {
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.body.appendChild(document.createElement("div"));
        const root = createRoot(container);
        const project = {
            id: 42,
            participants_count: 5,
            participants_preview: ["Анна Иванова", "Борис Петров", "Вера Сидорова"].map(
                (full_name, id) => ({
                    id,
                    full_name,
                    avatar_url: null,
                }),
            ),
        };
        try {
            await act(async () => {
                root.render(
                    <MemoryRouter>
                        <ExamTeamPreview project={project} />
                    </MemoryRouter>,
                );
            });
            const trigger = container.querySelector<HTMLButtonElement>(
                'button[aria-label="Участники команды"]',
            );
            expect(trigger?.textContent).toBe("АИБПВС");
            await act(async () => {
                if (open === "click") {
                    trigger?.click();
                    return;
                }
                trigger?.dispatchEvent(
                    new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
                );
                trigger?.dispatchEvent(new MouseEvent("mouseenter"));
                trigger?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
                await new Promise((resolve) => setTimeout(resolve, 120));
            });
            const popup = document.querySelector('[role="dialog"]');
            expect(popup?.textContent).toContain("Всего участников — 5");
            expect(popup?.textContent).toContain("Вера Сидорова");
            const link = popup?.querySelector("a");
            expect(link?.textContent).toBe("Показать всех");
            expect(link?.getAttribute("href")).toBe("/app/project?id=42");
        } finally {
            act(() => root.unmount());
            container.remove();
        }
    },
);
