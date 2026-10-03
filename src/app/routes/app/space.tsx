import { ContentLayout } from "@/components/layouts";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Link } from "react-router";
import { SpaceHeader } from "@/features/spaces/components/space-header";
import { SpaceProjectList } from "@/features/spaces/components/space-project-list";
import { SpaceResumeSection } from "@/features/spaces/components/space-resume-section";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ShareSpaceModal } from "@/features/spaces/components/share-space-modal";
import {
    ParticipantFilters,
    emptyParticipantFilters,
    type ParticipantFiltersState,
} from "@/features/spaces/components/filters/participant-filters";
import { selectedValuesToParam } from "@/features/spaces/components/filters/filter-params";
import { projectFiltersToParams } from "@/features/spaces/components/filters/project-filter-params";
import {
    defaultFiltersState,
    type FiltersState,
    type ProjectFilterOptions,
} from "@/features/spaces/components/filters/types";
import { SearchBar } from "@/components/ui/search-bar";
import { TableMembers } from "@/components/ui/tables/tableMembers";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuShortcut,
} from "@/components/ui/dropdown/dropdown-menu";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    useSpacesList,
    useWorkspaceParticipants,
    useWorkspaceResumes,
    useWorkspaceResumeFilters,
    useRemoveWorkspaceParticipant,
    useSpaceSettings,
    type ResumeParams,
} from "@/lib/spaces";
import {
    useProjectsList,
    useProjectFilters,
    useCreateProject,
    useProjectTypes,
} from "@/lib/projects";
import { useUser } from "@/lib/auth";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { ProjectsListParams } from "@/lib/query-keys";
import { ROLE_LABELS, useRoles } from "@/lib/roles";
import { normalizeResumeHref } from "@/lib/resume";
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

