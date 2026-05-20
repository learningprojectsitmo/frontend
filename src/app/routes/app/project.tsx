import { ContentLayout } from "@/components/layouts";
import { Dot, Ellipsis, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useState, useMemo } from "react";
import { type IconName } from "@/components/ui/icons";
import { useProject } from "@/lib/projects";
import { useSpacesList } from "@/lib/spaces";
import { useSearchParams } from "react-router";
import { Plus, GraduationCapIcon } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { ProgressBar } from "@/components/ui/progress-bar/project-progress-bar";
import { IconButton } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner/spinner";

import { Link } from "react-router";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { TableMembers } from "@/components/ui/tables/tableMembers";
import { TableInvitations } from "@/components/ui/tables/tableInvitations";
import { type ProjectFullResponse, type Member, type Replycant } from "@/types/api";

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function mapBackendProject(p: ProjectFullResponse) {
    const statusName = p.status?.name || "Неизвестно";
    const isArchived = statusName === "archived";

    return {
        id: p.id,
        title: p.name,
        tag: statusName,
        tagVariant: (isArchived ? "disabled" : "info") as "disabled" | "info",
        description: p.description || "",
        progressValue: p.progress,
        dateText: p.deadline ? formatDate(p.deadline) : "",
        tags: p.tags.map((t) => ({ text: t })),
        membersCount: p.participants_count,
        users: p.participants_preview.map((u) => ({ name: u.full_name })),
        archived: isArchived,
        spaceId: p.workspace_id || 0,
        descriptionExtended: p.description || "",
        creationDate: formatDate(p.created_at),
        color: "bg-blue-500",
        roles: MOCK_ROLES,
        members: p.members.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            contacts: m.contacts,
            resumeUrl: m.resume_url,
            dateAdded: m.date_added,
            status: "default" as const,
        })),
        replycants: p.replycants.map((r) => ({
            id: r.id,
            name: r.name,
            priority: 0,
            contacts: r.contacts,
            resumeUrl: r.resume_url,
            responseDate: r.response_date,
            status: "invite" as const,
        })),
    };
}

type ProjectView = ReturnType<typeof mapBackendProject>;

const MOCK_ROLES: { title: string; tasks: string[]; count: number }[] = [
    {
        title: "Backend Developer",
        tasks: [
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
        ],
        count: 2,
    },
    {
        title: "Frontend Developer",
        tasks: [
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
            "Проектирование и реализация серверной логики платформы",
        ],
        count: 3,
    },
];

