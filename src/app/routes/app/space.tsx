import { ContentLayout } from "@/components/layouts";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Link } from "react-router";
import { SpaceHeader } from "@/features/spaces/components/space-header";
import { SpaceProjectList } from "@/features/spaces/components/space-project-list";
import { SpaceResumeSection } from "@/features/spaces/components/space-resume-section";
import { Spinner } from "@/components/ui/spinner/spinner";
import { SpaceSettingsModal } from "@/features/spaces/components/space-settings-modal";
import { ShareSpaceModal } from "@/features/spaces/components/share-space-modal";
import { CreateProjectModal } from "@/features/spaces/components/create-project-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { TableMembers } from "@/components/ui/tables/tableMembers";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuShortcut,
} from "@/components/ui/dropdown/dropdown-menu";
import { Search, Check, X, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    useSpacesList,
    useWorkspaceParticipants,
    useWorkspaceResumes,
    useRemoveWorkspaceParticipant,
    useSpaceSettings,
} from "@/lib/spaces";
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

// ── Filter Dropdown Component ──
type FilterDropdownProps = {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    onReset: () => void;
};

function FilterDropdown({ options, selected, onChange, onReset }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
    );

    const allSelected = selected.length === options.length;

    const toggleAll = () => {
        if (allSelected) {
            onChange([]);
        } else {
            onChange(options.map((o) => o.value));
        }
    };

    const handleReset = () => {
        onReset();
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            {open && (
                <div className="absolute top-full mt-2 right-0 z-50 w-[320px] bg-app-surface border border-gray-200 rounded-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[14px] font-semibold text-app-text">
                            Проект {selected.length > 0 ? `(${selected.length})` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-[13px] text-[#2563EB] font-medium hover:text-[#1d4ed8]"
                            >
                                {allSelected ? "Снять все" : "Выбрать все"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-md"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Search inside dropdown */}
                    <div className="relative mb-2">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Поиск"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 bg-app-surface border border-gray-200 rounded-[10px] text-[13px] text-app-text placeholder:text-gray-400 outline-none focus:border-[#2563EB]"
                        />
                    </div>

                    {/* Checkbox rows */}
                    <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                        {filteredOptions.map((opt) => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-3 h-10 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div
                                    className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center transition-colors ${
                                        selected.includes(opt.value)
                                            ? "bg-[#2563EB] border-[#2563EB]"
                                            : "border-gray-300"
                                    }`}
                                >
                                    {selected.includes(opt.value) && (
                                        <Check size={12} className="text-white" />
                                    )}
                                </div>
                                <span className="text-[13px] text-app-text font-medium">
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                        {filteredOptions.length === 0 && (
                            <p className="text-[13px] text-app-muted text-center py-4">
                                Не найдено
                            </p>
                        )}
                    </div>

                    {/* Reset button */}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="w-full mt-3 text-[13px] font-medium text-[#EF4444] hover:text-[#DC2626] transition-colors text-center"
                    >
                        Сбросить
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Route ──
const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataSpaces, isLoading: isSpacesLoading } = useSpacesList();
    const { data: dataProjects, isLoading: isProjectsLoading, isError } = useProjectsList(urlId);
    const { data: user } = useUser();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);

    const spaceData = dataSpaces?.spaces.find((space) => String(space.id) === urlId);
    const isAuthor = spaceData?.author_id === user?.id;

    // Participants state
    const workspaceId = spaceData?.id ?? 0;
    const { data: spaceSettings } = useSpaceSettings(workspaceId, !!spaceData);
    const isPrivate = spaceSettings?.visibility === "private";
    const [participantSearch, setParticipantSearch] = useState("");
    const [participantPage, setParticipantPage] = useState(1);
    const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
    const limit = 10;

    const projectIdFilter = selectedProjects.length === 1 ? Number(selectedProjects[0]) : undefined;

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

    const { data: resumesData, isLoading: isResumesLoading } = useWorkspaceResumes(workspaceId);

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
            status: (isAuthor && m.user_id !== user?.id ? "delete" : "default") as
                | "default"
                | "delete",
            projects: m.projects,
        }));
    }, [participantsData, isAuthor, user?.id]);

    const isManager =
        participantsData?.items.find((m) => m.user_id === user?.id)?.role === "manager";

    const hasCreatedProject = dataProjects?.items.some((p) => p.author_id === user?.id) ?? false;

    const canCreateProject = isManager && !hasCreatedProject;

    // Project options for filter
    const projectOptions = useMemo(() => {
        if (!dataProjects?.items) return [];
        return dataProjects.items.map((p) => ({ value: String(p.id), label: p.name }));
    }, [dataProjects]);

    const totalParticipants = participantsData?.total ?? 0;
    const totalPages = participantsData?.total_pages ?? 0;

    const handleFilterReset = useCallback(() => {
        setSelectedProjects([]);
        setParticipantPage(1);
    }, []);

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
                    <p className="text-app-muted text-lg">Пространство не найдено</p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title={spaceData.title}>
            <div className="mx-auto max-w-7xl p-8 flex flex-col gap-8">
                <Breadcrumb className="h-[34px] flex align-center">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link
                                    to="/app"
                                    className="font-sans font-medium text-[16px] text-app-muted"
                                >
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
                    canCreateProject={canCreateProject}
                    isManager={isManager}
                    hasCreatedProject={hasCreatedProject}
                    onSettingsOpen={() => setSettingsOpen(true)}
                    onShareOpen={() => setShareOpen(true)}
                    onCreateProject={() => setCreateProjectOpen(true)}
                />

                <SpaceProjectList
                    projects={dataProjects?.items || []}
                    total={dataProjects?.total || 0}
                    isLoading={isProjectsLoading}
                    isError={isError}
                />

                <SpaceResumeSection
                    items={resumesData?.items || []}
                    isLoading={isResumesLoading}
                    workspaceId={workspaceId}
                    isPrivate={isPrivate}
                />

                {/* Participants section */}
                <section className="mt-14">
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-[32px] font-bold text-app-text leading-tight shrink-0">
                                Список участников ({totalParticipants})
                            </h2>

                            <div className="flex items-center gap-3 flex-wrap">
                                <SearchBar
                                    placeholder="Поиск участников"
                                    onChange={setParticipantSearch}
                                    value={participantSearch}
                                    className="w-[200px]"
                                />

                                {projectOptions.length > 0 && (
                                    <FilterDropdown
                                        options={projectOptions}
                                        selected={selectedProjects}
                                        onChange={(v) => {
                                            setSelectedProjects(v);
                                            setParticipantPage(1);
                                        }}
                                        onReset={handleFilterReset}
                                    />
                                )}

                                {isAuthor && (
                                    <Button
                                        variant="dark"
                                        size="hug36"
                                        className="font-sans text-[13px] font-semibold"
                                        onClick={() => setShareOpen(true)}
                                    >
                                        Пригласить
                                    </Button>
                                )}

                                {isAuthor && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="hug36" className="px-2">
                                                <Ellipsis className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[220px]">
                                            <DropdownMenuItem disabled>
                                                Экспорт списка
                                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                Импорт участников
                                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                Массовое удаление
                                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                Настройки ролей
                                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled>
                                                Управление доступами
                                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
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
                        <div className="text-center py-16 text-app-muted text-sm">
                            {participantSearch || selectedProjects.length > 0
                                ? "Участники не найдены"
                                : "В этом пространстве пока нет участников"}
                        </div>
                    ) : (
                        <>
                            <TableMembers
                                members={mappedMembers}
                                removeMember={handleRemoveParticipant}
                                showProject
                            />

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <button
                                        onClick={() =>
                                            setParticipantPage((p) => Math.max(1, p - 1))
                                        }
                                        disabled={participantPage <= 1}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                                    <span className="px-1 text-gray-400 text-sm">
                                                        ...
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setParticipantPage(p)}
                                                    className={`w-8 h-8 text-sm font-medium rounded-[8px] transition-colors ${
                                                        p === participantPage
                                                            ? "bg-[#2563EB] text-white"
                                                            : "text-gray-500 hover:bg-gray-50"
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
                                        className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            <CreateProjectModal
                open={createProjectOpen}
                onOpenChange={setCreateProjectOpen}
                workspaceId={spaceData.id}
            />
        </ContentLayout>
    );
};

export default SpaceRoute;
