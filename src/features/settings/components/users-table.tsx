import type { User } from "../types";

interface UsersTableProps {
    users: User[];
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading: boolean;
}

export const UsersTable = ({ users, page, totalPages, onPageChange, loading }: UsersTableProps) => {
    if (loading) {
        return (
            <div className="text-center py-16 text-sm text-[--azure-46]">
                Загрузка пользователей...
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-16 text-sm text-[--azure-46]">
                Пользователи не найдены
            </div>
        );
    }

    const getPageNumbers = () => {
        const pages: (number | "...")[] = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    };

    return (
        <div>
            <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                <table className="w-full text-left">
                    <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                        <tr>
                            <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                №
                            </th>
                            <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                ФИО
                            </th>
                            <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                Email
                            </th>
                            <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                Роль
                            </th>
                            <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                Номер ИСУ
                            </th>
                            <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                Telegram
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-black-10]">
                        {users.map((user, index) => (
                            <tr key={user.id} className="hover:bg-[--grey-96] transition-colors">
                                <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                    {(page - 1) * users.length + index + 1}
                                </td>
                                <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                    {[user.last_name, user.first_name, user.middle_name]
                                        .filter(Boolean)
                                        .join(" ")}
                                </td>
                                <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                    {user.role_name}
                                </td>
                                <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                    {user.isu_number ?? "—"}
                                </td>
                                <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                    {user.tg_nickname ?? "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Назад
                    </button>

                    {getPageNumbers().map((p, idx) =>
                        p === "..." ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">
                                ...
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p)}
                                className={`w-8 h-8 text-sm font-medium rounded-[8px] transition-colors ${
                                    p === page
                                        ? "bg-[#2563EB] text-white"
                                        : "text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                {p}
                            </button>
                        ),
                    )}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Вперёд
                    </button>
                </div>
            )}
        </div>
    );
};
