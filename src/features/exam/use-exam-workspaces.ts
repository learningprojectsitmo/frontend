import { useQueries, useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/auth";
import { getSpacesList, getWorkspaceDirectoryPage, getWorkspaceParticipants } from "@/lib/spaces";
import { queryKeys } from "@/lib/query-keys";

export function canManageWorkspaceExams(
    globalRole: string,
    workspaceRole?: string | null,
    isAuthor = false,
) {
    return (
        canReadWorkspaceExams(globalRole, workspaceRole, isAuthor) &&
        (globalRole === "admin" ||
            globalRole === "teacher" ||
            workspaceRole === "teacher" ||
            workspaceRole === "admin")
    );
}

export function canReadWorkspaceExams(
    globalRole: string,
    workspaceRole?: string | null,
    isAuthor = false,
) {
    return globalRole === "admin" || isAuthor || typeof workspaceRole === "string";
}

export function canRegisterOwnProject(
    globalRole: string,
    workspaceRole: string | null | undefined,
) {
    return (
        typeof workspaceRole === "string" &&
        (workspaceRole === "" ? globalRole : workspaceRole) === "manager"
    );
}

export function canManageExamResults(globalRole: string, workspaceRole?: string | null) {
    const effectiveRole = workspaceRole === "" ? globalRole : workspaceRole;
    return effectiveRole === "teacher" || effectiveRole === "admin";
}

async function getWorkspaceRole(workspaceId: number, userId: number) {
    let page = 1;
    while (true) {
        const result = await getWorkspaceParticipants(workspaceId, { page, limit: 100 });
        const membership = result.items.find((item) => item.user_id === userId);
        if (membership) return membership.workspace_role;
        if (page >= result.total_pages || result.items.length === 0) return null;
        page += 1;
    }
}

export function useExamWorkspaces(
    workspaceId = 0,
    enabled = true,
    checkRegistrationRole = false,
    checkResultAccess = false,
) {
    const user = useUser();
    const menu = useQuery({
        queryKey: [...queryKeys.workspace.list(), "exam-spaces", user.data?.id],
        enabled: Boolean(user.data?.id),
        queryFn: async () => {
            const first = await getSpacesList({ page: 1, limit: 100 });
            const spaces = [...first.spaces];
            for (let page = 2; spaces.length < (first.total ?? 0); page += 1) {
                const next = await getSpacesList({ page, limit: 100 });
                if (next.spaces.length === 0) break;
                spaces.push(...next.spaces);
            }
            return { ...first, spaces };
        },
    });
    const role = menu.data?.role ?? "";
    const userId = user.data?.id;
    const adminDirectory = useQuery({
        queryKey: [...queryKeys.workspace.list(), "exam-admin-directory", userId],
        enabled: enabled && Boolean(userId) && role === "admin",
        queryFn: async () => {
            const limit = 100;
            const spaces = [];
            for (let page = 1; ; page += 1) {
                const items = await getWorkspaceDirectoryPage(page, limit);
                spaces.push(
                    ...items.map((space) => ({
                        id: space.id,
                        title: space.name,
                        author_id: space.author_id,
                    })),
                );
                if (items.length < limit) return spaces;
            }
        },
    });
    const spaces = (role === "admin" ? adminDirectory.data : undefined) ?? menu.data?.spaces ?? [];
    const candidates = !enabled
        ? []
        : workspaceId
          ? spaces.filter((space) => space.id === workspaceId)
          : spaces;
    const memberships = useQueries({
        queries: candidates.map((space) => ({
            queryKey: [...queryKeys.workspace.participants(space.id), "exam-role", userId],
            queryFn: () => (userId ? getWorkspaceRole(space.id, userId) : Promise.resolve(null)),
            enabled:
                Boolean(userId) && (checkRegistrationRole || checkResultAccess || role !== "admin"),
            retry: false,
        })),
    });
    const manageable = candidates.filter((space, index) =>
        canManageWorkspaceExams(
            role,
            memberships[index]?.data ?? undefined,
            space.author_id === userId,
        ),
    );
    const workspaceRole = memberships[0]?.data;
    return {
        spaces,
        resultSpaces: candidates.filter(
            (_, index) =>
                memberships[index]?.isSuccess &&
                canManageExamResults(role, memberships[index].data),
        ),
        resultAccessError:
            user.isError ||
            menu.isError ||
            adminDirectory.isError ||
            memberships.some((query) => query.isError),
        readable: candidates.filter((space, index) =>
            canReadWorkspaceExams(role, memberships[index]?.data, space.author_id === userId),
        ),
        canManageResults: workspaceId > 0 && canManageExamResults(role, workspaceRole),
        canSelfRegister:
            workspaceId > 0 &&
            checkRegistrationRole &&
            canRegisterOwnProject(role, memberships[0]?.data),
        manageable,
        removable: candidates.filter(
            (_, index) => role === "admin" || memberships[index]?.data === "admin",
        ),
        canRemove: enabled && workspaceId > 0 && (role === "admin" || workspaceRole === "admin"),
        canManage:
            workspaceId > 0
                ? (enabled && role === "admin") || manageable.length > 0
                : manageable.length > 0,
        isLoading:
            menu.isLoading ||
            user.isLoading ||
            adminDirectory.isLoading ||
            memberships.some((query) => query.isLoading),
    };
}
