import { useMemo, useRef, useState } from "react";

import { ContentLayout } from "@/components/layouts";
import { notifyError, notifySuccess } from "@/components/ui/notifications";
import { TableInvitations } from "@/components/ui/tables/tableInvitations";
import { getApiErrorMessage } from "@/lib/api-client";
import {
    useAcceptInvitation,
    useAcceptResponse,
    useAllResponses,
    useCancelInvitation,
    useConfirmJoinResponse,
    useRejectInvitation,
    useRejectResponse,
} from "@/lib/projects";
import { useProfile } from "@/lib/profile";
import { normalizeResumeHref } from "@/lib/resume";
import { useSpacesList } from "@/lib/spaces";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { RejectResponseDialog } from "@/features/project/components/reject-response-dialog";
import type { ResponseListItem } from "@/types/api";
import type { Replycant } from "@/types/tables/forTables";

const STATUS_OPTIONS = [
    { value: "all", label: "Все статусы" },
    { value: "pending", label: "Ожидает" },
    { value: "accepted", label: "Принят" },
    { value: "rejected", label: "Отклонён" },
    { value: "withdrawn", label: "Отозван" },
    { value: "cancelled", label: "Отозвано руководителем" },
    { value: "in_team", label: "Уже в команде" },
];

const TYPE_OPTIONS = [
    { value: "all", label: "Все" },
    { value: "response", label: "Отклики" },
    { value: "invitation", label: "Приглашения" },
];

/** Верхняя граница `limit` на бэкенде — 100, при большей приходит 422. */
const PAGE_SIZE_OPTIONS = [20, 50, 100];

const RESPONSE_STATUSES = new Set<string>([
    "pending",
    "accepted",
    "rejected",
    "withdrawn",
    "cancelled",
    "in_team",
]);

/** Статус ответа лежит в `error.response`, но тип ошибки — `unknown`. */
const getErrorStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

