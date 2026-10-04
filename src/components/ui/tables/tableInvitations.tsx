import { Link } from "react-router";
import { Fragment, useState } from "react";
import type { Replycant } from "@/types/tables/forTables";

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

interface TableInvitationsGroup {
    key: string;
    projectName: string;
    workspaceName?: string | null;
    items: Replycant[];
}

interface TableInvitationsProps {
    headerList: string[];
    members: Replycant[];
    addToTeam?: (id: number) => void;
    onReject?: (id: number) => void;
    canManage?: boolean;
    currentUserId?: number;
    onAcceptInvitation?: (id: number) => void;
    onRejectInvitation?: (id: number) => void;
    onConfirmJoin?: (id: number) => void;
    grouped?: boolean;
    groups?: TableInvitationsGroup[];
    defaultExpanded?: Record<string, boolean>;
    onToggleGroup?: (key: string) => void;
}

export const TableInvitations = ({
    headerList,
    members,
    addToTeam,
    onReject,
    canManage = false,
    currentUserId,
    onAcceptInvitation,
    onRejectInvitation,
    onConfirmJoin,
    grouped = false,
    groups = [],
    defaultExpanded,
    onToggleGroup,
}: TableInvitationsProps) => {
    const typeLabels: Record<string, string> = {
        response: "Отклик",
        invitation: "Приглашение",
    };

    const [internalExpanded, setInternalExpanded] = useState<Record<string, boolean>>(() => {
        if (defaultExpanded) return defaultExpanded;
        const initial: Record<string, boolean> = {};
        groups.forEach((g) => {
            initial[g.key] = true;
        });
        return initial;
    });

    const isExpanded = (key: string) => internalExpanded[key] ?? true;

    const toggleGroup = (key: string) => {
        setInternalExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
        onToggleGroup?.(key);
    };

    const renderRow = (member: Replycant) => (
        <tr key={member.id} className="hover:bg-app-ghost transition">
            <td className="px-6 py-4">
                {member.avatarUrl ? (
                    <div className="flex items-center gap-3">
                        <img
                            src={member.avatarUrl}
                            className="flex h-10 w-10 rounded-full bg-app-ghost"
                        />
                        <span className="text-app-text">{member.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-ghost text-sm font-semibold text-app-text">
                            {getInitials(member.name)}
                        </div>
                        <span className="text-app-text">{member.name}</span>
                    </div>
                )}
            </td>

            <td className="px-6 py-4 text-app-text">{member.role || "—"}</td>

            <td className="px-6 py-4">
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${
                        member.type === "response"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                    }`}
                >
                    {typeLabels[member.type] || member.type}
                </span>
            </td>

            <td className="px-6 py-4 text-app-text">{member.contacts}</td>

            <td className="px-6 py-4">
                {member.resumeUrl ? (
                    <Link
                        to={member.resumeUrl}
                        className="font-medium text-blue-600 hover:text-blue-700"
                    >
                        Открыть
                    </Link>
                ) : (
                    <span className="text-app-muted">—</span>
                )}
            </td>

            <td className="px-6 py-4 text-app-text">{member.responseDate}</td>

            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    {member.type === "response" &&
                        member.responseStatus === "accepted" &&
                        !member.busyInOtherProject && (
                            <>
                                {member.userId === currentUserId ? (
                                    <button
                                        onClick={() => onConfirmJoin?.(member.id)}
                                        className="font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Подтвердить участие
                                    </button>
                                ) : (
                                    <span className="text-app-muted text-[12px]">
                                        Ожидает подтверждения участника
                                    </span>
                                )}
                            </>
                        )}
                    {member.type === "response" && member.responseStatus === "in_team" && (
                        <span className="text-app-muted text-[12px]">
                            {member.busyInOtherProject ? "Уже в другой команде" : "Уже в команде"}
                        </span>
                    )}
                    {member.type === "response" &&
                        member.responseStatus !== "accepted" &&
                        member.responseStatus !== "in_team" &&
                        canManage && (
                            <>
                                <button
                                    onClick={() => addToTeam?.(member.id)}
                                    className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Принять
                                </button>
                                <button
                                    onClick={() => onReject?.(member.id)}
                                    className="font-medium text-red-500 hover:text-red-700"
                                >
                                    Отклонить
                                </button>
                            </>
                        )}
                    {member.type === "response" &&
                        member.responseStatus !== "accepted" &&
                        member.responseStatus !== "in_team" &&
                        !canManage && (
                            <span className="text-app-muted text-[12px]">Ожидает решения</span>
                        )}
                    {member.type === "invitation" &&
                        member.userId === currentUserId &&
                        member.responseStatus === "pending" &&
                        !member.busyInOtherProject && (
                            <>
                                <button
                                    onClick={() => onAcceptInvitation?.(member.id)}
                                    className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Принять
                                </button>
                                <button
                                    onClick={() => onRejectInvitation?.(member.id)}
                                    className="font-medium text-red-500 hover:text-red-700"
                                >
                                    Отклонить
                                </button>
                            </>
                        )}
                    {member.type === "invitation" &&
                        member.userId === currentUserId &&
                        member.responseStatus !== "pending" && (
                            <span className="text-app-muted text-[12px]">
                                {member.responseStatus === "in_team"
                                    ? member.busyInOtherProject
                                        ? "Уже в другой команде"
                                        : "Уже в команде"
                                    : member.responseStatus === "rejected"
                                      ? "Отклонено"
                                      : "В команде"}
                            </span>
                        )}
                    {member.type === "invitation" &&
                        member.userId !== currentUserId &&
                        member.responseStatus === "pending" && (
                            <span className="text-app-muted text-[12px]">
                                Приглашение отправлено
                            </span>
                        )}
                    {member.type === "invitation" &&
                        member.userId !== currentUserId &&
                        member.responseStatus !== "pending" && (
                            <span className="text-app-muted text-[12px]">
                                {member.responseStatus === "in_team"
                                    ? member.busyInOtherProject
                                        ? "Уже в другой команде"
                                        : "Уже в команде"
                                    : member.responseStatus === "rejected"
                                      ? "Отклонено"
                                      : "В команде"}
                            </span>
                        )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className="w-full overflow-x-auto rounded-2xl border border-app-border bg-app-surface">
            <table className="w-full text-left">
                <thead className="text-app-text border-b border-app-border">
                    <tr>
                        {headerList.map((header) => (
                            <th
                                key={header}
                                className="px-6 py-4 text-[15px] font-sans font-semibold"
                            >
                                {header}
                            </th>
                        ))}
                        <th className="px-6 py-4 text-[15px] font-sans font-semibold">Действия</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-app-border-light text-[13px] font-sans font-medium">
                    {!grouped && members.map((member) => renderRow(member))}
                    {grouped &&
                        groups.map((group) => {
                            const expanded = isExpanded(group.key);
                            const pendingCount = group.items.filter(
                                (m) => m.responseStatus === "pending",
                            ).length;
                            return (
                                <Fragment key={`group-${group.key}`}>
                                    <tr
                                        className="bg-app-background hover:bg-app-ghost transition cursor-pointer"
                                        onClick={() => toggleGroup(group.key)}
                                    >
                                        <td colSpan={headerList.length + 1} className="px-6 py-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <svg
                                                        className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-semibold text-app-text">
                                                            {group.projectName}
                                                        </span>
                                                        {group.workspaceName && (
                                                            <span className="text-[12px] text-app-muted">
                                                                Пространство: {group.workspaceName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-[12px] text-app-muted">
                                                    <span>Всего: {group.items.length}</span>
                                                    {pendingCount > 0 && (
                                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                                                            Ожидает: {pendingCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {expanded && group.items.map((member) => renderRow(member))}
                                </Fragment>
                            );
                        })}
                </tbody>
            </table>
        </div>
    );
};
