// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gradingKey } from "@/lib/exam-grading";
import { examApi, useExamBlockedProjects, useExams } from "@/lib/exams";
import type { Exam, ExamSlot } from "@/types/exam";
import { ProjectExamBlocks } from "./project-exam-blocks";
import { formatExamCountdown } from "./project-exam-display";

vi.mock("@/lib/exams", () => ({
    examApi: { queue: vi.fn(async () => ({ items: [] })), register: vi.fn() },
    useExams: vi.fn(),
    useExamBlockedProjects: vi.fn(),
    useExamSlots: (_workspaceId: number, examId: number) => ({
        data: examId ? { items: visibleSlots } : undefined,
    }),
    getExamErrorMessage: vi.fn(),
    invalidateExam: vi.fn(),
}));
vi.mock("@/features/exam/use-exam-workspaces", () => ({
    useExamWorkspaces: () => ({
        spaces: [{ id: 1, title: "Управление проектами" }],
        canSelfRegister: true,
        canManageResults,
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

let visibleSlots: ExamSlot[];
let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
let canManageResults: boolean;

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    canManageResults = false;
    visibleSlots = [slot];
    vi.setSystemTime(now);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    vi.mocked(useExams).mockReturnValue({ data: { items: [exam] } } as ReturnType<typeof useExams>);
    vi.mocked(examApi.register).mockReset();
    vi.mocked(useExamBlockedProjects).mockReturnValue({
        data: [] as number[],
        isSuccess: true,
    } as ReturnType<typeof useExamBlockedProjects>);
});

afterEach(() => {
    act(() => root.unmount());
    client.clear();
    container.remove();
    vi.useRealTimers();
});

async function render(isTeamMember = true) {
    await act(async () => {
        root.render(
            <QueryClientProvider client={client}>
                <MemoryRouter>
                    <ProjectExamBlocks
                        workspaceId={1}
                        projectId={7}
                        projectTypeId={4}
                        isProjectAuthor
                        isTeamMember={isTeamMember}
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
    it("switches from the countdown to waiting for the organizer at the planned time", async () => {
        await render();
        expect(container.textContent).toContain("00:00:02");
        expect(container.querySelector("h2 a")).toBeNull();
        expect(container.textContent).not.toContain("Защита проектов");

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2_000);
        });

        expect(container.textContent).toContain("Ожидается начало экзамена");
        expect(container.querySelector("h2 a")?.textContent).toBe("Ожидается начало экзамена");
        expect(container.querySelector('a[href*="examId=2"]')).toBeTruthy();
    });

    it("shows the exam in progress when its actual start arrived ahead of schedule", async () => {
        const startedExam: Exam = {
            ...exam,
            started_at: new Date(Date.parse(start) - 3000).toISOString(),
        };
        vi.mocked(useExams).mockReturnValue({ data: { items: [startedExam] } } as ReturnType<
            typeof useExams
        >);
        await render();
        expect(container.querySelector("h2 a")?.textContent).toBe("Экзамен идёт");
        expect(container.textContent).not.toContain("Запишитесь на экзамен");
    });

    it("requires a free slot before submitting the team registration", async () => {
        vi.setSystemTime(new Date("2026-11-18T08:00:00Z"));
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
        expect(examApi.register).toHaveBeenCalledWith(
            1,
            2,
            {
                project_id: 7,
                slot_id: 8,
                expected_slot: { starts_at: slot.starts_at, ends_at: slot.ends_at },
            },
            true,
        );
    });

    it("registers without a defense slot when the schedule only contains a break", async () => {
        vi.setSystemTime(new Date("2026-11-18T08:00:00Z"));
        visibleSlots = [{ ...slot, kind: "break", is_available: false }];
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
        expect(confirm?.disabled).toBe(false);
        await act(async () => {
            confirm?.click();
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(examApi.register).toHaveBeenCalledWith(1, 2, { project_id: 7, slot_id: null }, true);
    });

    it("requires a new choice when the selected slot moves without changing ID", async () => {
        vi.setSystemTime(new Date("2026-11-18T08:00:00Z"));
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
        await act(async () => {
            const select = dialog?.querySelector("select");
            if (!select) throw new Error("Missing slot picker");
            select.value = String(slot.id);
            select.dispatchEvent(new Event("change", { bubbles: true }));
        });
        expect(confirm?.disabled).toBe(false);

        visibleSlots = [{ ...slot, starts_at: "2026-11-18T09:05:02Z" }];
        await render();
        expect(confirm?.disabled).toBe(true);
        expect(dialog?.textContent).toContain("Время слота изменилось");
        expect(examApi.register).not.toHaveBeenCalled();
    });

    it("offers an open exam when another compatible exam is already running", async () => {
        vi.setSystemTime(new Date("2026-11-18T08:00:00Z"));
        const runningExam = {
            ...exam,
            id: 3,
            configuration: { ...exam.configuration, starts_at: "2026-11-18T07:59:00Z" },
        };
        vi.mocked(useExams).mockReturnValue({ data: { items: [runningExam, exam] } } as ReturnType<
            typeof useExams
        >);
        await render();

        expect(container.textContent).toContain("Запишитесь на экзамен");
        expect(container.querySelector('a[href*="examId=2"]')).toBeTruthy();
    });

    it("hides registration at the configured deadline", async () => {
        const deadline = "2026-11-18T08:00:02Z";
        vi.setSystemTime(new Date(deadline));
        vi.mocked(useExams).mockReturnValue({
            data: {
                items: [
                    {
                        ...exam,
                        configuration: { ...exam.configuration, registration_closes_at: deadline },
                    },
                ],
            },
        } as ReturnType<typeof useExams>);
        await render();

        expect(container.textContent).not.toContain("Запишитесь на экзамен");
    });

    it("prefers a registered exam even if its project type changed", async () => {
        vi.mocked(useExamBlockedProjects).mockReturnValue({
            data: [7],
            isSuccess: true,
        } as ReturnType<typeof useExamBlockedProjects>);
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

    it("hides booking after a defense at an unfinished exam when the server reports a block", async () => {
        vi.mocked(useExamBlockedProjects).mockReturnValue({
            data: [7],
            isSuccess: true,
        } as ReturnType<typeof useExamBlockedProjects>);
        const pastExam: Exam = {
            ...exam,
            id: 3,
            configuration: { ...exam.configuration, starts_at: "2026-11-17T09:00:00Z" },
        };
        vi.mocked(useExams).mockReturnValue({ data: { items: [exam, pastExam] } } as ReturnType<
            typeof useExams
        >);
        client.setQueryData(["exams", "queue", "1", "3"], {
            items: [
                { project_id: 7, state: "finished", attempt: { finished_at: now.toISOString() } },
            ],
        });
        await render();
        expect(container.textContent).toContain("Запись с");
        expect(container.textContent).not.toContain("Запишитесь на экзамен");
    });

    it("offers the next exam after completion and keeps the previous published grade visible", async () => {
        const past: Exam = {
            ...exam,
            id: 3,
            started_at: "2026-11-17T09:00:00Z",
            completed_at: "2026-11-17T10:00:00Z",
            configuration: {
                ...exam.configuration,
                title: "Прежняя защита",
                starts_at: "2026-11-17T09:00:00Z",
            },
        };
        const next = {
            ...exam,
            configuration: {
                ...exam.configuration,
                registration_opens_at: "2026-11-18T09:00:01Z",
            },
        };
        vi.mocked(useExams).mockReturnValue({ data: { items: [next, past] } } as ReturnType<
            typeof useExams
        >);
        client.setQueryData(["exams", "queue", "1", "3"], {
            items: [{ project_id: 7, state: "finished", attempt: { id: 17 } }],
        });
        client.setQueryData([...gradingKey(1, 3), "editions", 17], {
            items: [
                {
                    published_at: past.completed_at,
                    final_score: "22.00",
                    snapshot: { max_score: "25.00" },
                },
            ],
        });
        canManageResults = true;
        await render();
        expect(container.textContent).not.toContain("Запишитесь на экзамен");
        expect(container.textContent).toContain("22 из 25");
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1_000);
        });
        expect(container.textContent).toContain("Запишитесь на экзамен");
        expect(useExamBlockedProjects).toHaveBeenCalledWith(1, 2, true, true);
        expect(container.querySelector('a[href*="examId=2"]')).toBeTruthy();
        client.setQueryData(["exams", "queue", "1", "2"], {
            items: [{ project_id: 7, state: "finished", attempt: { id: 18 } }],
        });
        client.setQueryData([...gradingKey(1, 2), "editions", 18], { items: [] });
        vi.mocked(useExams).mockReturnValue({
            data: { items: [{ ...next, completed_at: new Date(Date.now()).toISOString() }, past] },
        } as ReturnType<typeof useExams>);
        await render();
        expect(container.textContent).toContain("Прежняя защита");
        expect(container.textContent).toContain("22 из 25");
    });

    it("shows only published grades to project members with results access", async () => {
        const finished = { id: 17, finished_at: now.toISOString(), assessment_window: null };
        client.setQueryData(["exams", "queue", "1", "2"], {
            items: [{ project_id: 7, state: "finished", attempt: finished }],
        });
        client.setQueryData([...gradingKey(1, 2), "editions", 17], {
            items: [
                {
                    version: 1,
                    published_at: now.toISOString(),
                    final_score: "22.00",
                    snapshot: { max_score: "25.00" },
                },
                {
                    version: 2,
                    published_at: null,
                    final_score: "24.00",
                    snapshot: { max_score: "25.00" },
                },
            ],
        });

        await render();
        expect(container.textContent).not.toContain("Опубликованная оценка");
        canManageResults = true;
        await render(false);
        expect(container.textContent).not.toContain("Опубликованная оценка");
        await render();
        expect(container.textContent).toContain("Опубликованная оценка");
        expect(container.textContent).toContain("22 из 25");
        expect(container.textContent).not.toContain("24 из 25");
    });

    it("uses a compact countdown for several days", () => {
        expect(formatExamCountdown((4 * 24 + 10) * 60 * 60 * 1000)).toBe("4 дня 10 часов");
    });
});
