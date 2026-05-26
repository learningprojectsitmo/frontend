import { ContentLayout } from "@/components/layouts";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { Link } from "react-router";
import { SpaceHeader } from "@/features/spaces/components/space-header";
import { SpaceProjectList } from "@/features/spaces/components/space-project-list";
import { Spinner } from "@/components/ui/spinner/spinner";
import { SpaceSettingsModal } from "@/features/spaces/components/space-settings-modal";
import { ShareSpaceModal } from "@/features/spaces/components/share-space-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { TableMembers } from "@/components/ui/tables/tableMembers";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpacesList, useWorkspaceParticipants, useRemoveWorkspaceParticipant } from "@/lib/spaces";
import { useProjectsList } from "@/lib/projects";
import { useUser } from "@/lib/auth";
import { toast } from "sonner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { type Member } from "@/types/tables/forTables";
import { type WorkspaceMember } from "@/types/api";

const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataSpaces, isLoading: isSpacesLoading } = useSpacesList();
    const { data: dataProjects, isLoading: isProjectsLoading, isError } = useProjectsList(urlId);
    const { data: user } = useUser();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const spaceData = dataSpaces?.spaces.find((space) => String(space.id) === urlId);
    const isAuthor = spaceData?.author_id === user?.id;

    // Participants state
    const workspaceId = spaceData?.id ?? 0;
    const [participantSearch, setParticipantSearch] = useState("");
    const [participantPage, setParticipantPage] = useState(1);
    const [projectFilter, setProjectFilter] = useState<string>("all");
    const limit = 10;

    const projectIdFilter = projectFilter && projectFilter !== "all" ? Number(projectFilter) : undefined;

    const {
        data: participantsData,
        isLoading: isParticipantsLoading,
        isError: isParticipantsError,
    } = useWorkspaceParticipants(workspaceId, {
        page: participantPage,
        limit,
        search: participantSearch || undefined,
        project_id: projectIdFilter,
    });

    const removeParticipantMutation = useRemoveWorkspaceParticipant();

    const handleRemoveParticipant = useCallback(
        (memberId: number) => {
            const member = participantsData?.items.find((m) => m.id === memberId);
            if (!member) return;
            removeParticipantMutation.mutate(
                { workspaceId, userId: member.user_id },
                {
                    onSuccess: () => {
                        toast.success("Участник удалён из пространства");
                    },
                    onError: () => {
                        toast.error("Не удалось удалить участника");
                    },
                },
            );
        },
        [workspaceId, participantsData, removeParticipantMutation],
    );

    // Transform WS participants to Member type
    const mappedMembers: Member[] = useMemo(() => {
        if (!participantsData?.items) return [];
        return participantsData.items.map((m: WorkspaceMember) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            contacts: m.contacts,
            resumeUrl: m.resume_url,
            dateAdded: m.created_at,
            avatarUrl: m.avatar_url ?? undefined,
            status: (isAuthor && m.user_id !== user?.id ? "delete" : "default") as "default" | "delete",
            projects: m.projects,
        }));
    }, [participantsData, isAuthor, user?.id]);

    // Project options for filter
    const projectOptions = useMemo(() => {
        if (!dataProjects?.items) return [];
        return dataProjects.items.map((p) => ({ value: String(p.id), label: p.name }));
    }, [dataProjects]);

    const totalParticipants = participantsData?.total ?? 0;
    const totalPages = participantsData?.total_pages ?? 0;

    const headerList = useMemo(() => {
        const base = ["Имя", "Роль", "Контакты", "Резюме", "Дата добавления"];
        if (projectOptions.length > 0) {
            base.splice(1, 0, "Проекты");
        }
        return base;
    }, [projectOptions]);

    if (!spaceData) {
        if (isSpacesLoading) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <Spinner size="lg" />
                </div>
            );
        }
        return (
            <ContentLayout title="Пространство не найдено">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">Пространство не найдено</p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title={spaceData.title}>
            <div className="mx-auto max-w-7xl p-6 flex flex-col gap-6">
                <Breadcrumb className="h-[34px] flex align-center">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app" className="font-sans font-medium text-[16px]">
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                {spaceData.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <SpaceHeader
                    spaceData={spaceData}
                    isAuthor={isAuthor}
                    onSettingsOpen={() => setSettingsOpen(true)}
                    onShareOpen={() => setShareOpen(true)}
                />

                <SpaceProjectList
                    projects={dataProjects?.items || []}
                    total={dataProjects?.total || 0}
                    isLoading={isProjectsLoading}
                    isError={isError}
                />

                {/* Participants section */}
                <section className="pt-4">
                    <div className="mb-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Список участников ({totalParticipants})
                            </h2>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="font-sans"
                                    onClick={() => setShareOpen(true)}
                                >
                                    Пригласить
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="px-2">
                                            <Ellipsis className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Экспорт списка</DropdownMenuItem>
                                        <DropdownMenuItem>Импорт участников</DropdownMenuItem>
                                        <DropdownMenuItem>Массовое удаление</DropdownMenuItem>
                                        <DropdownMenuItem>Настройки ролей</DropdownMenuItem>
                                        <DropdownMenuItem>Управление доступами</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <SearchBar
                                placeholder="Поиск участников"
                                onChange={setParticipantSearch}
                                value={participantSearch}
                                className="w-[280px]"
                            />

                            {projectOptions.length > 0 && (
                                <Select
                                    value={projectFilter}
                                    onValueChange={(v) => {
                                        setProjectFilter(v);
                                        setParticipantPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Все проекты" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все проекты</SelectItem>
                                        {projectOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    {isParticipantsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner size="lg" />
                        </div>
                    ) : isParticipantsError ? (
                        <div className="text-center py-16 text-red-400 text-sm">
                            Не удалось загрузить участников. Попробуйте обновить страницу.
                        </div>
                    ) : mappedMembers.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            {participantSearch || projectFilter !== "all"
                                ? "Участники не найдены"
                                : "В этом пространстве пока нет участников"}
                        </div>
                    ) : (
                        <>
                            <TableMembers
                                headerList={headerList}
                                members={mappedMembers}
                                removeMember={handleRemoveParticipant}
                                showProject
                            />

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => setParticipantPage((p) => Math.max(1, p - 1))}
                                        disabled={participantPage <= 1}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Назад
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(
                                            (p) =>
                                                p === 1 ||
                                                p === totalPages ||
                                                Math.abs(p - participantPage) <= 1,
                                        )
                                        .map((p, idx, arr) => (
                                            <span key={p} className="flex items-center">
                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                    <span className="px-1 text-gray-400">...</span>
                                                )}
                                                <button
                                                    onClick={() => setParticipantPage(p)}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                                                        p === participantPage
                                                            ? "bg-blue-600 text-white"
                                                            : "text-gray-600 border border-gray-200 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            </span>
                                        ))}

                                    <button
                                        onClick={() =>
                                            setParticipantPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={participantPage >= totalPages}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Вперёд
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            <SpaceSettingsModal
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                space={spaceData}
            />
            <ShareSpaceModal open={shareOpen} onOpenChange={setShareOpen} spaceId={spaceData.id} />
        </ContentLayout>
    );
};

export default SpaceRoute;
