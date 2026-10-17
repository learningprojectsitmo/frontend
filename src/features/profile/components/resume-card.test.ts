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
        spaces: [],
        created_at: "2026-09-26T10:00:00Z",
        updated_at: "2026-09-26T10:00:00Z",
        ...overrides,
    };
}

describe("mapResumeFromApi", () => {
    it("maps header, counters and visibility", () => {
        const item = mapResumeFromApi(resume({ header: "Frontend", views_count: 3 }));
        expect(item.id).toBe(1);
        expect(item.position).toBe("Frontend");
        expect(item.views).toBe("3");
        expect(item.isVisible).toBe(true);
    });

    it("formats updated_at as a ru-RU date", () => {
        const item = mapResumeFromApi(resume({ updated_at: "2026-09-26T10:00:00Z" }));
        expect(item.lastUpdated).toBe(new Date("2026-09-26T10:00:00Z").toLocaleDateString("ru-RU"));
    });

    it("shows an em dash when updated_at is missing", () => {
        const item = mapResumeFromApi(resume({ updated_at: "" }));
        expect(item.lastUpdated).toBe("—");
    });
});
