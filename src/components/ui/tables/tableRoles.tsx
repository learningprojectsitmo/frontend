import type { Role } from "@/types/tables/forTables";

interface TableRolesProps {
    headerList: string[];
    roles: Role[];
}

export const TableRoles = ({ headerList, roles }: TableRolesProps) => {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-[#0A0A0A] text-sm text-black-500 border-b border-gray-200">
                    <tr>
                        {headerList.map((header) => (
                            <th className="px-6 py-4 text-[17px]">{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {roles.map((role) => (
                        <tr className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-black-200 text-[15px]">{role.nameRole}</td>
                            <td className="px-6 py-4 text-black-200">
                                <ul className="list-disc pl-5 text-[13px]">
                                    {role.responsibilities.map((item) => (
                                        <li>{item}</li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4 text-black-200 text-[15px]">{role.numberOfMembers}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
