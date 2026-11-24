// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { api } from "@/lib/api-client";
import { examApi } from "@/lib/exams";
import type { Exam } from "@/types/exam";
import { ExamManagementList } from "./exam-management-list";

vi.mock("@/lib/auth", () => ({ useUser: () => ({ data: { id: 7 } }) }));

const draft: Exam = {
    id: 11,
    workspace_id: 4,
    status: "draft",
    current_settings_version: 1,
    configuration: {
        title: "Черновик 11",
        description: null,
        starts_at: "2026-11-27T11:00:00Z",
        connection_url: null,
        project_type_ids: [9],
        registration_opens_at: null,
        registration_closes_at: null,
        weights: { teacher: 60, manager: 30, member: 10 },
        max_score: 25,
        presentation_minutes: 7,
        questions_minutes: 7,
        transition_minutes: 1,
        assessment_window_minutes: 3,
    },
    created_by: 7,
    created_at: "2026-11-24T10:00:00Z",
    published_by: null,
    published_at: null,
};
const published: Exam = {
    ...draft,
    id: 12,
    status: "published",
    configuration: { ...draft.configuration, title: "Опубликованный экзамен 12" },
    published_by: 7,
    published_at: "2026-11-24T10:00:00Z",
};
const title = (exam: Exam) => exam.configuration.title;
let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
let exams: Exam[];

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    root = createRoot((container = document.body.appendChild(document.createElement("div"))));
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    exams = [draft, published];
    vi.spyOn(examApi, "list").mockImplementation(async (_workspace, status) => ({
        items: exams.filter((exam) => (status === "archived") === Boolean(exam.archived_at)),
        limit: 100,
        offset: 0,
        has_more: false,
    }));
    // The server's DELETE response is empty for both lifecycle changes.
    vi.spyOn(api, "delete").mockImplementation(async (path: string) => {
        if (path === "/workspaces/4/exams/11") {
            exams = exams.filter((exam) => exam.id !== 11);
        } else if (path === "/workspaces/4/exams/12") {
            exams = [draft, { ...published, archived_at: "2026-11-24T11:00:00Z" }];
        } else {
            throw new Error(`Unexpected endpoint ${path}`);
        }
    });
});

afterEach(() => {
    act(() => root.unmount());
    client.clear();
    container.remove();
    vi.restoreAllMocks();
});

async function render(removableWorkspaceIds: number[]) {
    await act(async () => {
        root.render(
            <QueryClientProvider client={client}>
                <MemoryRouter>
                    <ExamManagementList
                        workspaceId={4}
                        removableWorkspaceIds={removableWorkspaceIds}
                    />
                </MemoryRouter>
            </QueryClientProvider>,
        );
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

async function openActions(exam: Exam) {
    const card = [...container.querySelectorAll("article")].find((article) =>
        article.textContent?.includes(title(exam)),
    );
    const button = card?.querySelector("button[aria-label='Действия с экзаменом']");
    expect(button).toBeDefined();
    await act(async () =>
        button?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
}

async function selectMenuItem(label: string) {
    const item = [...document.querySelectorAll<HTMLElement>("[role='menuitem']")].find(
        (candidate) => candidate.textContent?.trim() === label,
    );
    expect(item, label).toBeDefined();
    await act(async () => item?.click());
}

async function clickDialogButton(label: string) {
    const button = [...document.querySelectorAll<HTMLButtonElement>("[role='dialog'] button")].find(
        (candidate) => candidate.textContent?.trim() === label,
    );
    expect(button, label).toBeDefined();
    await act(async () => button?.click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
}

it("keeps the draft until the admin confirms and then removes it from the list", async () => {
    await render([4]);
    expect(container.textContent).toContain(title(draft));
    await openActions(draft);
    await selectMenuItem("Удалить или архивировать");
    expect(document.querySelector("[role='dialog']")?.textContent).toContain(
        "без слотов и записей",
    );
    await clickDialogButton("Отмена");
    expect(api.delete).not.toHaveBeenCalled();

    await openActions(draft);
    await selectMenuItem("Удалить или архивировать");
    await clickDialogButton("Подтвердить");
    expect(api.delete).toHaveBeenCalledWith("/workspaces/4/exams/11");
    expect(container.textContent).not.toContain(title(draft));
    expect(container.textContent).toContain(title(published));
});

it("moves the published exam from the current list to the archive filter", async () => {
    await render([4]);
    await openActions(published);
    await selectMenuItem("Архивировать экзамен");
    expect(document.querySelector("[role='dialog']")?.textContent).toContain("История");
    await clickDialogButton("Архивировать");
    expect(container.textContent).not.toContain(title(published));

    const filter = container.querySelector<HTMLSelectElement>(
        'select[aria-label="Статус экзамена"]',
    )!;
    await act(async () => {
        filter.value = "archived";
        filter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(container.textContent).toContain(title(published));
    expect(container.textContent).not.toContain(title(draft));
    const examLink = [...container.querySelectorAll("a")].find(
        (link) => link.textContent === title(published),
    );
    expect(examLink).toBeDefined();
    expect(examLink?.getAttribute("href")).toBe("/app/exams/view?workspaceId=4&examId=12");
});

it("hides the removal action when the teacher has no administrative rights", async () => {
    await render([]);
    expect(container.textContent).toContain(title(draft));
    expect(container.querySelector('button[aria-label="Действия с экзаменом"]')).toBeNull();
});
