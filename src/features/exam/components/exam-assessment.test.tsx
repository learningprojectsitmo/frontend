// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { examGradingApi, gradingKey, type Answer, type AssessmentForm } from "@/lib/exam-grading";
import { ExamAssessment, ExamAssessmentNotification } from "./exam-assessment";

vi.mock("sonner", () => ({ toast: { custom: vi.fn(), dismiss: vi.fn() } }));

const target = { workspaceId: 1, examId: 2, attemptId: 3 };
const closesAt = "2026-11-20T12:00:00Z";
const form: AssessmentForm = {
    attempt_id: target.attemptId,
    window: { opened_at: "2026-11-20T11:57:00Z", closes_at: closesAt, settings_version: 1 },
    assessor: { role: "teacher", weight: 50, excluded: false },
    questions: [
        {
            id: 1,
            position: 1,
            text: "Критерий защиты",
            description: null,
            levels: [{ score: 5, description: "Полный ответ" }],
        },
    ],
    draft: { answers: [{ question_id: 1, score: 5, comment: null }], updated_at: closesAt },
    submission: null,
};

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

async function render(content: ReactNode) {
    await act(async () =>
        root.render(<QueryClientProvider client={client}>{content}</QueryClientProvider>),
    );
}

function assessment(seconds: number) {
    return (
        <ExamAssessment
            {...target}
            projectName="Проект команды"
            remainingSeconds={seconds}
            closesAt={closesAt}
        />
    );
}

async function click(text: string) {
    const findButton = () =>
        [...document.querySelectorAll("button")].find(
            (button) =>
                button.textContent?.trim() === text || button.getAttribute("aria-label") === text,
        );
    await vi.waitFor(() => expect(findButton()).toBeDefined());
    await act(async () => findButton()?.click());
}

function write(comment: HTMLTextAreaElement, value: string) {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.call(
        comment,
        value,
    );
    comment.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.body.appendChild(document.createElement("div"));
    root = createRoot(container);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(examGradingApi, "form").mockResolvedValue(form);
    vi.mocked(toast.custom).mockClear();
});

afterEach(() => {
    act(() => root.unmount());
    client.clear();
    container.remove();
    vi.restoreAllMocks();
});

