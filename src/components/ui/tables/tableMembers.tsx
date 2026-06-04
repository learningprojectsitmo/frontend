import { Ellipsis, Mail, Linkedin, ExternalLink, UserMinus } from "lucide-react";
import { type Member } from "@/types/tables/forTables";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { cn } from "@/lib/utils";

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

function isStringContacts(
    c: string | { telegram?: string | null; email?: string | null; linkedin?: string | null },
): c is string {
    return typeof c === "string";
}

interface TableProps {
    headerList: string[];
    members: Member[] | [];
    removeMember?: (id: number) => void;
    showProject?: boolean;
    showStatus?: boolean;
    onRowClick?: (member: Member) => void;
}

export const TableMembers = ({
    headerList,
    members,
    removeMember,
    showProject = false,
    showStatus = false,
    onRowClick,
}: TableProps) => {
    return (
        <div className="w-full overflow-hidden rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-app-text border-b border-[#E5E7EB] sticky top-0 bg-[#FAFAFA] z-10">
                        <tr>
                            {headerList.map((header) => (
                                <th
                                    key={header}
                                    className={cn(
                                        "px-6 h-14 text-[15px] font-sans font-semibold whitespace-nowrap",
                                        (header === "Резюме" || header === "Дата добавления") &&
                                            "hidden md:table-cell",
                                        header === "Контакты" && "hidden sm:table-cell",
                                    )}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E5E7EB] text-[13px] font-sans font-medium">
                        {members.map((member) => (
                            <tr
                                key={member.id}
                                className={cn(
                                    "h-16 hover:bg-[#FAFAFA] transition",
                                    onRowClick && "cursor-pointer",
                                )}
                                onClick={() => onRowClick?.(member)}
                            >
                                <td className="px-6 py-4">
                                    {member.avatarUrl ? (
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.avatarUrl}
                                                className="flex h-9 w-9 rounded-full bg-gray-100"
                                            />
                                            <span className="text-app-text font-sans">
                                                {member.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5E7EB] text-sm font-semibold text-app-text">
                                                {getInitials(member.name)}
                                            </div>
                                            <span className="text-app-text font-sans">
                                                {member.name}
                                            </span>
                                        </div>
                                    )}
                                </td>

                                {showProject && (
                                    <td className="px-6 py-4 text-app-text font-sans">
                                        {member.projects && member.projects.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {member.projects.map((p) => (
                                                    <span
                                                        key={p.id}
                                                        className="text-[#2563EB] font-medium"
                                                    >
                                                        {p.title}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[#9CA3AF]">—</span>
                                        )}
                                    </td>
                                )}

                                <td className="px-6 py-4 text-app-text font-sans">{member.role}</td>

                                <td className="px-6 py-4 text-app-text font-sans hidden sm:table-cell">
                                    {isStringContacts(member.contacts) ? (
                                        member.contacts
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {member.contacts.telegram && (
                                                <a
                                                    href={`https://t.me/${member.contacts.telegram.replace("@", "")}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-blue-500 hover:text-blue-700 text-xs"
                                                    title="Telegram"
                                                >
                                                    tg
                                                </a>
                                            )}
                                            {member.contacts.email && (
                                                <a
                                                    href={`mailto:${member.contacts.email}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            )}
                                            {member.contacts.linkedin && (
                                                <a
                                                    href={member.contacts.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <Linkedin className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </td>

                                <td className="px-6 py-4 hidden md:table-cell">
                                    {member.resumeUrl ? (
                                        <a
                                            href={member.resumeUrl}
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            Открыть
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-app-text font-sans hidden md:table-cell">
                                    {member.dateAdded}
                                </td>

                                {showStatus && (
                                    <td className="px-6 py-4">
                                        {member.status === "delete" ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-red-500">
                                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                                Удалён
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-500">
                                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                                Активен
                                            </span>
                                        )}
                                    </td>
                                )}

                                <td className="px-6 py-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 rounded-md hover:bg-gray-100 transition"
                                            >
                                                <Ellipsis className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {member.status === "delete" && (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeMember?.(member.id);
                                                    }}
                                                    className="text-[#EF4444]"
                                                >
                                                    <UserMinus className="h-4 w-4 mr-2" />
                                                    Удалить из пространства
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
