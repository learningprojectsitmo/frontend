import { describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api-client";
import { examGradingApi } from "./exam-grading";

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));

describe("exam grading contracts", () => {
    it("sends the selected answers in one request without a preceding draft save", async () => {
        const answers = [{ question_id: 9, score: 5, comment: null }];
        await examGradingApi.submit(1, 2, 3, answers);
        expect(api.put).not.toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith(
            "/workspaces/1/exams/2/attempts/3/assessment/submit",
            { answers },
        );
    });

    it("keeps the decision version and exact decimal string", async () => {
        await examGradingApi.decide(1, 2, 3, "manual", {
            expected_version: 4,
            final_score: "3.81",
            reason: "Уточнили итог",
        });
        expect(api.post).toHaveBeenCalledWith("/workspaces/1/exams/2/attempts/3/result/manual", {
            expected_version: 4,
            final_score: "3.81",
            reason: "Уточнили итог",
        });
    });

    it("reads the complete registry and downloads the pair of CSV files as one archive", async () => {
        vi.mocked(api.get)
            .mockResolvedValueOnce({ items: [{ attempt_id: 3 }], has_more: true })
            .mockResolvedValueOnce({ items: [{ attempt_id: 4 }], has_more: false });
        expect((await examGradingApi.registry(1, 2)).map((item) => item.attempt_id)).toEqual([
            3, 4,
        ]);
        expect(api.get).toHaveBeenLastCalledWith("/workspaces/1/exams/2/results", {
            params: { offset: 1, limit: 100 },
        });
        await examGradingApi.csv(1, 2);
        expect(api.get).toHaveBeenLastCalledWith("/workspaces/1/exams/2/exports/csv", {
            responseType: "blob",
        });
    });
});
