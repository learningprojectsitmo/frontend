// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { examGradingApi, type RegistryItem } from "@/lib/exam-grading";
import { ExamResultDialog } from "./exam-results";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const item: RegistryItem = {
    attempt_id: 3,
    project_id: 4,
    project_name: "Проект команды",
    state: "undecided",
    current: null,
    editions_count: 0,
    previous_final_score: null,
    settings_outdated: false,
};
const snapshot = { max_score: "25.00", settings_version: 1, sheet_max: 25 };
const preliminary = { score: "16.67", snapshot, roles: [] };
const submittedAt = "2026-11-20T12:00:00Z";

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;

function button(label: string) {
    return [...document.querySelectorAll("button")].find(
        (candidate) => candidate.textContent?.trim() === label,
    );
}

function write(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value")?.set?.call(
        element,
        value,
    );
    element.dispatchEvent(new Event("input", { bubbles: true }));
}

async function waitForResult(assertion: () => void) {
    await vi.waitFor(async () => {
        await act(async () => {});
        assertion();
    });
}

async function renderResult() {
    await act(async () => {
        root.render(
            <QueryClientProvider client={client}>
                <ExamResultDialog
                    workspaceId={1}
                    examId={2}
                    item={item}
                    onClose={vi.fn()}
                    windowOpen={false}
                />
            </QueryClientProvider>,
        );
    });
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.body.appendChild(document.createElement("div"));
    root = createRoot(container);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(examGradingApi, "result").mockResolvedValue({
        edition: null,
        preliminary,
        outdated: false,
    });
    vi.spyOn(examGradingApi, "editions").mockResolvedValue({ items: [] });
    vi.spyOn(examGradingApi, "participation").mockResolvedValue({
        state: "closed",
        summary: { total: { admitted: 2, submitted: 1, not_submitted: 1, excluded: 0 } },
        items: [
            {
                user_id: 1,
                name: "Анна Смирнова",
                role: "teacher",
                status: "submitted",
                exclusion_reason: null,
                submission: {
                    version: 2,
                    total: 17,
                    submitted_at: submittedAt,
                    answers: [{ question_id: 1, score: 3, comment: null }],
                },
            },
            {
                user_id: 2,
                name: "Пётр Иванов",
                role: "member",
                status: "not_submitted",
                exclusion_reason: null,
                submission: null,
            },
        ],
    });
});

afterEach(() => {
    act(() => root.unmount());
    client.clear();
    container.remove();
    vi.restoreAllMocks();
});

describe("exam result decisions", () => {
    it("applies the calculation shown on the button", async () => {
        const decide = vi.spyOn(examGradingApi, "decide").mockResolvedValue({
            edition: null,
            preliminary,
            outdated: false,
        });
        await renderResult();
        await waitForResult(() => expect(button("Утвердить расчёт 16,67")).toBeDefined());
        const reasonField = document.querySelector("textarea")!;
        expect(reasonField.required).toBe(false);
        expect(reasonField.labels?.[0].textContent).toBe("Причина решения (необязательно)");

        await act(async () => button("Утвердить расчёт 16,67")?.click());

        expect(decide).toHaveBeenCalledExactlyOnceWith(1, 2, 3, "accept", {
            expected_version: 0,
        });
    });

    it("saves a manual score with a reason and shows it separately from the calculation", async () => {
        const reason = "Учтена повторная защита";
        const edition = {
            version: 1,
            kind: "manual" as const,
            calculated_score: "16.67",
            final_score: "20.00",
            reason,
            decided_by: 1,
            decided_at: submittedAt,
            published_at: null,
            snapshot,
        };
        const decide = vi.spyOn(examGradingApi, "decide").mockImplementation(async () => {
            const result = { edition, preliminary, outdated: false };
            vi.mocked(examGradingApi.result).mockResolvedValue(result);
            vi.mocked(examGradingApi.editions).mockResolvedValue({ items: [edition] });
            return result;
        });
        await renderResult();
        await waitForResult(() =>
            expect(document.querySelector('input[value="manual"]')).toBeTruthy(),
        );
        await act(async () =>
            document.querySelector<HTMLInputElement>('input[value="manual"]')?.click(),
        );
        const input = document.querySelector<HTMLInputElement>('input[inputmode="decimal"]')!;
        await act(async () => write(input, "20"));

        expect(button("Утвердить расчёт 16,67")).toBeUndefined();
        expect(button("Сохранить итог 20,00")?.disabled).toBe(true);
        const reasonField = document.querySelector("textarea")!;
        expect(reasonField.required).toBe(true);
        expect(reasonField.labels?.[0].textContent).toBe("Причина решения (обязательно)");
        const hintId = reasonField.getAttribute("aria-describedby");
        expect(hintId && document.getElementById(hintId)?.textContent).toBe(
            "Укажите причину выставления оценки вручную",
        );
        await act(async () => write(reasonField, reason));
        await act(async () => button("Сохранить итог 20,00")?.click());

        expect(decide).toHaveBeenCalledExactlyOnceWith(1, 2, 3, "manual", {
            expected_version: 0,
            final_score: "20",
            reason,
        });
        await waitForResult(() =>
            expect(document.body.textContent).toContain("20,00 из 25,00 · Установлен вручную"),
        );
        expect(document.body.textContent).toContain("16,67");
        expect(document.body.textContent).toContain(reason);

        await act(async () =>
            document.querySelector<HTMLInputElement>('input[value="calculated"]')?.click(),
        );
        expect(reasonField.required).toBe(true);
        expect(reasonField.labels?.[0].textContent).toBe("Укажите причину решения");
        expect(reasonField.getAttribute("aria-describedby")).toBeNull();
        expect(button("Утвердить расчёт 16,67")?.disabled).toBe(true);
    });

    it("prompts for a manual reason when a calculation is unavailable", async () => {
        vi.mocked(examGradingApi.result).mockResolvedValue({
            edition: null,
            preliminary: { ...preliminary, score: null },
            outdated: false,
        });
        await renderResult();
        await waitForResult(() => expect(button("Сохранить ручной итог")).toBeDefined());

        expect(document.querySelector<HTMLInputElement>('input[value="manual"]')?.checked).toBe(
            true,
        );
        expect(document.querySelector("textarea")?.required).toBe(true);
        expect(document.body.textContent).toContain("Укажите причину выставления оценки вручную");
    });

    it("shows each assessor's total and participation on the main result view", async () => {
        await renderResult();
        await waitForResult(() => expect(document.body.textContent).toContain("Анна Смирнова"));

        const assessor = [...document.querySelectorAll("li")].find((row) =>
            row.textContent?.includes("Анна Смирнова"),
        )!;
        expect(assessor.closest("details")).toBeNull();
        expect(assessor.textContent).toContain("Комиссия");
        expect(assessor.textContent).toContain("17 из 25");
        expect(assessor.textContent).toContain("Отправленная оценка");
        const other = [...document.querySelectorAll("li")].find((row) =>
            row.textContent?.includes("Пётр Иванов"),
        )!;
        expect(other.textContent).toContain("Оценка не отправлена");
    });
});
