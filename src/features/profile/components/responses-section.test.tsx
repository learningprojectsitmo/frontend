// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResponsesSection } from "@/features/profile/components/responses-section";
import type { ResponseItem } from "@/types/profile";

// Регрессия на исходную жалобу: принятый, но неподтверждённый отклик оставался
// `accepted` навсегда, и кнопка «Подтвердить участие» упиралась в 400 «вы уже
// участвуете в другом проекте этого пространства». Теперь бэкенд на чтении
// отдаёт `in_team` + busyInOtherProject, и кнопки у такой строки быть не должно.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const useResponsesMock = vi.fn();

vi.mock("@/features/profile/api/use-profile-data", () => ({
    useResponses: () => useResponsesMock(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const makeResponse = (overrides: Partial<ResponseItem> = {}): ResponseItem => ({
    id: 1,
    projectId: 3,
    projectName: "Платформа",
    description: "Описание",
    role: "Backend",
    resumeUrl: "/app/resume?id=11",
    resumeTitle: "Резюме",
    date: "2026-01-15",
    status: "in_team",
    busyInOtherProject: false,
    ...overrides,
});

let container: HTMLDivElement;
let root: Root;

function renderSection() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() => {
        root.render(
            <QueryClientProvider client={client}>
                <MemoryRouter>
                    <ResponsesSection />
                </MemoryRouter>
            </QueryClientProvider>,
        );
    });
}

function buttonByText(text: string): HTMLButtonElement | undefined {
    return Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.trim().includes(text),
    );
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

describe("ResponsesSection: занятость в другом проекте", () => {
    it("не показывает подтверждение для отклика in_team", () => {
        // given
        useResponsesMock.mockReturnValue({
            isLoading: false,
            data: [makeResponse({ status: "in_team", busyInOtherProject: true })],
        });

        // when
        renderSection();

        // then
        expect(container.textContent).toContain("Уже в другой команде");
        expect(buttonByText("Подтвердить участие")).toBeUndefined();
    });

    it("не показывает подтверждение даже для accepted с busyInOtherProject", () => {
        // given: страховка от рассинхронизации с бэкендом
        useResponsesMock.mockReturnValue({
            isLoading: false,
            data: [makeResponse({ status: "accepted", busyInOtherProject: true })],
        });

        // when
        renderSection();

        // then
        expect(buttonByText("Подтвердить участие")).toBeUndefined();
    });

    it("оставляет подтверждение для обычного принятого отклика", () => {
        // given
        useResponsesMock.mockReturnValue({
            isLoading: false,
            data: [makeResponse({ status: "accepted", busyInOtherProject: false })],
        });

        // when
        renderSection();

        // then
        expect(buttonByText("Подтвердить участие")).toBeDefined();
        expect(container.textContent).toContain("Принят");
    });
});
