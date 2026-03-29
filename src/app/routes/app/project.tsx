import { ContentLayout } from "@/components/layouts";
import { Ellipsis, PencilLine } from "lucide-react";
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

const projects = [
    {
        id: 1,
        tag: "В работе",
        tagVariant: "info" as const,
        title: "AI Learning Platform",
        description: "Разработка цифровой платформы с ИИ",
        progressValue: 75,
        dateText: "31 мая, 2024",
        tags: [{ text: "Frontend" }, { text: "AI/ML" }, { text: "Design" }],
        membersCount: 8,
        users: [
            { name: "Анна С." },
            { name: "Михаил К." },
            { name: "Елена В." },
            { name: "Дмитрий П." },
        ],
        archived: false,
        spaceId: 1,
        descriptionExtended:
            "Tasker — учебный проект по разработке веб-сервиса для управления задачами и проектами. Сервис предназначен для планирования задач, распределения ролей в команде, работы с дедлайнами и отслеживания прогресса выполнения проекта. В рамках проекта прорабатываются основные этапы создания веб-приложения: формирование требований, проектирование пользовательских сценариев и интерфейсов, разработка ключевого функционала и организация командной работы. Tasker ориентирован на использование в образовательной среде и поддержку учебных проектных команд.",
        creationDate: "4 Февраля, 2026",
        color: "bg-blue-500",
        roles: [
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
        ],
        members: [
            {
                id: 1,
                name: "Кирилл Сомов",
                role: "Project Manager",
                contacts: "@kirillsomov",
                resumeUrl: "",
                dateAdded: "12.02.2026",
                status: "default" as const,
            },
            {
                id: 2,
                name: "Анна Красина",
                role: "Frontend Developer",
                contacts: "@anutakrasina",
                resumeUrl: "",
                dateAdded: "12.02.2026",
                status: "delete" as const,
            },
            {
                id: 3,
                name: "Илья Поперечный",
                role: "Backend Developer",
                contacts: "@ilya_poperechny",
                resumeUrl: "",
                dateAdded: "12.02.2026",
                status: "delete" as const,
            },
        ],
        replycants: [
            {
                id: 1,
                name: "Кирилл Сомов",
                priority: 1,
                contacts: "@kirillsomov",
                resumeUrl: "",
                responseDate: "12.02.2026",
                status: "invite" as const,
            },
            {
                id: 2,
                name: "Анна Красина",
                priority: 1,
                contacts: "@anutakrasina",
                resumeUrl: "",
                responseDate: "12.02.2026",
                status: "invited" as const,
            },
            {
                id: 3,
                name: "Илья Поперечный",
                priority: 2,
                contacts: "@ilya_poperechny",
                resumeUrl: "",
                responseDate: "12.02.2026",
                status: "invited" as const,
            },
        ],
    },
];

const spaces = [
    {
        id: 1,
        title: "Управление проектами",
        projectsCount: 8,
        membersCount: 24,
        color: "bg-blue-500",
        category: "Дисциплина",
        description: "Проекты по планированию, организации и контролю проектной работы",
    },
    {
        id: 2,
        title: "Проектная деятельность",
        projectsCount: 5,
        membersCount: 12,
        color: "bg-indigo-500",
        category: "Дисциплина",
        description: "Практические проекты, направленные на командную работу и применение знаний",
    },
    {
        id: 3,
        title: "Управление процессами",
        projectsCount: 12,
        membersCount: 128,
        color: "bg-red-500",
        category: "Дисциплина",
        description: "Проекты для знакомства с профессией и основами профессиональной работы",
    },
    {
        id: 4,
        title: "Управление проектами",
        projectsCount: 8,
        membersCount: 24,
        color: "bg-blue-500",
        category: "Дисциплина",
        description: "Проекты по планированию, организации и контролю проектной работы",
    },
    {
        id: 5,
        title: "Проектная деятельность",
        projectsCount: 5,
        membersCount: 12,
        color: "bg-indigo-500",
        category: "Дисциплина",
        description: "Практические проекты, направленные на командную работу и применение знаний",
    },
    {
        id: 6,
        title: "Управление процессами",
        projectsCount: 12,
        membersCount: 128,
        color: "bg-red-500",
        category: "Дисциплина",
        description: "Проекты для знакомства с профессией и основами профессиональной работы",
    },
];

