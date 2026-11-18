// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { examApi, useExams } from "@/lib/exams";
import type { Exam, ExamSlot } from "@/types/exam";
import { ProjectExamBlocks } from "./project-exam-blocks";
import { formatExamCountdown } from "./project-exam-display";

vi.mock("@/lib/exams", () => ({
    examApi: { queue: vi.fn(async () => ({ items: [] })), register: vi.fn() },
    useExams: vi.fn(),
    useExamSlots: (_workspaceId: number, examId: number) => ({
        data: examId ? { items: [slot] } : undefined,
    }),
    getExamErrorMessage: vi.fn(),
    invalidateExam: vi.fn(),
}));
vi.mock("@/features/exam/use-exam-workspaces", () => ({
    useExamWorkspaces: () => ({
        spaces: [{ id: 1, title: "Управление проектами" }],
        canSelfRegister: true,
    }),
}));
vi.mock("@/lib/projects", () => ({
    useProjectTypes: () => ({ data: [{ id: 4, name: "Продуктовые команды" }] }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const now = new Date("2026-11-18T09:00:00Z");
const start = "2026-11-18T09:00:02Z";
const exam: Exam = {
    id: 2,
    workspace_id: 1,
    status: "published",
    created_by: 1,
    current_settings_version: 1,
    created_at: "2026-11-10T09:00:00Z",
    published_by: 1,
    published_at: "2026-11-10T09:00:00Z",
    configuration: {
        title: "Защита проектов",
        description: null,
        starts_at: start,
        connection_url: null,
        project_type_ids: [4],
        registration_opens_at: null,
        registration_closes_at: null,
        weights: { teacher: 60, manager: 30, member: 10 },
        max_score: 25,
        presentation_minutes: 7,
        questions_minutes: 7,
        transition_minutes: 1,
        assessment_window_minutes: 3,
    },
};
const slot: ExamSlot = {
    id: 8,
    workspace_id: 1,
    exam_id: 2,
    starts_at: start,
    ends_at: "2026-11-18T09:15:02Z",
    is_available: true,
};

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    vi.setSystemTime(now);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    vi.mocked(useExams).mockReturnValue({ data: { items: [exam] } } as ReturnType<typeof useExams>);
    vi.mocked(examApi.register).mockReset();
});

afterEach(() => {
    act(() => root.unmount());
    client.clear();
    container.remove();
    vi.useRealTimers();
});

async function render() {
    await act(async () => {
        root.render(
            <QueryClientProvider client={client}>
                <MemoryRouter>
                    <ProjectExamBlocks
                        workspaceId={1}
                        projectId={7}
                        projectTypeId={4}
                        isProjectAuthor
                    />
                </MemoryRouter>
            </QueryClientProvider>,
        );
        await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
    });
}

describe("project exam blocks", () => {
    it("switches from the countdown to the exam link at the start", async () => {
        await render();
        expect(container.textContent).toContain("00:00:02");
        expect(container.querySelector("h2 a")).toBeNull();
        expect(container.textContent).not.toContain("Защита проектов");

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2_000);
        });

        expect(container.textContent).toContain("Экзамен идёт");
        expect(container.querySelector("h2 a")?.textContent).toBe("Экзамен идёт");
        expect(container.querySelector('a[href*="examId=2"]')).toBeTruthy();
    });

    it("requires a free slot before submitting the team registration", async () => {
        await render();
        await act(async () => {
            [...container.querySelectorAll("button")]
                .find((button) => button.textContent === "Запишитесь на экзамен")
                ?.click();
        });

        const dialog = document.querySelector('[role="dialog"]');
        const confirm = [...(dialog?.querySelectorAll("button") ?? [])].find(
            (button) => button.textContent === "Записать команду",
        );
        expect(confirm?.disabled).toBe(true);
        await act(async () => {
            const select = dialog?.querySelector("select");
            if (!select) throw new Error("Missing slot picker");
            select.value = String(slot.id);
            select.dispatchEvent(new Event("change", { bubbles: true }));
        });
        expect(confirm?.disabled).toBe(false);

        await act(async () => {
            confirm?.click();
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(examApi.register).toHaveBeenCalledWith(1, 2, { project_id: 7, slot_id: 8 }, true);
    });

    it("prefers a registered exam even if its project type changed", async () => {
        const bookedExam = {
            ...exam,
            id: 3,
            configuration: { ...exam.configuration, project_type_ids: [5] },
        };
        vi.mocked(useExams).mockReturnValue({ data: { items: [exam, bookedExam] } } as ReturnType<
            typeof useExams
        >);
        client.setQueryData(["exams", "queue", "1", "3"], { items: [{ project_id: 7 }] });
        await render();

        expect(container.textContent).toContain("Экзамен для студентов дисциплины");
        expect(container.querySelector('a[href*="examId=3"]')).toBeTruthy();
        expect(container.textContent).not.toContain("Запишитесь на экзамен");
    });

    it("uses a compact countdown for several days", () => {
        expect(formatExamCountdown((4 * 24 + 10) * 60 * 60 * 1000)).toBe("4 дня 10 часов");
    });
});
