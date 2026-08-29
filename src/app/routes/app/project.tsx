import { ContentLayout } from "@/components/layouts";
import { Dot, Ellipsis, PencilLine, Trash2, List as ListIcon } from "lucide-react";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useState, useMemo, useEffect, Fragment, useCallback } from "react";
import {
    useProject,
    useUpdateProject,
    useRemoveParticipant,
    useAcceptResponse,
    useRejectResponse,
    useDeleteProject,
} from "@/lib/projects";
import { useRecentlyViewed } from "@/features/spaces/hooks/use-recently-viewed";
import { useUser } from "@/lib/auth";
import { useSpacesList } from "@/lib/spaces";
import { useSearchParams, useNavigate } from "react-router";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCapIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { SearchBar } from "@/components/ui/search-bar";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
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
import { type ProjectFullResponse } from "@/types/api";
import { ApplyDialog } from "@/features/project/components/apply-dialog";
import { KanbanBoard } from "@/features/kanban/components/board";
import { TaskPanel, type TaskPatch } from "@/features/kanban/components/task-panel";
import { KanbanFilter } from "@/features/kanban/components/board-filter";
import {
    useBoard,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    useMoveTask,
    useCreateColumn,
    useUpdateColumn,
    useDeleteColumn,
    useReorderColumns,
    useCreateSubtask,
    useUpdateSubtask,
    useDeleteSubtask,
} from "@/features/kanban/hooks/useKanban";
import { useTaskPanel } from "@/features/kanban/hooks/useTaskPanel";
import { useUsers as useKanbanUsers } from "@/features/kanban/hooks/useUsers";
import {
    defaultFilterState,
    filterColumns,
    type KanbanFilterState,
} from "@/features/kanban/utils/filter-tasks";

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function mapBackendProject(p: ProjectFullResponse, currentUserId?: number) {
    const statusName = p.status?.name || "Неизвестно";
    const isArchived = statusName === "archived";

    return {
        id: p.id,
        title: p.name,
        tag: statusName,
        tagVariant: (isArchived ? "disabled" : "info") as "disabled" | "info",
        theme: p.theme || "",
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
        roles: (p.vacancies || []).map((v) => ({
            title: v.title,
            tasks: v.tasks,
            count: v.required_count,
        })),
        members: p.members.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            contacts: m.contacts,
            resumeUrl: m.resume_url,
            dateAdded: m.date_added,
            status: (currentUserId && p.author_id === currentUserId && m.user_id !== currentUserId
                ? "delete"
                : "default") as "default" | "delete",
        })),
        replycants: p.replycants.map((r) => ({
            id: r.id,
            name: r.name,
            priority: 0,
            contacts: r.contacts,
            resumeUrl: r.resume_url,
            responseDate: r.response_date,
            role: r.role || "",
            type: r.type || "response",
            responseStatus: r.status || "pending",
            status: r.status === "accepted" ? ("invited" as const) : ("invite" as const),
            userId: r.user_id,
        })),
    };
}

