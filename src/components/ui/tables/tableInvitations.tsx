import type { Replycant } from "@/types/tables/forTables";

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

interface TableInvitationsProps {
    headerList: string[];
    members: Replycant[];
    addToTeam?: (id: number) => void;
    onReject?: (id: number) => void;
    canManage?: boolean;
    currentUserId?: number;
    onAcceptInvitation?: (id: number) => void;
    onRejectInvitation?: (id: number) => void;
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
}: TableInvitationsProps) => {
    const typeLabels: Record<string, string> = {
        response: "Отклик",
        invitation: "Приглашение",
    };

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-app-surface">
            <table className="w-full text-left">
                <thead className="text-gray-900 text-black-500 border-b border-gray-200">
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

                <tbody className="divide-y divide-gray-200 text-[13px] font-sans font-medium">
                    {members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                                {member.avatarUrl ? (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member.avatarUrl}
                                            className="flex h-10 w-10 rounded-full bg-gray-100"
                                        />
                                        <span className="text-gray-900">{member.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                                            {getInitials(member.name)}
                                        </div>
                                        <span className="text-gray-900">{member.name}</span>
                                    </div>
                                )}
                            </td>

                            <td className="px-6 py-4 text-gray-900">{member.role || "—"}</td>

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

                            <td className="px-6 py-4 text-gray-900">{member.contacts}</td>

                            <td className="px-6 py-4">
                                <a
                                    href={member.resumeUrl}
                                    className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Открыть
                                </a>
                            </td>

                            <td className="px-6 py-4 text-gray-900">{member.responseDate}</td>

                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {member.type === "response" && canManage && (
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
                                    {member.type === "response" && !canManage && (
                                        <span className="text-gray-400 text-[12px]">
                                            Ожидает решения
                                        </span>
                                    )}
                                    {member.type === "invitation" &&
                                        member.userId === currentUserId && (
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
                                        member.userId !== currentUserId && (
                                            <span className="text-gray-400 text-[12px]">
                                                Приглашение отправлено
                                            </span>
                                        )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