const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataProject } = useProject(urlId);
    const { data: dataSpaces } = useSpacesList();

    const projectmockdata = dataProject || projects.find((project) => String(project.id) === urlId);

    const spaceTitle = (dataSpaces?.spaces || spaces).find(
        (space) => String(space.id) === String(projectmockdata?.spaceId),
    )?.title;

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
    const memberTitles = projectmockdata?.members?.map((member) => member.name) || [];
    const replycantTitles = projectmockdata?.replycants?.map((replycant) => replycant.name) || [];

    const memberRoles = projectmockdata?.members?.map((member) => member.role) || [];

    const memberContacts = projectmockdata?.members?.map((member) => member.contacts) || [];
    const replycantContacts =
        projectmockdata?.replycants?.map((replycant) => replycant.contacts) || [];

    const memberSuggestions = [...memberTitles, ...memberContacts, ...memberRoles];

    const replycantSuggestions = [...replycantTitles, ...replycantContacts];

    const filteredMembers = useMemo(() => {
        if (!search) return projectmockdata?.members || [];
        return (projectmockdata?.members || []).filter(
            (member) =>
                member.name.toLowerCase().includes(search.toLowerCase()) ||
                member.contacts.toLowerCase().includes(search.toLowerCase()) ||
                member.role.toLowerCase().includes(search.toLowerCase()),
        );
    }, [projectmockdata, search]);

    const filteredReplycants = useMemo(() => {
        if (!search) return projectmockdata?.replycants || [];
        return (projectmockdata?.replycants || []).filter(
            (replycant) =>
                replycant.name.toLowerCase().includes(search.toLowerCase()) ||
                replycant.contacts.toLowerCase().includes(search.toLowerCase()),
        );
    }, [projectmockdata, search]);

    //const removeMember = (id: number) => {
    // Логика удаления участника из команды по id
    //}

    //const addToTeam = (id: number) => {
    //    // Логика добавления участника в команду по id
    //}

    if (!projectmockdata) {
        return <div>Пространство не найдено</div>;
    }

    return (
        <ContentLayout title={projectmockdata.title}>
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
                                    to={`/app/space?id=${projectmockdata.spaceId}`}
                                    className="font-sans font-medium text-[16px]"
                                >
                                    {spaceTitle}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                {projectmockdata.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="self-stretch inline-flex justify-between items-start">
                    <div className="flex justify-start items-start gap-5">
                        <div className="pt-1 flex justify-start items-center gap-2">
                            <div className="w-16 h-16 bg-color-azure-60 rounded-2xl flex justify-center items-center">
                                <div
                                    className={`${projectmockdata.color} rounded-lg  text-white h-16 w-16 flex items-center justify-center`}
                                >
                                    <GraduationCapIcon size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="inline-flex flex-col justify-start items-start gap-0.5">
                            <div className="self-stretch inline-flex justify-start items-center gap-3">
                                <div className="justify-center text-color-grey-4 text-3xl font-semibold font-sans leading-9">
                                    {projectmockdata.title}
                                </div>
                                <div
                                    data-status="In Progress"
                                    className="w-16 px-2 py-0.5 bg-[#2B7FFF] rounded-lg outline outline-1 outline-[#2B7FFF]  inline-flex justify-center items-center overflow-hidden"
                                >
                                    <div className="text-center justify-center text-white text-[11px] font-semibold font-sans leading-4 tracking-tight">
                                        {projectmockdata.tag}
                                    </div>
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start">
                                <div className="justify-center text-[#4A5565] text-base font-medium font-sans leading-7">
                                    {projectmockdata.description}
                                </div>
                            </div>
                            <div className="inline-flex justify-start items-center gap-3">
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <ProgressBar value={projectmockdata.progressValue} />
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
                                            Создан: {projectmockdata.creationDate}
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
                                            Дедлайн: {projectmockdata.dateText}
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
                                        Tasker — учебный проект по разработке веб-сервиса для
                                        управления задачами и проектами. Сервис предназначен для
                                        планирования задач, распределения ролей в команде, работы с
                                        дедлайнами и отслеживания прогресса выполнения проекта.
                                        <br />В рамках проекта прорабатываются основные этапы
                                        создания веб-приложения: формирование требований,
                                        проектирование пользовательских сценариев и интерфейсов,
                                        разработка ключевого функционала и организация командной
                                        работы. Tasker ориентирован на использование в
                                        образовательной среде и поддержку учебных проектных команд.
                                    </div>
                                </div>
                                <div className="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
                                    {projectmockdata.tags.map((tag, index) => (
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
                                <div className="self-stretch h-0 outline outline-1 outline-[#0000001A]"></div>
                                <div className="self-stretch inline-flex justify-start items-center gap-5">
                                    <div className="w-48 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-[#0A0A0A] text-[13px] font-medium font-sans leading-5">
                                            Backend Developer
                                        </div>
                                    </div>
                                    <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                        <div className="flex-1 justify-center text-[#121212] text-[13px] font-medium font-sans leading-5">
                                            Проектирование и реализация серверной логики платформы
                                            <br />
                                            Разработка и поддержка API для взаимодействия с
                                            фронтендом
                                            <br />
                                            Работа с базой данных и бизнес-логикой проектов и
                                            пользователей
                                            <br />
                                            Обеспечение безопасности и контроля доступа
                                            <br />
                                            Оптимизация производительности и стабильности системы
                                        </div>
                                    </div>
                                    <div className="w-48 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-[#0A0A0A] text-[13px] font-medium font-sans leading-5">
                                            2
                                        </div>
                                    </div>
                                </div>
                                <div className="self-stretch h-0 outline outline-1 outline-[#0000001A]"></div>
                                <div className="self-stretch inline-flex justify-start items-center gap-5">
                                    <div className="w-48 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-[#0A0A0A] text-[13px] font-medium font-sans leading-5">
                                            Frontend Developer
                                        </div>
                                    </div>
                                    <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                        <div className="flex-1 justify-center text-[#121212] text-[13px] font-medium font-sans leading-5">
                                            Разработка пользовательского интерфейса платформы
                                            <br />
                                            Реализация пользовательских сценариев и взаимодействий
                                            <br />
                                            Интеграция интерфейса с серверной частью через API
                                            <br />
                                            Обеспечение адаптивности и корректного отображения
                                            интерфейса
                                            <br />
                                            Совместная работа с дизайнером и тестировщиком над
                                            улучшением UX
                                        </div>
                                    </div>
                                    <div className="w-48 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-[#0A0A0A] text-[13px] font-medium font-sans leading-5">
                                            3
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Список участников{" "}
                                    {activeApplicantTab === "team"
                                        ? `(${projectmockdata.members?.length || 0}/8)`
                                        : `(${projectmockdata.replycants?.length || 0}/10)`}
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
