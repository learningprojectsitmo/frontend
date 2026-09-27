import { describe, expect, it } from "vitest";

import { normalizeResumeHref } from "@/lib/resume";

/**
 * `resume_url` приходит с backend и используется как `to=` у `<Link>`.
 * Роут `/resume/:id` в приложении не зарегистрирован — есть только
 * `/app/resume` с query-параметрами. Нормализатор обязана превращать любую
 * форму в href, на который роутер действительно отвечает.
 */
describe("normalizeResumeHref", () => {
    it("возвращает пустую строку без ссылки", () => {
        expect(normalizeResumeHref(null)).toBe("");
        expect(normalizeResumeHref(undefined)).toBe("");
        expect(normalizeResumeHref("")).toBe("");
    });

    it("оставляет готовую ссылку SPA как есть, вместе с контекстом", () => {
        expect(normalizeResumeHref("/app/resume?id=2")).toBe("/app/resume?id=2");
        expect(normalizeResumeHref("/app/resume?id=2&workspaceId=1")).toBe(
            "/app/resume?id=2&workspaceId=1",
        );
    });

    it("не разбирает готовую ссылку как путь — регрессия split('/')", () => {
        // Раньше здесь получалось /app/resume?id=resume?id=2&workspaceId=1
        expect(normalizeResumeHref("/app/resume?id=2&workspaceId=1")).not.toContain("id=resume");
    });

    it("пересобирает устаревшую путевую форму", () => {
        expect(normalizeResumeHref("/resume/2")).toBe("/app/resume?id=2");
    });

    it("игнорирует мусор без числового id", () => {
        expect(normalizeResumeHref("/resume/abc")).toBe("");
        expect(normalizeResumeHref("/resume/")).toBe("");
        expect(normalizeResumeHref("/some/other/page")).toBe("");
    });

    it("никогда не возвращает путь, которого нет в роутере", () => {
        for (const input of ["/resume/2", "/app/resume?id=2", "/app/resume?id=2&workspaceId=1"]) {
            expect(normalizeResumeHref(input).startsWith("/resume/")).toBe(false);
        }
    });

    it("сохраняет числовой id, а не мусор после него", () => {
        expect(normalizeResumeHref("/resume/12")).toContain("id=12");
    });
});
