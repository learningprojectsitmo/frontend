import { describe, expect, it } from "vitest";
import { canManageWorkspaceExams, canReadWorkspaceExams, canRegisterOwnProject } from "./use-exam-workspaces";

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

it("allows an admin to register an owned project when their workspace role is manager", () => {
    expect(canRegisterOwnProject("admin", "manager")).toBe(true);
    expect(canRegisterOwnProject("admin", "admin")).toBe(false);
    expect(canRegisterOwnProject("admin", null)).toBe(false);
});

describe("exam role combinations", () => {
    it.each([
        ["admin", null, false, true, true, false],
        ["teacher", null, false, false, false, false],
        ["teacher", "manager", false, true, true, true],
        ["member", "teacher", false, true, true, false],
        ["manager", "member", false, true, false, false],
        ["manager", "", false, true, false, true],
        ["manager", null, true, true, false, false],
        ["member", "member", false, true, false, false],
        ["member", null, false, false, false, false],
    ] as const)("maps %s / %s / workspace ownership %s", (global, local, owner, read, manage, register) => {
        expect(canReadWorkspaceExams(global, local, owner)).toBe(read);
        expect(canManageWorkspaceExams(global, local, owner)).toBe(manage);
        expect(canRegisterOwnProject(global, local)).toBe(register);
    });
});
