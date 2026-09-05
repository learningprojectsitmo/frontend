import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner/spinner";
import { settingsApi } from "@/lib/settings";

const formatDate = (value: string): string => new Date(value).toLocaleString("ru-RU");

export const SessionsTab = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["settings-sessions"],
        queryFn: () => settingsApi.getSessions(),
    });

    const terminate = useMutation({
        mutationFn: (sessionId: string) => settingsApi.terminateSessions([sessionId]),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings-sessions"] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="text-center py-16 text-sm text-[--azure-46]">
                Не удалось загрузить список сессий
            </div>
        );
    }

    const sessions = data.sessions;

    return (
        <div className="space-y-6">
            <div className="text-sm text-[--azure-46]">
                Здесь показаны активные сессии вашего аккаунта. Завершите сессию, чтобы выйти на
                удалённом устройстве.
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                    Активных сессий нет
                </div>
            ) : (
                <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                    <table className="w-full text-left">
                        <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                            <tr>
                                <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                    Устройство
                                </th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                    IP-адрес
                                </th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                    Статус
                                </th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                    Последняя активность
                                </th>
                                <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                    Действие
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[--color-black-10]">
                            {sessions.map((session) => {
                                const isCurrent = session.id === data.current_session_id;
                                return (
                                    <tr
                                        key={session.id}
                                        className="hover:bg-[--grey-96] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {[
                                                session.device_name,
                                                session.browser_name,
                                                session.operating_system,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ") || "Неизвестное устройство"}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {session.ip_address ?? "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={
                                                    isCurrent
                                                        ? "text-sm font-medium text-[#2563EB]"
                                                        : "text-sm font-medium text-green-600"
                                                }
                                            >
                                                {isCurrent ? "текущая сессия" : "активная"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {formatDate(session.last_activity)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="outlineSoft"
                                                size="hug36"
                                                onClick={() => terminate.mutate(session.id)}
                                                disabled={isCurrent || terminate.isPending}
                                                title={
                                                    isCurrent
                                                        ? "Нельзя завершить текущую сессию"
                                                        : undefined
                                                }
                                            >
                                                Завершить
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
