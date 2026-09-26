import { describe, expect, it } from "vitest";
import { mapResumeFromApi } from "./resume-card";
import type { ResumeFull } from "@/types/api";

function resume(overrides: Partial<ResumeFull> = {}): ResumeFull {
    return {
        id: 1,
        header: "Backend",
        author_id: 1,
        views_count: 0,
        invitations_count: 0,
        resume_text: null,
        role: null,
        about: null,
        cover_letter: null,
        has_experience: true,
        no_experience_description: null,
        is_visible: true,
        is_default: false,
        created_at: "2026-09-26T10:00:00Z",
        updated_at: "2026-09-26T10:00:00Z",
        ...overrides,
    };
}

describe("mapResumeFromApi", () => {
    it("maps the default flag", () => {
        expect(mapResumeFromApi(resume({ is_default: true })).isDefault).toBe(true);
        expect(mapResumeFromApi(resume({ is_default: false })).isDefault).toBe(false);
    });

    it("treats a missing default flag as false", () => {
        // Старый ответ бэкенда без поля не должен ломать рендер карточки.
        const legacy = resume();
        delete (legacy as Partial<ResumeFull>).is_default;

        expect(mapResumeFromApi(legacy).isDefault).toBe(false);
    });
});
