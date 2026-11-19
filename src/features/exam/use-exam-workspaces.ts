import { useQueries, useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/auth";
import { getSpacesList, getWorkspaceParticipants } from "@/lib/spaces";
import { queryKeys } from "@/lib/query-keys";

export function canManageWorkspaceExams(
    globalRole: string,
    workspaceRole?: string,
    isAuthor = false,
) {
    return (
        globalRole === "admin" ||
        workspaceRole === "admin" ||
        workspaceRole === "teacher" ||
        (globalRole === "teacher" && (isAuthor || workspaceRole !== undefined))
    );
}

export function canRegisterOwnProject(
    globalRole: string,
    workspaceRole: string | null | undefined,
) {
    return typeof workspaceRole === "string" && (workspaceRole || globalRole) === "manager";
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

export function useExamWorkspaces(workspaceId = 0, enabled = true, checkRegistrationRole = false) {
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
    const spaces = menu.data?.spaces ?? [];
    const role = menu.data?.role ?? "";
    const userId = user.data?.id;
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
                Boolean(userId) &&
                (checkRegistrationRole ||
                    !canManageWorkspaceExams(role, undefined, space.author_id === userId)),
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
    return {
        spaces,
        canSelfRegister: checkRegistrationRole && canRegisterOwnProject(role, memberships[0]?.data),
        isMenuLoading: user.isLoading || menu.isLoading,
        manageable,
        canManage:
            workspaceId > 0 ? role === "admin" || manageable.length > 0 : manageable.length > 0,
        isLoading: menu.isLoading || user.isLoading || memberships.some((query) => query.isLoading),
    };
}