describe("assessment window", () => {
    it("shows the maximum of a three-point sheet", async () => {
        const questions = Array.from({ length: 5 }, (_, id) => ({
            ...form.questions[0],
            id,
            levels: ([1, 2, 3] as const).map((score) => ({ score, description: String(score) })),
        }));
        vi.mocked(examGradingApi.form).mockResolvedValue({
            ...form,
            questions,
            draft: {
                ...form.draft,
                answers: questions.map((q) => ({ question_id: q.id, score: 3, comment: null })),
            },
        });
        await render(assessment(22));
        await click("Оценить");
        expect(document.body.textContent).toContain("15 из 15");
    });

    it("replaces criteria with the closing message when time runs out", async () => {
        await render(assessment(22));
        await click("Оценить");
        expect(document.body.textContent).toContain("Критерий защиты");
        expect(document.querySelector('[role="dialog"] [role="timer"]')?.textContent).toContain(
            "0:22",
        );

        await render(assessment(0));
        expect(document.body.textContent).not.toContain("Критерий защиты");
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            "время на отправку оценки истекло",
        );
    });

    it("opens a closed window without requesting the assessment form", async () => {
        await render(assessment(0));
        expect(container.textContent).not.toContain("Оценивание закрыто");
        await click("Оценивание закрыто");
        expect(examGradingApi.form).not.toHaveBeenCalled();
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            "Оценивание закрыто",
        );
    });

    it("keeps focus and serializes further edits while autosaving a comment", async () => {
        let resolveFirst: (value: AssessmentForm["draft"]) => void = () => {};
        const save = vi
            .spyOn(examGradingApi, "draft")
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    }),
            )
            .mockImplementation(async (_space, _exam, _attempt, answers) => ({
                answers,
                updated_at: closesAt,
            }));
        await render(assessment(90));
        await click("Оценить");
        const comment = document.querySelector("textarea")!;
        await act(async () => {
            comment.focus();
            write(comment, "Первый комментарий");
        });
        await act(async () => {
            await vi.waitFor(() => expect(save).toHaveBeenCalledOnce(), { timeout: 1500 });
        });
        expect(comment.readOnly).toBe(false);
        expect(document.activeElement).toBe(comment);
        await act(async () => {
            write(comment, "Первый комментарий с правкой");
            comment.setSelectionRange(6, 6);
            const answers: Answer[] = [{ question_id: 1, score: 5, comment: "Первый комментарий" }];
            resolveFirst({ answers, updated_at: closesAt });
        });
        expect(document.activeElement).toBe(comment);
        expect(comment.selectionStart).toBe(6);
        expect(comment.value).toBe("Первый комментарий с правкой");
        await act(async () => {
            await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2), { timeout: 1500 });
        });
        expect(save.mock.calls[1][3][0].comment).toBe("Первый комментарий с правкой");
    });

    it("queues one click to send the latest answers while an older draft is saving", async () => {
        let resolveFirst: (value: AssessmentForm["draft"]) => void = () => {};
        const save = vi
            .spyOn(examGradingApi, "draft")
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    }),
            )
            .mockImplementation(async (_space, _exam, _attempt, answers) => ({
                answers,
                updated_at: closesAt,
            }));
        const finalAnswers: Answer[] = [{ ...form.draft.answers[0], comment: "Новая правка" }];
        const submit = vi.spyOn(examGradingApi, "submit").mockResolvedValue({
            version: 1,
            submitted_at: closesAt,
            total: 5,
            answers: finalAnswers,
        });
        await render(assessment(90));
        await click("Оценить");
        const comment = document.querySelector("textarea")!;
        await act(async () => write(comment, "Старый черновик"));
        await act(async () => {
            await vi.waitFor(() => expect(save).toHaveBeenCalledOnce(), { timeout: 1500 });
        });

        await act(async () => write(comment, "Новая правка"));
        await click("Отправить оценку");
        expect(submit).not.toHaveBeenCalled();
        expect(save).toHaveBeenCalledOnce();

        await act(async () => {
            resolveFirst({
                answers: [{ ...form.draft.answers[0], comment: "Старый черновик" }],
                updated_at: closesAt,
            });
            await vi.waitFor(() => expect(submit).toHaveBeenCalledOnce());
        });
        expect(save).toHaveBeenCalledTimes(2);
        expect(save.mock.calls[1][3]).toEqual(finalAnswers);
    });

    it("allows corrections but disables sending the same grade again", async () => {
        const submitted = {
            ...form,
            submission: { version: 1, submitted_at: closesAt, has_unsubmitted_changes: false },
        };
        vi.mocked(examGradingApi.form).mockResolvedValue(submitted);
        const answers = [{ ...form.draft.answers[0], comment: "Уточнение" }];
        const draft = vi
            .spyOn(examGradingApi, "draft")
            .mockResolvedValue({ answers, updated_at: closesAt });
        const submit = vi
            .spyOn(examGradingApi, "submit")
            .mockResolvedValue({ version: 2, submitted_at: closesAt, total: 5, answers });
        await render(assessment(90));
        await click("Оценить");
        const send = [...document.querySelectorAll("button")].find(
            (button) => button.textContent?.trim() === "Отправить правки",
        );
        expect(send?.disabled).toBe(true);
        await act(async () => write(document.querySelector("textarea")!, "Уточнение"));
        await click("Отправить правки");
        expect(draft).toHaveBeenCalledWith(
            target.workspaceId,
            target.examId,
            target.attemptId,
            answers,
        );
        expect(submit).toHaveBeenCalledOnce();
    });

    it("notifies an admitted assessor once without opening the form", async () => {
        const time = Date.parse(closesAt) - 60_000;
        await client.prefetchQuery({
            queryKey: [
                ...gradingKey(target.workspaceId, target.examId),
                "assessment",
                target.attemptId,
            ],
            queryFn: () => examGradingApi.form(target.workspaceId, target.examId, target.attemptId),
        });
        await render(
            <ExamAssessmentNotification {...target} closesAt={closesAt} serverNow={time} />,
        );
        expect(toast.custom).toHaveBeenCalledOnce();
        expect(toast.custom).toHaveBeenCalledWith(
            expect.any(Function),
            expect.objectContaining({ position: "bottom-right" }),
        );
        await render(
            <ExamAssessmentNotification {...target} closesAt={closesAt} serverNow={time + 1000} />,
        );
        expect(toast.custom).toHaveBeenCalledOnce();
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
});