// ── Main Route ──
const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataSpaces, isLoading: isSpacesLoading } = useSpacesList();
    const { data: rolesData } = useRoles();
    const { data: user } = useUser();

    const [shareOpen, setShareOpen] = useState(false);

    const spaceData = dataSpaces?.spaces.find((space) => String(space.id) === urlId);
    const isAuthor = spaceData?.author_id === user?.id;

    const createProjectMutation = useCreateProject();
    const projectTypes = useProjectTypes(spaceData?.id);
    const navigate = useNavigate();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const handleCreateProject = useCallback(
        (typeId: number | null) => {
            if (!spaceData) return;
            createProjectMutation.mutate(
                {
                    name: "Новый проект",
                    description: "",
                    workspace_id: spaceData.id,
                    project_type_id: typeId,
                },
                {
                    onSuccess: (data) => {
                        navigate(`/app/project?id=${data.id}&edit=true`);
                    },
                    onError: () => {
                        toast.error("Не удалось создать проект");
                    },
                },
            );
        },
        [spaceData, createProjectMutation, navigate],
    );

    // Participants state
    const workspaceId = spaceData?.id ?? 0;
    const { data: spaceSettings } = useSpaceSettings(workspaceId, !!spaceData);
    const isPrivate = spaceSettings?.visibility === "private";
    // Projects state — фильтры и постраничность живут на сервере, поэтому любое
    // их изменение возвращает список на первую страницу.
    const [projectSearch, setProjectSearch] = useState("");
    const debouncedProjectSearch = useDebouncedValue(projectSearch, 300);
    const [projectFilters, setProjectFilters] = useState<FiltersState>(defaultFiltersState);
    const [projectPage, setProjectPage] = useState(1);
    const projectLimit = 10;

    const { data: projectFacets } = useProjectFilters(workspaceId);

    const projectFilterOptions = useMemo<ProjectFilterOptions>(
        () => ({
            statuses: projectFacets?.statuses || [],
            tags: projectFacets?.tags || [],
            members: projectFacets?.members || [],
        }),
        [projectFacets],
    );

    const projectParams: ProjectsListParams = {
        page: projectPage,
        limit: projectLimit,
        search: debouncedProjectSearch || undefined,
        ...projectFiltersToParams(projectFilters, projectFilterOptions),
    };

    const {
        data: dataProjects,
        isLoading: isProjectsLoading,
        isError,
    } = useProjectsList(urlId, projectParams);

    const handleProjectSearchChange = useCallback((value: string) => {
        setProjectSearch(value);
        setProjectPage(1);
    }, []);

    const handleProjectFiltersChange = useCallback((next: FiltersState) => {
        setProjectFilters(next);
        setProjectPage(1);
    }, []);

    const handleProjectFiltersReset = useCallback(() => {
        setProjectFilters(defaultFiltersState);
        setProjectPage(1);
    }, []);

    const handleProjectPageChange = useCallback((page: number) => {
        setProjectPage(page);
    }, []);

    const [participantSearch, setParticipantSearch] = useState("");
    const [participantPage, setParticipantPage] = useState(1);
    const [participantFilters, setParticipantFilters] =
        useState<ParticipantFiltersState>(emptyParticipantFilters);
    const limit = 10;

    // Опции фильтра участников — из справочника пространства: страница проектов
    // пагинируется и не содержит всех проектов пространства.
    const projectOptions = useMemo(() => {
        return (projectFacets?.projects || []).map((p) => ({ value: String(p.id), label: p.name }));
    }, [projectFacets]);

    // Role options for filter — берём справочник ролей, а не хардкод, чтобы новые
    // роли из админки подхватывались автоматически.
    const roleOptions = useMemo(() => {
        if (!rolesData?.items) return [];
        return rolesData.items.map((r) => ({
            value: String(r.id),
            label: ROLE_LABELS[r.name] ?? r.name,
        }));
    }, [rolesData]);

    const {
        data: participantsData,
        isLoading: isParticipantsLoading,
        isError: isParticipantsError,
    } = useWorkspaceParticipants(workspaceId, {
        page: participantPage,
        limit,
        search: participantSearch || undefined,
        project_ids: selectedValuesToParam(participantFilters.projects, projectOptions)?.map(
            Number,
        ),
        without_project: participantFilters.withoutProject,
        role_ids: selectedValuesToParam(participantFilters.roles, roleOptions)?.map(Number),
        has_resume:
            participantFilters.resume === "any" ? undefined : participantFilters.resume === "with",
        date_from: participantFilters.dateFrom || undefined,
        date_to: participantFilters.dateTo || undefined,
    });

    // Resume filters state
    const [resumeSearch, setResumeSearch] = useState("");
    const debouncedResumeSearch = useDebouncedValue(resumeSearch, 300);
    const [selectedResumeSkills, setSelectedResumeSkills] = useState<string[]>([]);
    const [selectedResumeInterests, setSelectedResumeInterests] = useState<string[]>([]);
    const [resumePage, setResumePage] = useState(1);
    const resumeLimit = 10;

    const resumeParams: ResumeParams = {
        page: resumePage,
        limit: resumeLimit,
        search: debouncedResumeSearch || undefined,
        skills: selectedResumeSkills.length > 0 ? selectedResumeSkills : undefined,
        interests: selectedResumeInterests.length > 0 ? selectedResumeInterests : undefined,
        // На странице пространства у участника показываем только основное
        // резюме, иначе список распухнет на число его резюме.
        defaultOnly: true,
    };

    const { data: resumesData, isLoading: isResumesLoading } = useWorkspaceResumes(
        workspaceId,
        resumeParams,
    );
    const { data: resumeFiltersData } = useWorkspaceResumeFilters(workspaceId);

    const handleResumeFiltersReset = useCallback(() => {
        setSelectedResumeSkills([]);
        setSelectedResumeInterests([]);
        setResumePage(1);
    }, []);

    const handleResumeSearchChange = useCallback((value: string) => {
        setResumeSearch(value);
        setResumePage(1);
    }, []);

    const handleResumeSkillsChange = useCallback((skills: string[]) => {
        setSelectedResumeSkills(skills);
        setResumePage(1);
    }, []);

    const handleResumeInterestsChange = useCallback((interests: string[]) => {
        setSelectedResumeInterests(interests);
        setResumePage(1);
    }, []);

    const handleResumePageChange = useCallback((page: number) => {
        setResumePage(page);
    }, []);

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
            userId: m.user_id,
            name: m.name,
            role: ROLE_LABELS[m.role] ?? m.role,
            workspaceRole: m.workspace_role,
            contacts: m.contacts,
            resumeUrl: normalizeResumeHref(m.resume_url),
            dateAdded: m.created_at,
            avatarUrl: m.avatar_url ?? undefined,
            status: (isAuthor && m.user_id !== user?.id ? "delete" : "default") as
                | "default"
                | "delete",
            projects: m.projects,
        }));
    }, [participantsData, isAuthor, user?.id]);

    const isManager =
        participantsData?.items.find((m) => m.user_id === user?.id)?.workspace_role === "manager" ||
        participantsData?.items.find((m) => m.user_id === user?.id)?.workspace_role === "admin" ||
        participantsData?.items.find((m) => m.user_id === user?.id)?.workspace_role === "teacher";

    const hasCreatedProject = dataProjects?.items.some((p) => p.author_id === user?.id) ?? false;

    const canCreateProject = isManager && !hasCreatedProject;

    const totalParticipants = participantsData?.total ?? 0;
    const totalPages = participantsData?.total_pages ?? 0;

    const hasActiveFilters = Boolean(
        participantSearch ||
        participantFilters.projects.length > 0 ||
        participantFilters.withoutProject ||
        participantFilters.roles.length > 0 ||
        participantFilters.resume !== "any" ||
        participantFilters.dateFrom ||
        participantFilters.dateTo,
    );

    const handleParticipantFiltersChange = useCallback((next: ParticipantFiltersState) => {
        setParticipantFilters(next);
        setParticipantPage(1);
    }, []);

    const handleParticipantFiltersReset = useCallback(() => {
        setParticipantFilters(emptyParticipantFilters);
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
            <div className="mx-auto max-w-7xl p-4 sm:p-8 flex flex-col gap-6 sm:gap-8">
                <Breadcrumb className="min-h-[34px] flex flex-wrap gap-y-1.5 items-center">
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
                    onSettingsOpen={() => navigate(`/app/space/settings?id=${spaceData.id}`)}
                    onShareOpen={() => setShareOpen(true)}
                    onCreateProject={() => setCreateDialogOpen(true)}
                />

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>Новый проект</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-gray-600 mt-2">
                            Выберите тип проекта. Он определит набор этапов выполнения.
                        </p>
                        <div className="space-y-2 mt-3">
                            {spaceSettings?.require_project_type_on_create === false && (
                                <button
                                    type="button"
                                    onClick={() => handleCreateProject(null)}
                                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-app-surface hover:border-gray-300"
                                >
                                    <span className="text-[14px] font-semibold text-gray-900">
                                        Без типа
                                    </span>
                                </button>
                            )}
                            {projectTypes.data?.map((pt) => (
                                <button
                                    key={pt.id}
                                    type="button"
                                    onClick={() => handleCreateProject(pt.id)}
                                    className="w-full text-left p-3 rounded-xl border border-gray-200 bg-app-surface hover:border-gray-300"
                                >
                                    <div className="text-[14px] font-semibold text-gray-900">
                                        {pt.name}
                                    </div>
                                    {pt.stages && pt.stages.length > 0 && (
                                        <div className="text-[12px] text-gray-500 mt-1">
                                            Этапы: {pt.stages.map((s) => s.name).join(" → ")}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <SpaceProjectList
                    projects={dataProjects?.items || []}
                    total={dataProjects?.total || 0}
                    page={projectPage}
                    totalPages={dataProjects?.total_pages || 0}
                    onPageChange={handleProjectPageChange}
                    isLoading={isProjectsLoading}
                    isError={isError}
                    search={projectSearch}
                    onSearchChange={handleProjectSearchChange}
                    filters={projectFilters}
                    onFiltersChange={handleProjectFiltersChange}
                    onFiltersReset={handleProjectFiltersReset}
                    filterOptions={projectFilterOptions}
                />

                <SpaceResumeSection
                    items={resumesData?.items || []}
                    isLoading={isResumesLoading}
                    workspaceId={workspaceId}
                    isPrivate={isPrivate}
                    search={resumeSearch}
                    onSearchChange={handleResumeSearchChange}
                    selectedSkills={selectedResumeSkills}
                    onSkillsChange={handleResumeSkillsChange}
                    selectedInterests={selectedResumeInterests}
                    onInterestsChange={handleResumeInterestsChange}
                    availableSkills={resumeFiltersData?.skills || []}
                    availableInterests={resumeFiltersData?.interests || []}
                    onResetFilters={handleResumeFiltersReset}
                    total={resumesData?.total ?? 0}
                    page={resumePage}
                    totalPages={resumesData?.total_pages ?? 0}
                    onPageChange={handleResumePageChange}
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

                                <ParticipantFilters
                                    state={participantFilters}
                                    onChange={handleParticipantFiltersChange}
                                    onReset={handleParticipantFiltersReset}
                                    projectOptions={projectOptions}
                                    roleOptions={roleOptions}
                                />

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
                            {hasActiveFilters
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

            <ShareSpaceModal open={shareOpen} onOpenChange={setShareOpen} spaceId={spaceData.id} />
        </ContentLayout>
    );
};

export default SpaceRoute;