const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataProject, isLoading, error } = useProject(urlId);
    const { data: dataSpaces } = useSpacesList({ page: 1, limit: 10 });

    const project = dataProject ? mapBackendProject(dataProject) : null;

    const spaceTitle =
        dataSpaces?.spaces.find((space) => String(space.id) === String(project?.spaceId))?.title ||
        "";

    const [activeTab, setActiveTab] = useState("view");
    const [activeApplicantTab, setActiveApplicantTab] = useState("team");
    const [activeView, setActiveView] = useState("grid");

    const textTabs = [
        { value: "view", label: "Обзор проекта" },
        { value: "specification", label: "Техническое задание" },
        { value: "kanban", label: "Канбан-доска" },
        { value: "activity", label: "История активности" },
    ];

    const applicanttabs = [
        { value: "team", label: "Команда" },
        { value: "applications", label: "Отклики и приглашения" },
    ];

    const viewTabs = [
        { value: "grid", icon: "grid" as IconName },
        { value: "settings", icon: "settings" as IconName },
    ];

    const [search, setSearch] = useState("");
    const memberTitles = project?.members?.map((member) => member.name) || [];
    const replycantTitles = project?.replycants?.map((replycant) => replycant.name) || [];

    const memberRoles = project?.members?.map((member) => member.role) || [];

    const memberContacts = project?.members?.map((member) => member.contacts) || [];
    const replycantContacts =
        project?.replycants?.map((replycant) => replycant.contacts) || [];

    const memberSuggestions = [...memberTitles, ...memberContacts, ...memberRoles];

    const replycantSuggestions = [...replycantTitles, ...replycantContacts];

    const filteredMembers = useMemo(() => {
        if (!search) return project?.members || [];
        return (project?.members || []).filter(
            (member) =>
                member.name.toLowerCase().includes(search.toLowerCase()) ||
                member.contacts.toLowerCase().includes(search.toLowerCase()) ||
                member.role.toLowerCase().includes(search.toLowerCase()),
        );
    }, [project, search]);

    const filteredReplycants = useMemo(() => {
        if (!search) return project?.replycants || [];
        return (project?.replycants || []).filter(
            (replycant) =>
                replycant.name.toLowerCase().includes(search.toLowerCase()) ||
                replycant.contacts.toLowerCase().includes(search.toLowerCase()),
        );
    }, [project, search]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <ContentLayout title="Проект не найден">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">Проект не найден</p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title={project.title}>
            <div className="mx-auto max-w-7xl flex flex-col gap-6">
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
                            <BreadcrumbLink asChild>
                                <Link
                                    to={`/app/space?id=${project.spaceId}`}
                                    className="font-sans font-medium text-[16px]"
                                >
                                    {spaceTitle}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                {project.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="self-stretch inline-flex justify-between items-start">
                    <div className="flex justify-start items-start gap-5">
                        <div className="pt-1 flex justify-start items-center gap-2">
                            <div className="w-16 h-16 bg-color-azure-60 rounded-2xl flex justify-center items-center">
                                <div
                                    className={`${project.color} rounded-lg  text-white h-16 w-16 flex items-center justify-center`}
                                >
                                    <GraduationCapIcon size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="inline-flex flex-col justify-start items-start gap-0.5">
                            <div className="self-stretch inline-flex justify-start items-center gap-3">
                                <div className="justify-center text-color-grey-4 text-3xl font-semibold font-sans leading-9">
                                    {project.title}
                                </div>
                                <div
                                    data-status="In Progress"
                                    className="w-16 px-2 py-0.5 bg-[#2B7FFF] rounded-lg outline outline-1 outline-[#2B7FFF]  inline-flex justify-center items-center overflow-hidden"
                                >
                                    <div className="text-center justify-center text-white text-[11px] font-semibold font-sans leading-4 tracking-tight">
                                        {project.tag}
                                    </div>
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start">
                                <div className="justify-center text-[#4A5565] text-base font-medium font-sans leading-7">
                                    {project.description}
                                </div>
                            </div>
                            <div className="inline-flex justify-start items-center gap-3">
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <ProgressBar value={project.progressValue} />
                                    </div>
                                </div>
                                <div data-svg-wrapper className="relative">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="1.5"
                                            fill="var(--color-azure-46, #6A7282)"
                                        />
                                    </svg>
                                </div>
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <div className="justify-center text-[#4A5565] text-[13px] font-normal font-sans leading-5 tracking-tight">
                                            Создан: {project.creationDate}
                                        </div>
                                    </div>
                                </div>
                                <div data-svg-wrapper className="relative">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="1.5"
                                            fill="var(--color-azure-46, #6A7282)"
                                        />
                                    </svg>
                                </div>
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <div className="justify-center text-[#4A5565] text-[13px] font-normal font-sans leading-5 tracking-tight">
                                            Дедлайн: {project.dateText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {dataSpaces?.role !== "member" ? (
                            <Button
                                variant="dark"
                                size="hug36"
                                icon={<PencilLine size={18} />}
                                className="font-sans text-[13px] font-semibold gap-2"
                            >
                                Редактировать
                            </Button>
                        ) : (
                            ""
                        )}
                        <IconButton
                            variant="ghost"
                            icon={<Ellipsis size={20} />}
                            className="text-[--btn-outline-text]"
                        />
                    </div>
                </div>

                <section>
                    <Tabs
                        tabs={textTabs}
                        value={activeTab}
                        onValueChange={setActiveTab}
                        variant="text"
                    />
                </section>

                {activeTab === "view" && (
                    <>
                        <section className="self-stretch inline-flex flex-col justify-start items-start gap-2.5">
                            <div className="flex flex-col justify-start items-start">
                                <div className="justify-center text-[#0A0A0A] text-xl font-semibold font-sans leading-7">
                                    Описание проекта
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start gap-5">
                                <div className="self-stretch flex flex-col justify-start items-start">
                                    <div className="self-stretch justify-center text-[#4A5565] text-base font-medium font-sans leading-7">
                                        {project.descriptionExtended}
                                    </div>
                                </div>
                                <div className="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
                                    {project.tags.map((tag, index) => (
                                        <div
                                            key={index}
                                            className="h-5 px-2 py-0.5 bg-[#ECEEF2] rounded-lg outline outline-1 outline-[#ECEEF2] flex justify-center items-center overflow-hidden"
                                        >
                                            <div className="text-center justify-center text-[#030213] text-[11px] font-semibold font-sans leading-4 tracking-tight">
                                                {tag.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="self-stretch inline-flex flex-col justify-start items-start gap-6">
                            <div className="flex flex-col justify-start items-start">
                                <div className="justify-center text-[#0A0A0A] text-xl font-semibold font-sans leading-7">
                                    Необходимые участники
                                </div>
                            </div>
                            <div
                                data-type="Required participants"
                                className="self-stretch p-2.5 bg-[#FFFFFF] rounded-2xl outline outline-1  outline-[#0000001A] flex flex-col justify-start items-start gap-2.5"
                            >
                                <div className="self-stretch inline-flex justify-start items-center gap-5">
                                    <div className="w-48 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-[#0A0A0A] text-[15px] font-semibold font-sans leading-5">
                                            Роль
                                        </div>
                                    </div>
                                    <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-[#0A0A0A] text-[15px] font-semibold font-sans leading-5">
                                            Задачи
                                        </div>
                                    </div>
                                    <div className="w-48 px-1 py-2 flex justify-start items-center gap-2">
                                        <div className="justify-center text-[#0A0A0A] text-[15px] font-semibold font-sans leading-5">
                                            Количество участников
                                        </div>
                                    </div>
                                </div>
                                {project.roles.map((role) => (
                                    <>
                                        <div className="self-stretch h-0 outline outline-1 outline-[#0000001A]"></div>
                                        <div className="self-stretch inline-flex justify-start items-center gap-5">
                                            <div className="w-48 px-1 py-2 flex justify-start items-center">
                                                <div className="justify-center text-[#0A0A0A] text-[13px] font-medium font-sans leading-5">
                                                    {role.title}
                                                </div>
                                            </div>
                                            <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                                <div className="flex-1 flex flex-col justify-center text-[#121212] text-[13px] font-medium font-sans leading-5">
                                                    {role.tasks.map((task) => (
                                                        <div className="flex items-center">
                                                            <Dot />
                                                            <span>{task}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="w-48 px-1 py-2 flex justify-start items-center">
                                                <div className="justify-center text-[#0A0A0A] text-[13px] font-medium font-sans leading-5">
                                                    {role.count}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ))}
                            </div>
                        </section>

                        <section className="pt-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Список участников{" "}
                                    {activeApplicantTab === "team"
                                        ? `(${project.members?.length || 0}/8)`
                                        : `(${project.replycants?.length || 0}/10)`}
                                </h2>
                                {/* сделать */}

                                <div className="flex flex-row items-center gap-3">
                                    <SearchBar
                                        placeholder="Ищите участников"
                                        onChange={setSearch}
                                        suggestions={
                                            activeApplicantTab === "team"
                                                ? memberSuggestions
                                                : replycantSuggestions
                                        }
                                        value={search}
                                        className="w-[300px]"
                                    />
                                    {/* сделать */}
                                    <Tabs
                                        tabs={viewTabs}
                                        value={activeView}
                                        onValueChange={setActiveView}
                                        variant="icon"
                                        className="w-auto"
                                    />
                                    {dataSpaces?.role !== "member" ? (
                                        <Button
                                            variant="dark"
                                            size="hug36"
                                            icon={<Plus size={18} />}
                                            className="font-sans text-[13px] font-semibold gap-2"
                                        >
                                            Пригласить
                                        </Button>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            </div>

                            <Tabs
                                tabs={applicanttabs}
                                value={activeApplicantTab}
                                onValueChange={setActiveApplicantTab}
                                variant="text"
                            />
                        </section>

                        {
                            activeApplicantTab === "team" ? (
                                <TableMembers
                                    headerList={[
                                        "Имя",
                                        "Роль",
                                        "Контакты",
                                        "Резюме",
                                        "Дата добавления",
                                    ]}
                                    members={filteredMembers}
                                /> //removeMember={removeMember}
                            ) : (
                                <TableInvitations
                                    headerList={[
                                        "Имя",
                                        "Приоритет",
                                        "Контакты",
                                        "Резюме",
                                        "Дата отклика",
                                    ]}
                                    members={filteredReplycants}
                                />
                            ) //addToTeam={addToTeam}
                        }
                    </>
                )}
            </div>
        </ContentLayout>
    );
};

export default SpaceRoute;
