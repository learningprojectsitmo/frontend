// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ResponseCard, type ResponseCardAction } from "@/features/profile/components/response-card";

// jsdom не имеет движка раскладки, поэтому измерить переполнение нельзя.
// Тест фиксирует структурный контракт: строка заголовка обязана переноситься, а
// кнопки — не сжиматься. Именно это удерживало «Принять» за краем карточки на
// мобильной ширине, где в шапке одновременно бейдж статуса и две кнопки.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const actions: ResponseCardAction[] = [
    { label: "Отклонить", variant: "ghost", onClick: () => {} },
    { label: "Принять", variant: "primary", onClick: () => {} },
];

let container: HTMLDivElement;
let root: Root;

function renderCard(actionList = actions) {
    act(() => {
        root.render(
            <MemoryRouter>
                <ResponseCard
                    projectId={1}
                    projectName="Проект с очень длинным названием, которое не помещается в строку"
                    description=""
                    role="Backend-разработчик"
                    resumeUrl="/app/resume?id=1"
                    resumeTitle="Резюме"
                    date="2026-01-15"
                    dateLabel="Приглашение отправлено"
                    status={{ text: "Ожидает ответа", color: "#D97706", bg: "#FEF3C7" }}
                    actions={actionList}
                />
            </MemoryRouter>,
        );
    });
}

/** Верхний ряд карточки: заголовок слева, бейдж и кнопки справа. */
function headerRow(): HTMLElement {
    const title = container.querySelector("h3");
    return title?.parentElement?.parentElement as HTMLElement;
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
});

describe("ResponseCard: шапка с действиями", () => {
    it("переносит действия на следующую строку вместо выхода за край", () => {
        // given / when
        renderCard();

        // then
        expect(headerRow().className).toContain("flex-wrap");
    });

    it("даёт заголовку сжиматься и обрезаться, а не распирать строку", () => {
        // given / when
        renderCard();

        // then
        const title = container.querySelector("h3") as HTMLElement;
        expect(title.className).toContain("truncate");
        expect(title.className).toContain("min-w-0");
        expect(title.parentElement?.className).toContain("min-w-0");
    });

    it("не сжимает кнопки и не переносит подписи внутри них", () => {
        // given / when
        renderCard();

        // then
        const buttons = Array.from(container.querySelectorAll("button"));
        expect(buttons).toHaveLength(2);
        for (const button of buttons) {
            expect(button.className).toContain("shrink-0");
            expect(button.className).toContain("whitespace-nowrap");
        }
    });

    it("переносит кнопки между собой, если не помещаются в строку", () => {
        // given / when
        renderCard();

        // then
        const actionsRow = container.querySelector("h3")?.parentElement
            ?.nextElementSibling as HTMLElement;
        expect(actionsRow.className).toContain("flex-wrap");
        expect(actionsRow.className).toContain("shrink-0");
    });
});