const SpaceRoute = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataProject, isLoading, error } = useProject(urlId);
    const { data: dataSpaces } = useSpacesList({ page: 1, limit: 10 });
    const { data: user } = useUser();

    const project = dataProject ? mapBackendProject(dataProject, user?.id) : null;
    const isCreator = dataProject ? dataProject.author_id === user?.id : false;

    const canManageProject = useMemo(() => {
        if (isCreator) return true;
        if (!dataProject?.workspace_id || !dataSpaces || !user) return false;
        if (dataSpaces.role === "admin" || dataSpaces.role === "teacher") return true;
        const space = dataSpaces.spaces?.find((s) => s.id === dataProject.workspace_id);
        return space?.author_id === user.id;
    }, [isCreator, dataProject, dataSpaces, user]);

    const canDeleteProject = useMemo(() => {
        return dataSpaces?.role === "admin";
    }, [dataSpaces]);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const isDeleteConfirmed = deleteConfirmName === project?.title;

    const [isEditing, setIsEditing] = useState(() => searchParams.get("edit") === "true");
    const [editTitle, setEditTitle] = useState("");
    const [editTheme, setEditTheme] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editTags, setEditTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [editRoles, setEditRoles] = useState<{ title: string; tasks: string[]; count: number }[]>(
        [],
    );
    const updateProjectMutation = useUpdateProject();
    const { addViewedProject } = useRecentlyViewed();
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);

    const showApplyButton = !!(
        user?.id &&
        dataProject &&
        dataProject.author_id !== user.id &&
        !dataProject.members.some((m) => m.user_id === user.id) &&
        !dataProject.has_user_applied
    );

    useEffect(() => {
        if (dataProject?.id) {
            addViewedProject(dataProject.id);
        }
    }, [dataProject, addViewedProject]);

    useEffect(() => {
        if (searchParams.get("edit") === "true") {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete("edit");
                    return next;
                },
                { replace: true },
            );
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (dataProject) {
            setEditTitle(dataProject.name);
            setEditTheme(dataProject.theme || "");
            setEditDescription(dataProject.description || "");
            setEditTags(dataProject.tags);
            setEditRoles(
                (dataProject.vacancies || []).map((v) => ({
                    title: v.title,
                    tasks: [...v.tasks],
                    count: v.required_count,
                })),
            );
        }
    }, [dataProject]);

    const handleSave = async () => {
        if (!dataProject) return;
        const filtered = editTags.filter((t) => t.trim() !== "");
        const totalRequired = editRoles.reduce((s, r) => s + r.count, 0);
        if (dataProject.max_participants && totalRequired > dataProject.max_participants) {
            toast.error(
                `Сумма необходимых участников (${totalRequired}) превышает максимальное количество (${dataProject.max_participants})`,
            );
            return;
        }
        try {
            await updateProjectMutation.mutateAsync({
                id: String(dataProject.id),
                data: {
                    name: editTitle,
                    theme: editTheme,
                    description: editDescription,
                    tags: filtered,
                    vacancies: editRoles.map((r) => ({
                        title: r.title,
                        tasks: r.tasks,
                        required_count: r.count,
                    })),
                },
            });
            setIsEditing(false);
        } catch {
            toast.error("Не удалось сохранить изменения");
        }
    };

    const addRole = () => {
        setEditRoles([...editRoles, { title: "", tasks: [], count: 1 }]);
    };

    const removeRole = (index: number) => {
        setEditRoles(editRoles.filter((_, i) => i !== index));
    };

    const updateRole = (index: number, field: string, value: string | number | string[]) => {
        setEditRoles(editRoles.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    };

    const addTag = () => {
        const val = tagInput.trim();
        if (val && !editTags.includes(val)) {
            setEditTags([...editTags, val]);
        }
        setTagInput("");
    };

    const removeTag = (index: number) => {
        setEditTags(editTags.filter((_, i) => i !== index));
    };

    const handleCancel = () => {
        if (dataProject) {
            setEditTitle(dataProject.name);
            setEditTheme(dataProject.theme || "");
            setEditDescription(dataProject.description || "");
            setEditTags(dataProject.tags);
            setEditRoles(
                (dataProject.vacancies || []).map((v) => ({
                    title: v.title,
                    tasks: [...v.tasks],
                    count: v.required_count,
                })),
            );
        }
        setTagInput("");
        setIsEditing(false);
    };

    const spaceTitle =
        dataSpaces?.spaces.find((space) => String(space.id) === String(project?.spaceId))?.title ||
        "";

    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "view");

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (tab === "view") {
                    next.delete("tab");
                } else {
                    next.set("tab", tab);
                }
                return next;
            },
            { replace: true },
        );
    };
    const [activeApplicantTab, setActiveApplicantTab] = useState("team");
    const [activeView, setActiveView] = useState("list");
    const [sortBy, setSortBy] = useState("default");

    const removeParticipantMutation = useRemoveParticipant();
    const acceptResponseMutation = useAcceptResponse();
    const rejectResponseMutation = useRejectResponse();
    const deleteProjectMutation = useDeleteProject();
    const navigate = useNavigate();

    const handleDeleteProject = useCallback(
        (projectId: number) => {
            deleteProjectMutation.mutate(projectId, {
                onSuccess: () => {
                    setDeleteConfirmOpen(false);
                    toast.success("Проект удалён");
                    navigate("/app");
                },
                onError: () => {
                    toast.error("Не удалось удалить проект");
                },
            });
        },
        [deleteProjectMutation, navigate],
    );

    // Kanban state
    const projectId = parseInt(urlId || "0", 10);
    const [kanbanFilter, setKanbanFilter] = useState<KanbanFilterState>(defaultFilterState);
    const { isOpen: isTaskPanelOpen, editingTask, openEditPanel, closePanel } = useTaskPanel();
    const { data: columns, isLoading: kanbanLoading, refetch } = useBoard(projectId);
    const { data: projectMembers } = useKanbanUsers();

    const filteredColumns = useMemo(
        () => filterColumns(columns || [], kanbanFilter, user?.id),
        [columns, kanbanFilter, user?.id],
    );

    const liveEditingTask = useMemo(() => {
        if (!editingTask || !columns) return editingTask;
        for (const col of columns) {
            const found = col.tasks?.find((t) => t.id === editingTask.id);
            if (found) return found;
        }
        return editingTask;
    }, [editingTask, columns]);

    const kanbanCreateTask = useCreateTask();
    const kanbanUpdateTask = useUpdateTask();
    const kanbanDeleteTask = useDeleteTask();
    const kanbanMoveTask = useMoveTask();
    const kanbanCreateColumn = useCreateColumn();
    const kanbanUpdateColumn = useUpdateColumn();
    const kanbanDeleteColumn = useDeleteColumn();
    const kanbanReorderColumns = useReorderColumns(projectId);
    const kanbanCreateSubtask = useCreateSubtask();
    const kanbanUpdateSubtask = useUpdateSubtask();
    const kanbanDeleteSubtask = useDeleteSubtask();

    const handleTaskAutoSave = useCallback(
        async (taskId: number, patch: TaskPatch) => {
            const data: Record<string, unknown> = { ...patch };
            if (patch.dueDate === null) {
                data.dueDate = undefined;
            }
            try {
                await kanbanUpdateTask.mutateAsync({
                    taskId,
                    data: data as Parameters<typeof kanbanUpdateTask.mutateAsync>[0]["data"],
                });
            } catch (e) {
                toast.error("Не удалось сохранить изменения");
                throw e;
            }
        },
        [kanbanUpdateTask],
    );

    const handleSubtaskCreate = useCallback(
        async (taskId: number, title: string) => {
            try {
                await kanbanCreateSubtask.mutateAsync({ taskId, title, isCompleted: false });
            } catch {
                toast.error("Не удалось добавить подзадачу");
            }
        },
        [kanbanCreateSubtask],
    );

    const handleSubtaskUpdate = useCallback(
        async (subtaskId: number, data: { title?: string; isCompleted?: boolean }) => {
            try {
                await kanbanUpdateSubtask.mutateAsync({ subtaskId, data });
            } catch {
                toast.error("Не удалось обновить подзадачу");
            }
        },
        [kanbanUpdateSubtask],
    );

    const handleSubtaskDelete = useCallback(
        async (subtaskId: number) => {
            try {
                await kanbanDeleteSubtask.mutateAsync(subtaskId);
            } catch {
                toast.error("Не удалось удалить подзадачу");
            }
        },
        [kanbanDeleteSubtask],
    );

    const handleTaskMoveToColumn = useCallback(
        async (taskId: number, targetColumnId: number) => {
            const targetCol = columns?.find((c) => c.id === targetColumnId);
            const targetPosition =
                targetCol && targetCol.tasks && targetCol.tasks.length > 0
                    ? Math.max(...targetCol.tasks.map((t) => t.position)) + 1
                    : 0;
            try {
                await kanbanMoveTask.mutateAsync({
                    taskId,
                    data: { columnId: targetColumnId, position: targetPosition },
                });
            } catch {
                toast.error("Не удалось переместить задачу");
            }
        },
        [columns, kanbanMoveTask],
    );

    const handleDeleteTask = useCallback(
        (taskId: number) => {
            kanbanDeleteTask.mutate(taskId, {
                onSuccess: () => {
                    toast.success("Задача удалена");
                    refetch();
                },
                onError: () => {
                    toast.error("Ошибка при удалении задачи");
                },
            });
        },
        [kanbanDeleteTask, refetch],
    );

    const handleCreateColumn = useCallback(
        (name: string) => {
            kanbanCreateColumn.mutate(
                { projectId, name, color: "white" },
                {
                    onSuccess: () => {
                        toast.success("Колонка создана");
                        refetch();
                    },
                    onError: () => {
                        toast.error("Ошибка при создании колонки");
                    },
                },
            );
        },
        [projectId, kanbanCreateColumn, refetch],
    );

    const handleRenameColumn = useCallback(
        (columnId: number, newName: string) => {
            kanbanUpdateColumn.mutate(
                { columnId, data: { name: newName } },
                {
                    onSuccess: () => {
                        toast.success("Колонка переименована");
                        refetch();
                    },
                    onError: () => {
                        toast.error("Ошибка при переименовании колонки");
                    },
                },
            );
        },
        [kanbanUpdateColumn, refetch],
    );

    const handleChangeColor = useCallback(
        (columnId: number, color: string) => {
            kanbanUpdateColumn.mutate(
                { columnId, data: { color } },
                {
                    onSuccess: () => {
                        toast.success("Цвет колонки изменен");
                        refetch();
                    },
                    onError: () => {
                        toast.error("Ошибка при изменении цвета колонки");
                    },
                },
            );
        },
        [kanbanUpdateColumn, refetch],
    );

    const handleRemoveMember = useCallback(
        (memberId: number) => {
            const member = project?.members.find((m) => m.id === memberId);
            if (!member) return;
            removeParticipantMutation.mutate(
                { projectId: project?.id || 0, userId: member.id },
                {
                    onSuccess: () => {
                        toast.success("Участник удалён из команды");
                    },
                    onError: () => {
                        toast.error("Не удалось удалить участника");
                    },
                },
            );
        },
        [project, removeParticipantMutation],
    );

    const handleAcceptResponse = useCallback(
        (responseId: number) => {
            const replycant = project?.replycants.find((r) => r.id === responseId);
            if (!replycant) return;
            acceptResponseMutation.mutate(
                { projectId: project?.id || 0, responseId },
                {
                    onSuccess: () => {
                        toast.success("Отклик принят");
                    },
                    onError: () => {
                        toast.error("Не удалось принять отклик");
                    },
                },
            );
        },
        [project, acceptResponseMutation],
    );

    const handleRejectResponse = useCallback(
        (responseId: number) => {
            const replycant = project?.replycants.find((r) => r.id === responseId);
            if (!replycant) return;
            rejectResponseMutation.mutate(
                { projectId: project?.id || 0, responseId },
                {
                    onSuccess: () => {
                        toast.success("Отклик отклонён");
                    },
                    onError: () => {
                        toast.error("Не удалось отклонить отклик");
                    },
                },
            );
        },
        [project, rejectResponseMutation],
    );

    const queryClient = useQueryClient();

    const handleAcceptInvitation = useCallback(
        async (invitationId: number) => {
            try {
                await api.patch(`/invitations/${invitationId}/accept`);
                toast.success("Приглашение принято");
                queryClient.invalidateQueries({ queryKey: ["project", project?.id] });
            } catch {
                toast.error("Не удалось принять приглашение");
            }
        },
        [project, queryClient],
    );

    const handleRejectInvitation = useCallback(
        async (invitationId: number) => {
            try {
                await api.patch(`/invitations/${invitationId}/reject`);
                toast.success("Приглашение отклонено");
                queryClient.invalidateQueries({ queryKey: ["project", project?.id] });
            } catch {
                toast.error("Не удалось отклонить приглашение");
            }
        },
        [project, queryClient],
    );

    const handleDeleteColumn = useCallback(
        (columnId: number) => {
            kanbanDeleteColumn.mutate(columnId, {
                onSuccess: () => {
                    toast.success("Колонка удалена");
                    refetch();
                },
                onError: () => {
                    toast.error("Ошибка при удалении колонки");
                },
            });
        },
        [kanbanDeleteColumn, refetch],
    );

    const handleTaskMove = useCallback(
        (taskId: number, targetColumnId: number, targetPosition: number) => {
            kanbanMoveTask.mutate(
                { taskId, data: { columnId: targetColumnId, position: targetPosition } },
                {
                    onError: () => {
                        toast.error("Ошибка при перемещении задачи");
                        refetch();
                    },
                },
            );
        },
        [kanbanMoveTask, refetch],
    );

    const handleReorderColumns = useCallback(
        (columnOrders: { id: number; position: number }[]) => {
            kanbanReorderColumns.mutate(columnOrders, {
                onError: () => {
                    toast.error("Ошибка при изменении порядка колонок");
                    refetch();
                },
            });
        },
        [kanbanReorderColumns, refetch],
    );

    const handleAddTask = useCallback(
        (columnId: number, title: string) => {
            kanbanCreateTask.mutate(
                { title, columnId, priority: "default" },
                {
                    onSuccess: () => refetch(),
                    onError: () => toast.error("Ошибка при создании задачи"),
                },
            );
        },
        [kanbanCreateTask, refetch],
    );

    const boardData = useMemo(
        () => ({
            columns: filteredColumns,
            isLoading: kanbanLoading,
            onTaskMove: handleTaskMove,
            onTaskClick: openEditPanel,
            onAddTask: handleAddTask,
            onDeleteTask: handleDeleteTask,
            onRenameColumn: handleRenameColumn,
            onChangeColor: handleChangeColor,
            onDeleteColumn: handleDeleteColumn,
            onReorderColumns: handleReorderColumns,
            onCreateColumn: handleCreateColumn,
        }),
        [
            filteredColumns,
            kanbanLoading,
            handleTaskMove,
            openEditPanel,
            handleAddTask,
            handleDeleteTask,
            handleRenameColumn,
            handleChangeColor,
            handleDeleteColumn,
            handleReorderColumns,
            handleCreateColumn,
        ],
    );

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

    const [search, setSearch] = useState("");
    const memberTitles = project?.members?.map((member) => member.name) || [];
    const replycantTitles = project?.replycants?.map((replycant) => replycant.name) || [];

    const memberRoles = project?.members?.map((member) => member.role) || [];

    const memberContacts = project?.members?.map((member) => member.contacts) || [];
    const replycantContacts = project?.replycants?.map((replycant) => replycant.contacts) || [];

    const memberSuggestions = [...memberTitles, ...memberContacts, ...memberRoles];

    const replycantSuggestions = [...replycantTitles, ...replycantContacts];

    const filteredMembers = useMemo(() => {
        let result = project?.members || [];
        if (search) {
            result = result.filter(
                (member) =>
                    member.name.toLowerCase().includes(search.toLowerCase()) ||
                    member.contacts.toLowerCase().includes(search.toLowerCase()) ||
                    member.role.toLowerCase().includes(search.toLowerCase()),
            );
        }
        if (sortBy === "name") {
            result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "date") {
            result = [...result].sort(
                (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime(),
            );
        }
        return result;
    }, [project, search, sortBy]);

    const filteredReplycants = useMemo(() => {
        let result = (project?.replycants || []).filter((r) => r.responseStatus === "pending");
        if (search) {
            result = result.filter(
                (replycant) =>
                    replycant.name.toLowerCase().includes(search.toLowerCase()) ||
                    replycant.contacts.toLowerCase().includes(search.toLowerCase()) ||
                    replycant.role.toLowerCase().includes(search.toLowerCase()),
            );
        }
        return result;
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

                <div className="self-stretch flex items-start gap-10">
                    <div className="flex-1 flex justify-start items-start gap-5">
                        <div className="pt-1 flex justify-start items-center gap-2 shrink-0">
                            <div className="w-16 h-16 bg-color-azure-60 rounded-2xl flex justify-center items-center">
                                <div
                                    className={`${project.color} rounded-lg  text-white h-16 w-16 flex items-center justify-center`}
                                >
                                    <GraduationCapIcon size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-start items-start gap-0.5 min-w-0 w-full">
                            {/*  */}
                            <div className="self-stretch flex justify-start items-center gap-3 flex-wrap">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="flex-1 min-w-0 justify-center text-color-grey-4 text-3xl font-semibold font-sans leading-9 bg-transparent border-b-2 border-[#2B7FFF] outline-none p-0"
                                    />
                                ) : (
                                    <div className="justify-center text-color-grey-4 text-3xl font-semibold font-sans leading-9">
                                        {project.title}
                                    </div>
                                )}
                                <div
                                    data-status="In Progress"
                                    className="w-16 px-2 py-0.5 bg-[#2B7FFF] rounded-lg outline outline-1 outline-[#2B7FFF]  inline-flex justify-center items-center overflow-hidden"
                                >
                                    <div className="text-center justify-center text-white text-[11px] font-semibold font-sans leading-4 tracking-tight">
                                        {project.tag}
                                    </div>
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start w-full">
                                <div className="justify-center text-app-muted text-[13px] font-medium font-sans leading-5 tracking-tight mb-0.5">
                                    Тема
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editTheme}
                                        onChange={(e) => setEditTheme(e.target.value)}
                                        className="w-full self-stretch justify-center text-gray-600 text-base font-medium font-sans leading-7 bg-transparent border-b-2 border-[#2B7FFF] outline-none p-0 resize-none field-sizing-content"
                                    />
                                ) : (
                                    <div className="justify-center text-gray-600 text-base font-medium font-sans leading-7">
                                        {project.theme}
                                    </div>
                                )}
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
                                        <div className="justify-center text-gray-600 text-[13px] font-normal font-sans leading-5 tracking-tight">
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
                                {dataProject?.author_name && (
                                    <div className="flex justify-start items-center gap-1">
                                        <div className="inline-flex flex-col justify-start items-start">
                                            <div className="justify-center text-gray-600 text-[13px] font-normal font-sans leading-5 tracking-tight">
                                                Автор: {dataProject.author_name}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {dataProject?.author_name && (
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
                                )}
                                <div className="flex justify-start items-center gap-1">
                                    <div className="inline-flex flex-col justify-start items-start">
                                        <div className="justify-center text-gray-600 text-[13px] font-normal font-sans leading-5 tracking-tight">
                                            Дедлайн: {project.dateText}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {isCreator && !isEditing ? (
                            <Button
                                variant="dark"
                                size="hug36"
                                icon={<PencilLine size={18} />}
                                className="font-sans text-[13px] font-semibold gap-2"
                                onClick={() => setIsEditing(true)}
                            >
                                Редактировать
                            </Button>
                        ) : (
                            ""
                        )}
                        {isEditing ? (
                            <>
                                <Button
                                    variant="dark"
                                    size="hug36"
                                    className="font-sans text-[13px] font-semibold gap-2"
                                    onClick={handleSave}
                                >
                                    Сохранить
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="hug36"
                                    className="font-sans text-[13px] font-semibold gap-2"
                                    onClick={handleCancel}
                                >
                                    Отмена
                                </Button>
                            </>
                        ) : (
                            ""
                        )}
                        {canDeleteProject && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <IconButton
                                        variant="ghost"
                                        icon={<Ellipsis size={20} />}
                                        className="text-[--btn-outline-text]"
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem
                                        className="gap-3 text-sm cursor-pointer text-red-600 focus:text-red-600"
                                        onSelect={() => {
                                            setDeleteConfirmName("");
                                            setDeleteConfirmOpen(true);
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Удалить проект
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                <section>
                    <Tabs
                        tabs={textTabs}
                        value={activeTab}
                        onValueChange={handleTabChange}
                        variant="text"
                    />
                </section>

                {activeTab === "view" && (
                    <>
                        <section className="self-stretch inline-flex flex-col justify-start items-start gap-2.5">
                            <div className="flex flex-col justify-start items-start">
                                <div className="justify-center text-gray-900 text-xl font-semibold font-sans leading-7">
                                    Описание проекта
                                </div>
                            </div>
                            <div className="self-stretch flex flex-col justify-start items-start gap-5">
                                <div className="self-stretch flex flex-col justify-start items-start">
                                    {isEditing ? (
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            className="w-full self-stretch justify-center text-gray-600 text-base font-medium font-sans leading-7 bg-transparent border-b-2 border-[#2B7FFF] outline-none p-0 resize-none field-sizing-content"
                                            rows={Math.max(
                                                2,
                                                Math.ceil(editDescription.length / 80),
                                            )}
                                        />
                                    ) : (
                                        <div className="self-stretch justify-center text-gray-600 text-base font-medium font-sans leading-7">
                                            {project.descriptionExtended}
                                        </div>
                                    )}
                                </div>
                                <div className="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
                                    {isEditing
                                        ? editTags.map((tag, index) => (
                                              <div
                                                  key={index}
                                                  className="h-6 px-2 py-0.5 bg-gray-200 rounded-lg outline outline-1 outline-gray-200 inline-flex justify-center items-center gap-1 overflow-hidden"
                                              >
                                                  <div className="text-center justify-center text-[#030213] text-[11px] font-semibold font-sans leading-4 tracking-tight">
                                                      {tag}
                                                  </div>
                                                  <button
                                                      type="button"
                                                      onClick={() => removeTag(index)}
                                                      className="text-gray-500 hover:text-red-500 leading-none"
                                                  >
                                                      ✕
                                                  </button>
                                              </div>
                                          ))
                                        : project.tags.map((tag, index) => (
                                              <div
                                                  key={index}
                                                  className="h-5 px-2 py-0.5 bg-gray-200 rounded-lg outline outline-1 outline-gray-200 flex justify-center items-center overflow-hidden"
                                              >
                                                  <div className="text-center justify-center text-[#030213] text-[11px] font-semibold font-sans leading-4 tracking-tight">
                                                      {tag.text}
                                                  </div>
                                              </div>
                                          ))}
                                    {isEditing && (
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addTag();
                                                }
                                            }}
                                            onBlur={addTag}
                                            placeholder="Добавить тег..."
                                            className="h-6 px-2 text-[11px] font-semibold font-sans bg-transparent border border-dashed border-gray-500 rounded-lg outline-none min-w-[100px]"
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="self-stretch inline-flex flex-col justify-start items-start gap-6">
                            <div className="flex flex-col justify-start items-start">
                                <div className="justify-center text-gray-900 text-xl font-semibold font-sans leading-7">
                                    Необходимые участники
                                </div>
                                {isEditing && dataProject?.max_participants && (
                                    <div className="text-sm text-gray-400 mt-1">
                                        Мест: {editRoles.reduce((s, r) => s + r.count, 0)} /{" "}
                                        {dataProject.max_participants}
                                    </div>
                                )}
                            </div>
                            <div
                                data-type="Required participants"
                                className="self-stretch p-2.5 bg-app-surface rounded-2xl outline outline-1  outline-gray-200 flex flex-col justify-start items-start gap-2.5"
                            >
                                <div className="self-stretch inline-flex justify-start items-center gap-5">
                                    <div className="w-48 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-gray-900 text-[15px] font-semibold font-sans leading-5">
                                            Роль
                                        </div>
                                    </div>
                                    <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                        <div className="justify-center text-gray-900 text-[15px] font-semibold font-sans leading-5">
                                            Задачи
                                        </div>
                                    </div>
                                    <div className="w-48 px-1 py-2 flex justify-start items-center gap-2">
                                        <div className="justify-center text-gray-900 text-[15px] font-semibold font-sans leading-5">
                                            Количество участников
                                        </div>
                                    </div>
                                </div>
                                {(isEditing ? editRoles : project.roles).map((role, index) => (
                                    <Fragment key={index}>
                                        <div className="self-stretch h-0 outline outline-1 outline-[#0000001A] dark:outline-[#ffffff1f]"></div>
                                        {isEditing ? (
                                            <div className="self-stretch inline-flex justify-start items-center gap-5">
                                                <div className="w-48 px-1 py-2 flex justify-start items-center">
                                                    <input
                                                        type="text"
                                                        value={role.title}
                                                        onChange={(e) =>
                                                            updateRole(
                                                                index,
                                                                "title",
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full justify-center text-gray-900 text-[13px] font-medium font-sans leading-5 bg-transparent border-b-2 border-[#2B7FFF] outline-none p-0"
                                                    />
                                                </div>
                                                <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                                    <textarea
                                                        value={(
                                                            role as {
                                                                title: string;
                                                                tasks: string[];
                                                                count: number;
                                                            }
                                                        ).tasks.join("\n")}
                                                        onChange={(e) =>
                                                            updateRole(
                                                                index,
                                                                "tasks",
                                                                e.target.value
                                                                    .split("\n")
                                                                    .filter((t) => t.trim() !== ""),
                                                            )
                                                        }
                                                        className="w-full justify-center text-gray-900 text-[13px] font-medium font-sans leading-5 bg-transparent border-b-2 border-[#2B7FFF] outline-none p-0 resize-none field-sizing-content"
                                                        rows={Math.max(
                                                            1,
                                                            (
                                                                role as {
                                                                    title: string;
                                                                    tasks: string[];
                                                                    count: number;
                                                                }
                                                            ).tasks.length,
                                                        )}
                                                    />
                                                </div>
                                                <div className="w-48 px-1 py-2 flex justify-start items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={
                                                            dataProject?.max_participants ??
                                                            undefined
                                                        }
                                                        value={role.count}
                                                        onChange={(e) =>
                                                            updateRole(
                                                                index,
                                                                "count",
                                                                parseInt(e.target.value) || 1,
                                                            )
                                                        }
                                                        className="w-16 justify-center text-gray-900 text-[13px] font-medium font-sans leading-5 bg-transparent border-b-2 border-[#2B7FFF] outline-none p-0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRole(index)}
                                                        className="text-gray-500 hover:text-red-500 text-[13px] font-medium leading-none"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="self-stretch inline-flex justify-start items-center gap-5">
                                                <div className="w-48 px-1 py-2 flex justify-start items-center">
                                                    <div className="justify-center text-gray-900 text-[13px] font-medium font-sans leading-5">
                                                        {role.title}
                                                    </div>
                                                </div>
                                                <div className="flex-1 px-1 py-2 flex justify-start items-center">
                                                    <div className="flex-1 flex flex-col justify-center text-gray-900 text-[13px] font-medium font-sans leading-5">
                                                        {role.tasks.map((task, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center"
                                                            >
                                                                <Dot />
                                                                <span>{task}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="w-48 px-1 py-2 flex justify-start items-center gap-2">
                                                    <div className="justify-center text-gray-900 text-[13px] font-medium font-sans leading-5">
                                                        {role.count}
                                                    </div>
                                                    <span className="text-[11px] text-gray-500 font-sans">
                                                        осталось
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={addRole}
                                        className="self-stretch mt-2 py-2 border-2 border-dashed border-gray-500 rounded-lg text-gray-500 text-[13px] font-semibold font-sans leading-5 hover:border-[#2B7FFF] hover:text-[#2B7FFF] transition-colors"
                                    >
                                        + Добавить роль
                                    </button>
                                )}
                                {isEditing &&
                                    dataProject?.max_participants &&
                                    editRoles.reduce((s, r) => s + r.count, 0) >
                                        dataProject.max_participants && (
                                        <div className="text-sm text-red-500 mt-2">
                                            Сумма необходимых участников (
                                            {editRoles.reduce((s, r) => s + r.count, 0)}) превышает
                                            максимальное количество ({dataProject.max_participants})
                                        </div>
                                    )}
                            </div>
                        </section>

                        <section className="pt-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {activeApplicantTab === "team"
                                        ? "Команда"
                                        : "Заявки и приглашения"}{" "}
                                    {activeApplicantTab === "team"
                                        ? `(${project.members?.length || 0}${dataProject?.max_participants ? `/${dataProject.max_participants}` : ""})`
                                        : `(${filteredReplycants.length})`}
                                </h2>
                                {/* сделать */}

                                <div className="flex flex-row items-center gap-3">
                                    <SearchBar
                                        placeholder="Поиск..."
                                        onChange={setSearch}
                                        suggestions={
                                            activeApplicantTab === "team"
                                                ? memberSuggestions
                                                : replycantSuggestions
                                        }
                                        value={search}
                                        className="w-[300px]"
                                    />
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-[160px] h-9 text-[13px] font-sans">
                                            <SelectValue placeholder="По умолчанию" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">По умолчанию</SelectItem>
                                            <SelectItem value="name">По имени</SelectItem>
                                            <SelectItem value="date">По дате добавления</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center h-9 bg-app-surface border border-gray-200 rounded-[10px] overflow-hidden">
                                        <button
                                            onClick={() => setActiveView("grid")}
                                            className={`px-2.5 h-full flex items-center transition-colors ${
                                                activeView === "grid"
                                                    ? "bg-gray-900 text-white"
                                                    : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <Icon name="grid" size={16} />
                                        </button>
                                        <button
                                            onClick={() => setActiveView("list")}
                                            className={`px-2.5 h-full flex items-center transition-colors ${
                                                activeView === "list"
                                                    ? "bg-gray-900 text-white"
                                                    : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <ListIcon size={16} />
                                        </button>
                                    </div>
                                    {showApplyButton && (
                                        <Button
                                            variant="dark"
                                            size="hug36"
                                            className="font-sans text-[13px] font-semibold gap-2"
                                            onClick={() => setApplyDialogOpen(true)}
                                        >
                                            Откликнуться
                                        </Button>
                                    )}
                                    {canManageProject ? (
                                        <Button
                                            variant="dark"
                                            size="hug36"
                                            icon={<Plus size={18} />}
                                            className="font-sans text-[13px] font-semibold gap-2"
                                            onClick={() =>
                                                toast.info("Модалка приглашения появится позже")
                                            }
                                        >
                                            Пригласить
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            <Tabs
                                tabs={applicanttabs}
                                value={activeApplicantTab}
                                onValueChange={setActiveApplicantTab}
                                variant="text"
                            />
                        </section>

                        {activeApplicantTab === "team" ? (
                            activeView === "list" ? (
                                <TableMembers
                                    members={filteredMembers}
                                    removeMember={handleRemoveMember}
                                />
                            ) : (
                                <div className="grid grid-cols-3 gap-6">
                                    {filteredMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="bg-app-surface border border-gray-200 rounded-[20px] p-5 flex flex-col gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-app-text shrink-0">
                                                    {member.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[15px] font-semibold text-app-text truncate">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-[13px] text-app-muted">
                                                        {member.role}
                                                    </p>
                                                </div>
                                            </div>
                                            {member.projects && member.projects.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {member.projects.map((p) => (
                                                        <span
                                                            key={p.id}
                                                            className="inline-flex items-center h-6 px-2 rounded-[8px] bg-gray-100 text-[12px] font-medium text-app-text"
                                                        >
                                                            {p.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {member.resumeUrl && (
                                                <a
                                                    href={member.resumeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[13px] font-medium text-[#2563EB] hover:text-[#1d4ed8]"
                                                >
                                                    Открыть резюме
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <TableInvitations
                                headerList={["Имя", "Роль", "Тип", "Контакты", "Резюме", "Дата"]}
                                members={filteredReplycants}
                                addToTeam={handleAcceptResponse}
                                onReject={handleRejectResponse}
                                canManage={isCreator}
                                currentUserId={user?.id}
                                onAcceptInvitation={handleAcceptInvitation}
                                onRejectInvitation={handleRejectInvitation}
                            />
                        )}
                    </>
                )}
                <ApplyDialog
                    open={applyDialogOpen}
                    onOpenChange={setApplyDialogOpen}
                    projectId={dataProject?.id ?? 0}
                    vacancies={dataProject?.vacancies ?? []}
                />

                <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <DialogContent aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>Вы уверены?</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-gray-600">
                            Это действие необратимо. Все данные проекта будут удалены.
                        </p>
                        <div className="mt-4 space-y-2">
                            <Label>
                                Введите{" "}
                                <span className="font-semibold text-red-600">{project.title}</span>{" "}
                                для подтверждения:
                            </Label>
                            <Input
                                value={deleteConfirmName}
                                onChange={(e) => setDeleteConfirmName(e.target.value)}
                                placeholder={project.title}
                                className="border-red-300 focus-visible:border-red-500 focus-visible:ring-red-200"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="hug36"
                                onClick={() => setDeleteConfirmOpen(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="button"
                                variant="dark"
                                size="hug36"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={!isDeleteConfirmed || deleteProjectMutation.isPending}
                            >
                                {deleteProjectMutation.isPending ? "Удаление..." : "Удалить"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {activeTab === "kanban" && (
                    <>
                        <section>
                            <header className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {columns && columns.length > 0
                                            ? `Всего колонок: ${columns.length}`
                                            : "Начните с создания первой колонки"}
                                    </p>
                                </div>
                                {columns && columns.length > 0 && (
                                    <KanbanFilter
                                        columns={columns}
                                        filter={kanbanFilter}
                                        onFilterChange={setKanbanFilter}
                                        currentUserId={user?.id}
                                    />
                                )}
                            </header>
                        </section>
                        <div className="min-h-[400px] overflow-x-auto">
                            <div className="min-w-min">
                                <KanbanBoard {...boardData} />
                            </div>
                        </div>
                        <TaskPanel
                            isOpen={isTaskPanelOpen}
                            onClose={closePanel}
                            onAutoSave={handleTaskAutoSave}
                            onMoveToColumn={handleTaskMoveToColumn}
                            onDelete={handleDeleteTask}
                            onSubtaskCreate={handleSubtaskCreate}
                            onSubtaskUpdate={handleSubtaskUpdate}
                            onSubtaskDelete={handleSubtaskDelete}
                            task={liveEditingTask}
                            columns={columns || []}
                            projectName={project.title}
                            projectMembers={projectMembers || []}
                        />
                    </>
                )}
            </div>
        </ContentLayout>
    );
};

export default SpaceRoute;
