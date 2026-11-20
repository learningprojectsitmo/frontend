// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

import { examApi } from "@/lib/exams";
import { getProject, getProjectsList } from "@/lib/projects";
import type { Exam, ExamQueue } from "@/types/exam";
import type { ProjectFullResponse } from "@/types/api";
import { ExamRegistrationAssign } from "./exam-registration-assign";

vi.mock("@/lib/projects", () => ({ getProject: vi.fn(), getProjectsList: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

it("offers only projects with no active registration on a published exam", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const exam = { id: 1, workspace_id: 2, status: "published", configuration: { project_type_ids: [7] } } as Exam;
    const list = vi.spyOn(examApi, "list").mockResolvedValue({
        items: [exam, { ...exam, id: 3 }], has_more: false, limit: 100, offset: 0,
    });
    const queue = vi.spyOn(examApi, "queue").mockResolvedValue({
        items: [{ project_id: 9, state: "finished" }],
    } as ExamQueue);
    vi.spyOn(examApi, "slots").mockResolvedValue({ items: [], has_more: false });
    const projects = [{ id: 9, name: "Команда уже защитилась" }, { id: 10, name: "Свободная команда" }];
    vi.mocked(getProjectsList).mockResolvedValue({
        items: projects, total_pages: 1,
    } as Awaited<ReturnType<typeof getProjectsList>>);
    vi.mocked(getProject).mockImplementation(async (id) => ({
        ...projects.find((project) => String(project.id) === id),
        workspace_id: 2,
        project_type_id: 7,
    } as ProjectFullResponse));

    const container = document.body.appendChild(document.createElement("div"));
    const root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
        await act(async () => {
            root.render(
                <QueryClientProvider client={client}>
                    <ExamRegistrationAssign exam={exam} assignedIds={new Set()} onQueue={vi.fn()} onClose={vi.fn()} />
                </QueryClientProvider>,
            );
        });
        let trigger: HTMLButtonElement | undefined;
        for (let index = 0; index < 4 && !trigger; index++) {
            await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
            trigger = [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "Выберите команду");
        }
        expect(list).toHaveBeenCalledWith(2, "published");
        expect(queue).toHaveBeenCalledWith(2, 3);
        expect(trigger).toBeDefined();
        await act(async () => trigger?.click());
        expect(document.body.textContent).toContain("Свободная команда");
        expect(document.body.textContent).not.toContain("Команда уже защитилась");
    } finally {
        act(() => root.unmount());
        client.clear();
        container.remove();
    }
});
