import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStatusLabel } from "@/features/ideas/api";
import type { IdeaStatus } from "@/features/ideas/types";
import { useDeleteIdea, useIdeasList, ideasKeys } from "@/lib/api-ideas";
import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { api } from "@/lib/api-client";

const STATUS_OPTIONS: IdeaStatus[] = ["new", "planned", "declined", "implemented"];

const formatDate = (value: string): string => new Date(value).toLocaleString("ru-RU");

const AdminIdeasPage = () => {
    const queryClient = useQueryClient();
    const { data: ideas = [], isLoading } = useIdeasList();
    const deleteIdea = useDeleteIdea();

    const updateStatus = useMutation({
        mutationFn: ({ ideaId, status }: { ideaId: number; status: IdeaStatus }) =>
            api.put(`/ideas/${ideaId}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ideasKeys.lists() });
        },
    });

    return (
        <ContentLayout title="Идеи">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Идеи</h1>
                    <p className="text-sm text-[--azure-46]">
                        Модерация идей: смена статуса и удаление
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                ) : ideas.length === 0 ? (
                    <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                        Идей пока нет
                    </div>
                ) : (
                    <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                        <table className="w-full text-left">
                            <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                                <tr>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        #
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Название
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Автор
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Голоса
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Теги
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Статус
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Дата
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Удалить
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-black-10]">
                                {ideas.map((idea, index) => (
                                    <tr
                                        key={idea.id}
                                        className="hover:bg-[--grey-96] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                            {idea.title}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {idea.author?.username ?? `#${idea.author?.id ?? "—"}`}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {idea.votes}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {idea.tags.join(", ")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Select
                                                value={idea.status}
                                                onValueChange={(value) =>
                                                    updateStatus.mutate({
                                                        ideaId: idea.id,
                                                        status: value as IdeaStatus,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-40 h-8 text-[13px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {getStatusLabel(status)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {formatDate(idea.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="outlineSoft"
                                                size="hug36"
                                                className="h-8 px-2"
                                                icon={<Icon name="trash" size={16} />}
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            "Удалить идею? Действие необратимо.",
                                                        )
                                                    ) {
                                                        deleteIdea.mutate(idea.id);
                                                    }
                                                }}
                                                disabled={deleteIdea.isPending}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default AdminIdeasPage;
