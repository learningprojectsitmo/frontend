// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InvitationsSection } from "@/features/profile/components/invitations-section";
import type { InvitationItem } from "@/types/profile";

// Регрессия: в профиле кнопка «Вступить в команду» в диалоге не отправляла
// запрос. `onConfirm` вызывал `handleAction`, который повторно проверял то же
// ограничение пространства, которым диалог был открыт, и открывал его заново —
// PATCH уходил бесконечно по кругу «открыть → подтвердить → открыть».
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const useInvitationsMock = vi.fn();
const patchMock = vi.fn();

vi.mock("@/features/profile/api/use-profile-data", () => ({
    useInvitations: () => useInvitationsMock(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/lib/api-client", () => ({
    api: { patch: (...args: unknown[]) => patchMock(...args) },
}));

const makeInvitation = (overrides: Partial<InvitationItem> = {}): InvitationItem => ({
    id: 3,
    projectId: 1,
    projectName: "Новый проект1",
    description: "Описание",
    role: "Backend-разработчик",
    resumeUrl: "/app/resume?id=1",
    resumeTitle: "Резюме",
    date: "2026-01-15",
    inviterName: "Мария Сидорова",
    status: "pending",
    busyInOtherProject: false,
    allowMultiProjectParticipation: false,
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
                    <InvitationsSection />
                </MemoryRouter>
            </QueryClientProvider>,
        );
    });
}

// Radix рендерит диалог в портале, поэтому ищем по всему document, а не по
// контейнеру рендера.
function buttonByLabel(label: string): HTMLButtonElement {
    const match = Array.from(document.body.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === label,
    );
    if (!match) throw new Error(`Кнопка «${label}» не найдена`);
    return match;
}

async function click(el: HTMLElement) {
    await act(async () => {
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    patchMock.mockReset().mockResolvedValue({ data: {} });
    useInvitationsMock.mockReturnValue({
        data: [makeInvitation()],
        isLoading: false,
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.innerHTML = "";
});

describe("InvitationsSection: принятие приглашения", () => {
    it("отправляет запрос из карточки, когда пространство разрешает несколько проектов", async () => {
        // given
        useInvitationsMock.mockReturnValue({
            data: [makeInvitation({ allowMultiProjectParticipation: true })],
            isLoading: false,
        });
        renderSection();

        // when — диалог не нужен, запрос уходит сразу
        await click(buttonByLabel("Принять"));

        // then
        expect(patchMock).toHaveBeenCalledWith("/invitations/3/accept");
    });

    it("отправляет запрос после подтверждения в диалоге, когда проекты запрещены", async () => {
        // given
        renderSection();

        // when
        await click(buttonByLabel("Принять"));
        expect(document.body.textContent).toContain("Вступление в команду");

        await click(buttonByLabel("Вступить в команду"));

        // then — запрос ушёл, а не диалог просто переоткрылся
        expect(patchMock).toHaveBeenCalledWith("/invitations/3/accept");
        expect(patchMock).toHaveBeenCalledTimes(1);
    });

    it("не открывает диалог повторно и закрывает его после успешного ответа", async () => {
        // given
        renderSection();

        // when
        await click(buttonByLabel("Принять"));
        await click(buttonByLabel("Вступить в команду"));

        // then
        expect(document.body.textContent).not.toContain("Вступление в команду");
    });

    it("оставляет диалог открытым, если запрос не удался", async () => {
        // given
        patchMock.mockRejectedValue(new Error("network"));
        renderSection();

        // when
        await click(buttonByLabel("Принять"));
        await click(buttonByLabel("Вступить в команду"));

        // then — диалог не схлопывается, можно повторить
        expect(document.body.textContent).toContain("Вступление в команду");
    });

    it("не показывает кнопки, если человек уже в другом проекте пространства", () => {
        // given
        useInvitationsMock.mockReturnValue({
            data: [makeInvitation({ status: "in_team", busyInOtherProject: true })],
            isLoading: false,
        });

        // when
        renderSection();

        // then
        expect(document.body.textContent).toContain("Уже в другой команде");
        expect(
            Array.from(document.body.querySelectorAll("button")).map((b) => b.textContent),
        ).not.toContain("Принять");
    });
});