const ApplicationsRoute = () => {
    const { data: profile } = useProfile();
    const { data: workspacesData } = useSpacesList();

    const [type, setType] = useState<"all" | "response" | "invitation">("all");
    const [status, setStatus] = useState<string>("all");
    const [workspaceId, setWorkspaceId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(50);

    const debouncedSearch = useDebouncedValue(search, 300);

    const params = useMemo(
        () => ({
            type,
            status: status === "all" ? null : status,
            workspaceId,
            projectId,
            search: debouncedSearch.trim() || null,
            page,
            limit,
        }),
        [type, status, workspaceId, projectId, debouncedSearch, page, limit],
    );

    const { data: responsesData, isLoading, isError, error, refetch } = useAllResponses(params);

    // Оборачиваем в useMemo: `?? []` создаёт новый массив на каждом рендере,
    // из-за чего зависимости useMemo ниже менялись бы на каждом рендере.
    const items = useMemo(() => responsesData?.items ?? [], [responsesData]);
    const total = responsesData?.total ?? 0;
    const totalPages = responsesData?.total_pages ?? 0;

    const acceptResponseMutation = useAcceptResponse();
    const rejectResponseMutation = useRejectResponse();
    const confirmJoinMutation = useConfirmJoinResponse();
    const acceptInvitationMutation = useAcceptInvitation();
    const rejectInvitationMutation = useRejectInvitation();
    const cancelInvitationMutation = useCancelInvitation();

    /**
     * Таблица отдаёт обработчикам только id записи, а эндпоинты принятия
     * отклика адресуются как `/projects/{project_id}/responses/{response_id}`.
     * Поэтому рядом с группами держим соответствие «запись → проект».
     */
    const projectIdByResponseId = useMemo(() => {
        const map = new Map<number, { projectId: number; workspaceId: number | null }>();
        items.forEach((item) => {
            map.set(item.id, { projectId: item.project_id, workspaceId: item.workspace_id });
        });
        return map;
    }, [items]);

    const workspaces = useMemo(() => workspacesData?.spaces ?? [], [workspacesData]);
    const workspaceOptions = useMemo(
        () => workspaces.map((w) => ({ value: w.id, label: w.title })),
        [workspaces],
    );

    const groups = useMemo(() => {
        const map = new Map<
            string,
            {
                projectId: number;
                projectName: string;
                workspaceName: string | null;
                items: Replycant[];
            }
        >();

        items.forEach((item: ResponseListItem) => {
            const key = String(item.project_id);
            let group = map.get(key);
            if (!group) {
                group = {
                    projectId: item.project_id,
                    projectName: item.project_name,
                    workspaceName: item.workspace_name,
                    items: [],
                };
                map.set(key, group);
            }

            const responseStatus = RESPONSE_STATUSES.has(item.status)
                ? (item.status as Replycant["responseStatus"])
                : "pending";

            group.items.push({
                id: item.id,
                userId: item.user_id,
                name: item.name,
                priority: 0,
                contacts: item.respondent_email ?? "",
                resumeUrl: normalizeResumeHref(item.resume_url),
                responseDate: item.response_date,
                role: item.role,
                type: item.type === "invitation" ? "invitation" : "response",
                responseStatus,
                status: responseStatus === "accepted" ? "invited" : "invite",
                allowMultiProjectParticipation: item.allow_multi_project_participation,
                busyInOtherProject: item.busy_in_other_project,
                rejectionReason: item.rejection_reason,
            });
        });

        return Array.from(map.values()).map((g) => ({
            key: String(g.projectId),
            projectName: g.projectName,
            workspaceName: g.workspaceName,
            items: g.items,
        }));
    }, [items]);

    /**
     * Таблица отдаёт обработчикам только id записи, а эндпоинты действий
     * адресуются по id проекта. Если записи нет в мапе (список обновился
     * раньше клика) — не отправляем заведомо неверный запрос.
     */
    const getActionTarget = (responseId: number) => projectIdByResponseId.get(responseId);

    /**
     * Клик по кнопке действия может прийти повторно раньше, чем React перерисует
     * кнопку: setState применяется на следующем рендере, поэтому два клика в
     * одном тике успевают пройти оба, и на каждый уходит свой PATCH. Сервер на
     * каждый такой запрос добавлял по строке участия — человек оказывался в
     * команде дважды.
     *
     * Ref, а не state: меняется немедленно, без ожидания рендера, поэтому
     * второй клик отсекается в том же тике. Снятие блокировки — в `finally`.
     */
    const inFlightIds = useRef(new Set<number>());

    /** `false` — действие по этой записи уже выполняется, повторный клик игнорируем. */
    const beginAction = (responseId: number): boolean => {
        if (inFlightIds.current.has(responseId)) return false;
        inFlightIds.current.add(responseId);
        return true;
    };

    const endAction = (responseId: number): void => {
        inFlightIds.current.delete(responseId);
    };

    /** id записи, действие по которой сейчас в полёте: для блокировки кнопок. */
    const pendingActionId =
        [
            acceptResponseMutation,
            rejectResponseMutation,
            confirmJoinMutation,
            acceptInvitationMutation,
            rejectInvitationMutation,
            cancelInvitationMutation,
        ].find((mutation) => mutation.isPending)?.variables?.responseId ?? null;

    const handleAcceptResponse = (responseId: number) => {
        const target = getActionTarget(responseId);
        if (!target) {
            notifyError("Не удалось принять отклик", "Запись не найдена в списке");
            return;
        }
        if (!beginAction(responseId)) return;
        acceptResponseMutation
            .mutateAsync({ ...target, responseId })
            .then(() => notifySuccess("Отклик принят"))
            .catch((err: unknown) =>
                notifyError(
                    "Не удалось принять отклик",
                    getApiErrorMessage(err, "Попробуйте позже"),
                ),
            )
            .finally(() => endAction(responseId));
    };

    /**
     * Отказ открывает диалог с опциональной причиной, поэтому обработчик
     * только запоминает запись, а отправка идёт из `handleRejectConfirmed`.
     */
    const [rejectTarget, setRejectTarget] = useState<number | null>(null);
    const rejectTargetName = items.find((item) => item.id === rejectTarget)?.name ?? "";

    const handleRejectResponse = (responseId: number) => {
        const target = getActionTarget(responseId);
        if (!target) {
            notifyError("Не удалось отклонить отклик", "Запись не найдена в списке");
            return;
        }
        setRejectTarget(responseId);
    };

    const handleRejectConfirmed = (reason: string | null) => {
        if (rejectTarget === null) return;
        const target = getActionTarget(rejectTarget);
        if (!target) {
            setRejectTarget(null);
            notifyError("Не удалось отклонить отклик", "Запись не найдена в списке");
            return;
        }
        if (!beginAction(rejectTarget)) return;
        const responseId = rejectTarget;
        rejectResponseMutation
            .mutateAsync({ ...target, responseId, reason })
            .then(() => {
                notifySuccess("Отклик отклонён");
                setRejectTarget(null);
            })
            .catch((err: unknown) =>
                notifyError(
                    "Не удалось отклонить отклик",
                    getApiErrorMessage(err, "Попробуйте позже"),
                ),
            )
            .finally(() => endAction(responseId));
    };

    const handleConfirmJoin = (responseId: number) => {
        const target = getActionTarget(responseId);
        if (!target) {
            notifyError("Не удалось подтвердить участие", "Запись не найдена в списке");
            return;
        }
        if (!beginAction(responseId)) return;
        confirmJoinMutation
            .mutateAsync({ ...target, responseId })
            .then(() => notifySuccess("Участие подтверждено"))
            .catch((err: unknown) =>
                notifyError(
                    "Не удалось подтвердить участие",
                    getApiErrorMessage(err, "Попробуйте позже"),
                ),
            )
            .finally(() => endAction(responseId));
    };

    const handleAcceptInvitation = (responseId: number) => {
        const target = getActionTarget(responseId);
        if (!target) {
            notifyError("Не удалось принять приглашение", "Запись не найдена в списке");
            return;
        }
        if (!beginAction(responseId)) return;
        acceptInvitationMutation
            .mutateAsync({ ...target, responseId })
            .then(() => notifySuccess("Приглашение принято"))
            .catch((err: unknown) =>
                notifyError(
                    "Не удалось принять приглашение",
                    getApiErrorMessage(err, "Попробуйте позже"),
                ),
            )
            .finally(() => endAction(responseId));
    };

    const handleRejectInvitation = (responseId: number) => {
        const target = getActionTarget(responseId);
        if (!target) {
            notifyError("Не удалось отклонить приглашение", "Запись не найдена в списке");
            return;
        }
        if (!beginAction(responseId)) return;
        rejectInvitationMutation
            .mutateAsync({ ...target, responseId })
            .then(() => notifySuccess("Приглашение отклонено"))
            .catch((err: unknown) =>
                notifyError(
                    "Не удалось отклонить приглашение",
                    getApiErrorMessage(err, "Попробуйте позже"),
                ),
            )
            .finally(() => endAction(responseId));
    };

    const handleCancelInvitation = (responseId: number) => {
        const target = getActionTarget(responseId);
        if (!target) {
            notifyError("Не удалось отозвать приглашение", "Запись не найдена в списке");
            return;
        }
        if (!beginAction(responseId)) return;
        cancelInvitationMutation
            .mutateAsync({ ...target, responseId })
            .then(() => notifySuccess("Приглашение отозвано"))
            .catch((err: unknown) =>
                notifyError(
                    "Не удалось отозвать приглашение",
                    getApiErrorMessage(err, "Попробуйте позже"),
                ),
            )
            .finally(() => endAction(responseId));
    };

    const isAllowed = profile?.role === "admin" || profile?.role === "teacher";

    if (profile && !isAllowed) {
        return (
            <ContentLayout title="Все отклики и приглашения">
                <div className="px-6 py-8">
                    <div className="text-app-muted">Доступ запрещён</div>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Все отклики и приглашения">
            <div className="px-6 py-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-app-text">
                            Все отклики и приглашения
                        </h1>
                        <p className="mt-1 text-sm text-app-muted">Сгруппированы по проектам</p>
                    </div>
                    <div className="text-sm text-app-muted">Всего: {total}</div>
                </div>

                <div className="flex flex-wrap items-center gap-3 p-4 bg-app-surface rounded-xl border border-app-border">
                    <select
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value as "all" | "response" | "invitation");
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text"
                    >
                        {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={workspaceId ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setWorkspaceId(v ? Number(v) : null);
                            setProjectId(null);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text"
                    >
                        <option value="">Все пространства</option>
                        {workspaceOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Поиск по ФИО или email"
                        className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text flex-1 min-w-[200px]"
                    />

                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text"
                    >
                        {/* 200 нельзя: бэкенд ограничивает limit сверху (le=100),
                            и запрос с limit=200 отваливается с 422, а не с данными. */}
                        {PAGE_SIZE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                                {n} на странице
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            setType("all");
                            setStatus("all");
                            setWorkspaceId(null);
                            setProjectId(null);
                            setSearch("");
                            setPage(1);
                        }}
                        className="px-3 py-2 text-sm text-app-muted hover:text-app-text"
                    >
                        Сбросить фильтры
                    </button>
                </div>

                <div>
                    <TableInvitations
                        headerList={["Кандидат", "Роль", "Тип", "Контакты", "Резюме", "Дата"]}
                        members={[]}
                        grouped
                        groups={groups}
                        currentUserId={profile?.id}
                        addToTeam={handleAcceptResponse}
                        onReject={handleRejectResponse}
                        onConfirmJoin={handleConfirmJoin}
                        onAcceptInvitation={handleAcceptInvitation}
                        onRejectInvitation={handleRejectInvitation}
                        onCancelInvitation={handleCancelInvitation}
                        pendingActionId={pendingActionId}
                        canManage={isAllowed}
                    />
                    <RejectResponseDialog
                        open={rejectTarget !== null}
                        applicantName={rejectTargetName}
                        loading={rejectResponseMutation.isPending}
                        onOpenChange={(open) => {
                            if (!open && !rejectResponseMutation.isPending) setRejectTarget(null);
                        }}
                        onConfirm={handleRejectConfirmed}
                    />
                    {isLoading && <div className="mt-4 text-sm text-app-muted">Загрузка...</div>}
                    {isError && (
                        <div className="mt-4 flex items-center gap-3 text-sm text-red-600">
                            <span>
                                {getErrorStatus(error) === 403
                                    ? "Список доступен только администраторам и преподавателям"
                                    : "Не удалось загрузить отклики"}
                            </span>
                            <button
                                onClick={() => void refetch()}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                Повторить
                            </button>
                        </div>
                    )}
                    {!isLoading && !isError && items.length === 0 && (
                        <div className="mt-4 text-sm text-app-muted">Данных не найдено</div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-app-muted">
                        Страница {page} из {totalPages || 1}
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text disabled:opacity-50"
                        >
                            Назад
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-3 py-2 border border-app-border rounded-lg text-sm bg-app-surface text-app-text disabled:opacity-50"
                        >
                            Вперёд
                        </button>
                    </div>
                </div>
            </div>
        </ContentLayout>
    );
};

export default ApplicationsRoute;
