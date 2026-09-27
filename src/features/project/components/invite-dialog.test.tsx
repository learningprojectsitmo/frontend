// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InviteDialog } from "@/features/project/components/invite-dialog";
import type { WorkspaceInviteCandidateItem } from "@/types/api";

// Компонентный тест на DOM-поведение без @testing-library — как в
// tableMembers.test.tsx. Проверяет регрессию, ради которой диалог и переписан:
// список приглашения брался из ленты резюме, отсекавшей скрытые резюме, и
// участники без резюме в него не попадали вовсе.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const inviteMutate = vi.fn();
const candidatesMock = vi.fn();

vi.mock("@/lib/spaces", () => ({
    useWorkspaceInviteCandidates: () => candidatesMock(),
}));

vi.mock("@/lib/projects", () => ({
    useAcceptResponse: () => ({ mutate: vi.fn(), isPending: false }),
    useInviteToProject: () => ({ mutate: inviteMutate, isPending: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const makeCandidate = (
    overrides: Partial<WorkspaceInviteCandidateItem> = {},
): WorkspaceInviteCandidateItem => ({
    user_id: 7,
    name: "Петров Пётр",
    contacts: { telegram: null, email: "petrov@example.com", linkedin: null },
    resume_id: 11,
    resume_url: "/app/resume?id=11",
    resume_header: "Backend-разработчик",
    skills: ["Python"],
    interests: [],
    in_project: false,
    busy: false,
    pending: false,
    can_invite: true,
    reason: "",
    ...overrides,
});

let container: HTMLDivElement;
let root: Root;

function renderDialog() {
    act(() => {
        root.render(
            <InviteDialog
                open
                onOpenChange={() => {}}
                projectId={5}
                workspaceId={1}
                vacancies={[]}
                replycants={[]}
            />,
        );
    });
}

/**
 * Radix рендерит диалог порталом в document.body, поэтому искать надо там,
 * а не в корне рендера.
 */
const nodes = (): HTMLElement[] => Array.from(document.body.querySelectorAll("button"));

/** Явно открывает вкладку участников — список кандидатов живёт в ней. */
function openCandidatesTab() {
    const tab = nodes().find((b) => b.textContent?.includes("Из участников"));
    act(() => {
        tab?.click();
    });
}

function buttonByText(text: string): HTMLButtonElement | undefined {
    return nodes().find((b) => b.textContent?.trim().includes(text));
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    inviteMutate.mockReset();
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
});

describe("InviteDialog: кандидаты из состава пространства", () => {
    it("показывает участника без резюме — приглашению резюме не требуется", () => {
        // given
        candidatesMock.mockReturnValue({
            isLoading: false,
            data: { items: [makeCandidate({ user_id: 7, resume_id: null, resume_header: "" })] },
        });

        // when
        renderDialog();
        openCandidatesTab();

        // then
        expect(document.body.textContent).toContain("Петров Пётр");
        expect(document.body.textContent).toContain("Без резюме");
    });

    it("показывает причину и гасит кнопку для занятого в другом проекте", () => {
        // given
        candidatesMock.mockReturnValue({
            isLoading: false,
            data: {
                items: [
                    makeCandidate({
                        busy: true,
                        can_invite: false,
                        reason: "busy",
                    }),
                ],
            },
        });

        // when
        renderDialog();
        openCandidatesTab();

        // then
        expect(document.body.textContent).toContain("Уже в другой команде этого пространства");
        const inviteButton = buttonByText("Пригласить");
        expect(inviteButton?.disabled).toBe(true);
    });

    it("отправляет приглашение с null-резюме, если у участника его нет", () => {
        // given
        candidatesMock.mockReturnValue({
            isLoading: false,
            data: { items: [makeCandidate({ user_id: 7, resume_id: null })] },
        });

        // when
        renderDialog();
        openCandidatesTab();
        act(() => {
            buttonByText("Пригласить")?.click();
        });

        // then
        expect(inviteMutate).toHaveBeenCalledWith(
            { projectId: 5, userId: 7, vacancyId: null, resumeId: null },
            expect.anything(),
        );
    });

    it("не путает загрузку с пустым списком", () => {
        // given
        candidatesMock.mockReturnValue({ isLoading: true, data: undefined });

        // when
        renderDialog();
        openCandidatesTab();

        // then
        expect(document.body.textContent).toContain("Загрузка участников");
    });
});
