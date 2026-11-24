import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import { api } from "./api-client";
import { examApi, getExamErrorMessage, invalidateExam, questionApi } from "./exams";
import { queryKeys } from "./query-keys";

vi.mock("./api-client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

describe("exam API", () => {
    it.each([
        "questions_not_ready",
        "registration_not_active",
        "project_type_not_allowed",
        "defense_already_started",
    ])("translates %s without exposing backend text", (code) => {
        const error = new AxiosError("Request failed");
        Object.assign(error, { response: { data: { detail: { code, message: "raw message" } } } });
        const message = getExamErrorMessage(error);
        expect(message).toBeTruthy();
        expect(message).not.toContain(code);
        expect(message).not.toContain("raw message");
    });

    it("leaves unknown and non-API errors to the action-specific fallback", () => {
        const error = new AxiosError("Request failed");
        Object.assign(error, { response: { data: { detail: { code: "constructor" } } } });
        expect(getExamErrorMessage(error)).toBeNull();
        expect(getExamErrorMessage(new Error("Request failed"))).toBeNull();
    });

    it("sends the selected scale and a missing optional criterion description as null", async () => {
        const levels = ([1, 2, 3] as const).map((score) => ({
            score,
            description: `Уровень ${score}`,
        }));
        await questionApi.replace(
            1,
            2,
            [
                {
                    id: 0,
                    position: 1,
                    text: "Критерий",
                    description: "  ",
                    levels,
                },
            ],
            3,
        );
        expect(api.put).toHaveBeenCalledWith("/workspaces/1/project-types/2/questions", {
            max_score: 3,
            questions: [{ text: "Критерий", description: null, levels }],
        });
    });

    it("reads all slot pages using the existing pagination parameters", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ items: [{ id: 1 }], has_more: true });
        vi.mocked(api.get).mockResolvedValueOnce({ items: [{ id: 2 }], has_more: false });
        const result = await examApi.slots(1, 2);
        expect(result.items.map((slot) => slot.id)).toEqual([1, 2]);
        expect(api.get).toHaveBeenLastCalledWith("/workspaces/1/exams/2/slots", {
            params: { limit: 100, offset: 1 },
        });
    });

    it.each([true, false])(
        "moves a registration with the existing route (self: %s)",
        async (self) => {
            await examApi.moveRegistration(1, 2, { id: 3, version: 4 }, null, {
                targetExamId: 5,
                self,
                reason: "Согласовали другую дату",
            });
            expect(api.post).toHaveBeenLastCalledWith(
                `/workspaces/1/exams/2/registrations/3/${self ? "self-move" : "move"}`,
                {
                    expected_version: 4,
                    target_exam_id: 5,
                    target_slot_id: null,
                    reason: "Согласовали другую дату",
                },
            );
        },
    );

    it("postpones a queued team with its registration version and reason", async () => {
        await examApi.postponeRegistration(1, 2, 3, 4, "Техническая неполадка");
        expect(api.post).toHaveBeenLastCalledWith("/workspaces/1/exams/2/queue/3/postpone", {
            expected_version: 4,
            reason: "Техническая неполадка",
        });
    });

    it("invalidates history, lists and both registration views after a mutation", async () => {
        const client = new QueryClient();
        const keys = [
            queryKeys.exams.list(1),
            queryKeys.exams.list(1, "published"),
            queryKeys.exams.settings(1, 2),
            queryKeys.exams.registrations(1, 2),
            queryKeys.exams.registrations(1, 2, true),
        ];
        for (const key of keys) client.setQueryData(key, {});
        await invalidateExam(client, 1, 2);
        for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
        client.clear();
    });
});
