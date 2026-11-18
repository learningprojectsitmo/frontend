import { describe, expect, it } from "vitest";
import { canManageWorkspaceExams } from "./use-exam-workspaces";

describe("exam management access", () => {
    it.each([
        ["member", "member"],
        ["manager", "manager"],
        ["member", "manager"],
        ["manager", "member"],
        ["teacher", undefined],
    ])(
        "denies exam management for global role %s and workspace role %s",
        (globalRole, workspaceRole) => {
            expect(canManageWorkspaceExams(globalRole, workspaceRole)).toBe(false);
        },
    );

    it.each([
        ["admin", undefined],
        ["member", "teacher"],
        ["member", "admin"],
        ["teacher", "member"],
    ])(
        "allows exam management for global role %s and workspace role %s",
        (globalRole, workspaceRole) => {
            expect(canManageWorkspaceExams(globalRole, workspaceRole)).toBe(true);
        },
    );

    it("allows a teacher who owns the workspace and denies ownership alone", () => {
        expect(canManageWorkspaceExams("teacher", undefined, true)).toBe(true);
        expect(canManageWorkspaceExams("manager", undefined, true)).toBe(false);
    });
});
