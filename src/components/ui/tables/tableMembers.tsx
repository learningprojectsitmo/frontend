import { type Member } from "@/types/tables/forTables";

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

interface TableProps {
    headerList: string[];
    members: Member[];
    removeMember: (id: string) => void;
}

export const TableMembers = ({ headerList, members, removeMember }: TableProps) => {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[#0A0A0A]  text-black-500 border-b border-gray-200">
                    <tr>
                        {headerList.map((header) => (
                            <th className="px-6 py-4 text-[17px]">{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 text-[15px]">
                    {members.map((member) => (
                        <tr className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                                {member.avatarUrl ? (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member.avatarUrl}
                                            className="flex h-10 w-10 rounded-full bg-gray-100"
                                        />
                                        <span className="text-gray-900">
                                            {member.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                                            {getInitials(member.name)}
                                        </div>
                                        <span className="text-gray-900">
                                            {member.name}
                                        </span>
                                    </div>
                                )}
                            </td>

                            <td className="px-6 py-4 text-gray-900">{member.role}</td>

                            <td className="px-6 py-4 text-gray-900">{member.contacts}</td>

                            <td className="px-6 py-4">
                                <a
                                    href={member.resumeUrl}
                                    className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Open
                                </a>
                            </td>

                            <td className="px-6 py-4 text-gray-900">{member.dateAdded}</td>

                            <td className="px-6 py-4">
                                <button
                                    onClick={() => removeMember(member.id)}
                                    className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Remove from team
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
