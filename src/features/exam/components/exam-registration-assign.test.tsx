// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

import { examApi } from "@/lib/exams";
import { getProject, getProjectsList } from "@/lib/projects";
import type { Exam } from "@/types/exam";
import type { ProjectFullResponse } from "@/types/api";
import { ExamRegistrationAssign } from "./exam-registration-assign";

vi.mock("@/lib/projects", () => ({ getProject: vi.fn(), getProjectsList: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

it("offers unblocked projects and checks again after a conflicting assignment", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const exam = {
        id: 1,
        workspace_id: 2,
        status: "published",
        configuration: { project_type_ids: [7] },
    } as Exam;
    const blocked = vi
        .spyOn(examApi, "blockedProjects")
        .mockResolvedValueOnce([9])
        .mockResolvedValue([9, 10]);
    const register = vi.spyOn(examApi, "register").mockRejectedValue({
        isAxiosError: true,
        response: { status: 409, data: { detail: { code: "project_already_registered" } } },
    });
    const list = vi.spyOn(examApi, "list").mockResolvedValue({
        items: [exam, { ...exam, id: 3 }],
        has_more: false,
        limit: 100,
        offset: 0,
    });
    vi.spyOn(examApi, "slots").mockResolvedValue({ items: [], has_more: false });
    const projects = [
        { id: 9, name: "Команда уже защитилась" },
        { id: 10, name: "Свободная команда" },
    ];
    vi.mocked(getProjectsList).mockResolvedValue({
        items: projects,
        total_pages: 1,
    } as Awaited<ReturnType<typeof getProjectsList>>);
    vi.mocked(getProject).mockImplementation(
        async (id) =>
            ({
                ...projects.find((project) => String(project.id) === id),
                workspace_id: 2,
                project_type_id: 7,
            }) as ProjectFullResponse,
    );

    const container = document.body.appendChild(document.createElement("div"));
    const root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    try {
        await act(async () => {
            root.render(
                <QueryClientProvider client={client}>
                    <ExamRegistrationAssign exam={exam} onQueue={vi.fn()} onClose={vi.fn()} />
                </QueryClientProvider>,
            );
        });
        let trigger: HTMLButtonElement | undefined;
        for (let index = 0; index < 4 && !trigger; index++) {
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0));
            });
            trigger = [...document.querySelectorAll("button")].find(
                (button) => button.textContent?.trim() === "Выберите команду",
            );
        }
        expect(blocked).toHaveBeenCalledWith(2, 1, false);
        expect(list).not.toHaveBeenCalled();
        expect(trigger).toBeDefined();
        await act(async () => trigger?.click());
        expect(document.body.textContent).toContain("Свободная команда");
        expect(document.body.textContent).not.toContain("Команда уже защитилась");
        const button = (label: string) =>
            Array.from(document.querySelectorAll("button")).find(
                (element) => element.textContent?.trim() === label,
            );
        await act(async () => button("Свободная команда")?.click());
        await act(async () => button("Назначить")?.click());
        for (let index = 0; index < 5 && button("Назначить"); index++) {
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0));
            });
        }
        expect(register).toHaveBeenCalledWith(2, 1, { project_id: 10, slot_id: null });
        expect(blocked).toHaveBeenCalledTimes(2);
        expect(button("Назначить")).toBeUndefined();
        expect(document.body.textContent).toContain(
            "Все подходящие команды уже записаны на экзамен.",
        );
    } finally {
        act(() => root.unmount());
        client.clear();
        container.remove();
    }
});
