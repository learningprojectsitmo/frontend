import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Tooltip } from "@base-ui/react/tooltip";
import { queryOptions, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, FilePenLine, FileText, LoaderCircle, Maximize2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog/dialog";
import { examGradingApi, getGradingError, gradingKey, roleTitles, type RegistryItem } from "@/lib/exam-grading";
import { paths } from "@/config/paths";
import { isExamAccessDenied } from "@/lib/exams";
import { formatExamDate } from "../exam-display";
import { getExamProjectLeader, useExamProjects } from "../use-exam-projects";

const states = { undecided: "На утверждении", accepted: "Утверждён", published: "Опубликован" };
const scoreText = (score?: string | number | null) => score == null ? "—" : Number(score).toFixed(2);
const tooltipRoles = ["member", "manager", "teacher"] as const;
const tooltipScore = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tooltipWeight = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
const fieldClass = "rounded-lg border border-app-border bg-app-surface p-2 text-sm text-app-text";

export function ExamScoreStatus({ label, onOpen }: { label: string; onOpen?: () => void }) {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger type="button" aria-label={label} onClick={onOpen}
                className={`inline-grid size-8 place-items-center rounded-lg text-app-muted hover:bg-app-ghost ${onOpen ? "cursor-pointer" : "cursor-help"}`}>
                {label === "Оценка скоро появится" ? <Clock3 size={16} aria-hidden="true" />
                    : label === "Утвердить оценку" ? <FilePenLine size={16} aria-hidden="true" />
                    : label === "Идёт оценивание" ? <LoaderCircle size={16} aria-hidden="true" className="motion-safe:animate-spin" />
                    : <FileText size={16} aria-hidden="true" />}
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Positioner positionMethod="fixed" align="end" sideOffset={8} className="z-[500]">
                    <Tooltip.Popup className="rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs text-app-text shadow-lg">
                        {label}
                    </Tooltip.Popup>
                </Tooltip.Positioner>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

export function ExamScore({ item, onOpen, workspaceId, examId }: {
    item: RegistryItem; onOpen: () => void; workspaceId: number; examId: number;
}) {
    const [hover, setHover] = useState(false);
    const result = useQuery({
        queryKey: [...gradingKey(workspaceId, examId), "result", item.attempt_id],
        queryFn: () => examGradingApi.result(workspaceId, examId, item.attempt_id),
        enabled: hover,
        staleTime: 10_000,
    });
    return (
        <Tooltip.Root onOpenChange={setHover}>
            <Tooltip.Trigger type="button" onClick={onOpen} aria-label={`Итог команды ${item.project_name}: ${scoreText(item.current?.final_score)}`}
                className="cursor-pointer rounded-lg px-2 py-2 text-sm font-semibold text-app-blue hover:bg-app-ghost dark:text-blue-300">
                {scoreText(item.current?.final_score)}
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Positioner positionMethod="fixed" align="end" sideOffset={8} collisionPadding={8} className="z-[500]">
                    <Tooltip.Popup className="max-w-[var(--available-width)] rounded-xl border border-app-border bg-app-surface px-3 py-2 text-xs text-app-text shadow-lg">
                        {result.isSuccess && result.data.preliminary ? (
                            <div className="grid grid-cols-3 divide-x divide-[#0000001A] dark:divide-app-border">
                                {tooltipRoles.map((role) => {
                                    const group = result.data.preliminary?.roles.find((entry) => entry.role === role);
                                    return (
                                        <div key={role} className="px-2 first:pl-0 last:pr-0 sm:px-3">
                                            <span className="mb-0.5 block text-[13px] font-semibold leading-4 text-[#0A0A0A] dark:text-app-text">
                                                {group?.average == null ? "—" : tooltipScore.format(Number(group.average))}
                                            </span>
                                            <span className="block text-[11px] leading-4 text-[#4A5565] dark:text-slate-300">{roleTitles[role]}</span>
                                            <span className="block whitespace-nowrap text-[11px] leading-4 text-[#6A7282] dark:text-app-muted">
                                                Вес: {group == null ? "—" : tooltipWeight.format(group.weight / 100)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : result.isError ? getGradingError(result.error) : result.isSuccess ? "Расчёт пока недоступен" : "Загружаем разбивку…"}
                    </Tooltip.Popup>
                </Tooltip.Positioner>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
}

export function ExamResultsRegistry({ workspaceId, examId, items, canDownload, onOpen }: {
    workspaceId: number; examId: number; items: RegistryItem[]; canDownload: boolean; onOpen?: (item: RegistryItem) => void;
}) {
    const [search, setSearch] = useState("");
    const [state, setState] = useState("");
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const standalone = !onOpen;
    const [page, setPage] = useState(0);
    const pageSize = 15;
    const visible = items.filter((item) => (!state || item.state === state) &&
        item.project_name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
    const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
    const currentPage = Math.min(page, pageCount - 1);
    const rows = visible.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    const projects = useExamProjects([], standalone ? rows.map((item) => item.project_id) : [], false);
    const details = useQueries({
        queries: rows.map((item) => queryOptions({
            queryKey: [...gradingKey(workspaceId, examId), "result", item.attempt_id],
            queryFn: () => examGradingApi.result(workspaceId, examId, item.attempt_id),
            enabled: standalone || open,
            staleTime: 10_000,
            refetchInterval: open && !canDownload ? 15_000 : false,
            retry: false,
        })),
    });
    const download = useMutation({
        mutationFn: () => examGradingApi.csv(workspaceId, examId),
        onSuccess: (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `exam-${examId}-csv.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        onError: (error) => {
            const status = isAxiosError(error) ? error.response?.status : undefined;
            if (isExamAccessDenied(error)) toast.error("Архив недоступен для вашей роли или этого экзамена.");
            else if (status === 413) toast.error("Архив превышает допустимый размер.");
            else if (status === 409) toast.error("Не удалось подготовить архив. Проверьте данные оценивания в экзамене.");
            else toast.error("Не удалось скачать архив CSV. Попробуйте ещё раз.");
        },
    });
    const tableContent = (
        <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <input aria-label="Поиск по итогам" placeholder="Поиск команды" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} className={fieldClass} />
                <select aria-label="Статус итога" value={state} onChange={(event) => { setState(event.target.value); setPage(0); }} className={fieldClass}>
                    <option value="">Все статусы</option>
                    {Object.entries(states).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <Button variant="outline" size="hug36" loading={download.isPending} onClick={() => {
                    if (canDownload) download.mutate();
                    else toast.warning("Сначала завершите экзамен");
                }}>Скачать CSV (ZIP)</Button>
            </div>
            {rows.length ? (
                <>
                    <div className="mt-4 overflow-x-auto rounded-2xl border border-app-border" tabIndex={0} role="region" aria-label="Таблица итогов">
                        <table className="w-full border-collapse text-left text-sm text-app-text">
                            <thead className="border-b border-app-border bg-gray-50 dark:bg-app-ghost">
                                <tr>
                                    <th scope="col" className="h-14 px-6 font-semibold">Команда / проект</th>
                                    {standalone && <th scope="col" className="h-14 px-4 font-semibold">Руководитель</th>}
                                    {Object.entries(roleTitles).map(([role, title]) => (
                                        <th key={role} scope="col" className="h-14 whitespace-nowrap px-4 font-semibold">{title}</th>
                                    ))}
                                    <th scope="col" className="h-14 px-4 font-semibold">Итог</th>
                                    <th scope="col" className="h-14 px-4 font-semibold">Статус</th>
                                    <th scope="col" className="h-14 px-4 font-semibold">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((item, index) => {
                                    const detail = details[index];
                                    const preliminary = detail.isSuccess ? detail.data.preliminary : null;
                                    return (
                                        <tr key={item.attempt_id} className="border-b border-app-border transition-colors last:border-0 hover:bg-gray-50 dark:hover:bg-app-ghost">
                                            <td className="min-w-44 px-6 py-4 font-medium">
                                                <Link to={paths.app.project.getHref(item.project_id)} className="text-app-blue hover:underline dark:text-blue-300">{item.project_name}</Link>
                                            </td>
                                            {standalone && (
                                                <td className="min-w-44 px-4 py-4">
                                                    {getExamProjectLeader(projects.get(item.project_id)) ?? "—"}
                                                </td>
                                            )}
                                            {Object.keys(roleTitles).map((role) => {
                                                const group = preliminary?.roles.find((entry) => entry.role === role);
                                                const sheetMax = preliminary?.snapshot.sheet_max;
                                                return (
                                                    <td key={role} className="whitespace-nowrap px-4 py-4 tabular-nums">
                                                        {group ? (
                                                            <>
                                                                <span>{group.average == null ? "Нет оценок" : `${scoreText(group.average)} / ${sheetMax}`}</span>
                                                                <span className="block text-xs text-app-muted">
                                                                    Вес {group.weight}%{standalone && ` · Оценок: ${group.sheets_count}`}
                                                                </span>
                                                            </>
                                                        ) : <span className="text-app-muted">{detail.isError ? "Недоступно" : detail.isSuccess ? "Нет расчёта" : "Загрузка…"}</span>}
                                                    </td>
                                                );
                                            })}
                                            <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums">
                                                {item.current ? `${scoreText(item.current.final_score)} / ${scoreText(item.current.max_score)}` : "—"}
                                                {standalone && !item.current && preliminary?.score != null && (
                                                    <span className="block text-xs font-normal text-app-muted">
                                                        Расчёт {scoreText(preliminary.score)} / {scoreText(preliminary.snapshot.max_score)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <span className="rounded-full bg-app-ghost px-2.5 py-1 text-xs font-medium">{states[item.state]}</span>
                                                {item.settings_outdated && <span className="mt-1 block text-xs text-app-muted">Настройки изменились</span>}
                                            </td>
                                            <td className="px-4 py-4">
                                                {onOpen ? (
                                                    <Button variant="outline" size="hug36" onClick={() => onOpen(item)}>
                                                        {item.state === "undecided" ? "Открыть итог" : "Подробности"}
                                                    </Button>
                                                ) : (
                                                    <Button asChild variant="outline" size="hug36" className="whitespace-nowrap">
                                                        <Link to={paths.app.examView.getHref(workspaceId, examId)}>Открыть экзамен</Link>
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-xs text-app-muted">По группам показан текущий расчёт и настроенные веса.</p>
                    {pageCount > 1 && (
                        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-app-muted">
                            <Button variant="outline" size="hug36" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Назад</Button>
                            <span>{currentPage + 1} из {pageCount}</span>
                            <Button variant="outline" size="hug36" disabled={currentPage + 1 === pageCount} onClick={() => setPage(currentPage + 1)}>Далее</Button>
                        </div>
                    )}
                </>
            ) : <p className="mt-3 text-sm text-app-muted">{items.length ? "Команды по этим фильтрам не найдены." : "Пока нет завершённых защит с оцениванием."}</p>}
        </>
    );
    const content = (
        <Dialog open={expanded} onOpenChange={setExpanded}>
            {items.length > 0 && (
                <div className="mt-3 flex justify-end">
                    <DialogTrigger asChild>
                        <Button variant="outline" size="hug36" aria-label="Расширить таблицу итогов" title="Расширить таблицу" className="!px-2.5">
                            <Maximize2 aria-hidden="true" size={16} />
                        </Button>
                    </DialogTrigger>
                </div>
            )}
            {!expanded && tableContent}
            <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-2 p-3 sm:p-6">
                <DialogHeader className="shrink-0 pr-8 text-left">
                    <DialogTitle>Ведомость экзамена</DialogTitle>
                </DialogHeader>
                {expanded && <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{tableContent}</div>}
            </DialogContent>
        </Dialog>
    );
    if (standalone) return content;
    return (
        <details onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded-[20px] border border-app-border bg-app-surface p-5">
            <summary className="cursor-pointer font-semibold text-app-text">Ведомость экзамена</summary>
            {content}
        </details>
    );
}

export function ExamResultDialog({ workspaceId, examId, item, onClose, windowOpen }: {
    workspaceId: number; examId: number; item: RegistryItem; onClose: () => void; windowOpen: boolean;
}) {
    const attemptId = item.attempt_id;
    const prefix = gradingKey(workspaceId, examId);
    const client = useQueryClient();
    const [reason, setReason] = useState("");
    const [manual, setManual] = useState("");
    const result = useQuery({
        queryKey: [...prefix, "result", attemptId],
        queryFn: () => examGradingApi.result(workspaceId, examId, attemptId),
        refetchInterval: windowOpen ? 5000 : false,
    });
    const editions = useQuery({
        queryKey: [...prefix, "editions", attemptId],
        queryFn: () => examGradingApi.editions(workspaceId, examId, attemptId),
    });
    const participation = useQuery({
        queryKey: [...prefix, "participation", attemptId],
        queryFn: () => examGradingApi.participation(workspaceId, examId, attemptId),
        refetchInterval: windowOpen ? 5000 : false,
    });
    useEffect(() => {
        if (windowOpen) return;
        void client.invalidateQueries({ queryKey: [...gradingKey(workspaceId, examId), "result", attemptId] });
        void client.invalidateQueries({ queryKey: [...gradingKey(workspaceId, examId), "participation", attemptId] });
    }, [client, workspaceId, examId, attemptId, windowOpen]);
    const edition = editions.isSuccess ? editions.data.items.at(-1) : undefined;
    const preliminary = result.isSuccess ? result.data.preliminary : null;
    const version = edition?.version ?? 0;
    const mutation = useMutation({
        mutationFn: (action: "accept" | "manual" | "publish") =>
            examGradingApi.decide(workspaceId, examId, attemptId, action, {
                expected_version: version,
                ...(action !== "publish" && reason.trim() ? { reason: reason.trim() } : {}),
                ...(action === "manual" ? { final_score: manual.replace(",", ".") } : {}),
            }),
        onSuccess: async () => {
            setReason("");
            setManual("");
            await client.invalidateQueries({ queryKey: prefix });
            toast.success("Итог обновлён");
        },
        onError: async () => { await client.invalidateQueries({ queryKey: prefix }); },
    });
    const denied = [result.error, editions.error, participation.error].some(isExamAccessDenied);
    const max = Number(preliminary?.snapshot.max_score);
    const canDecide = !denied && result.isSuccess && editions.isSuccess && !windowOpen && !mutation.isPending && Boolean(preliminary);
    const numeric = manual.replace(",", ".");
    const canManual = canDecide && Boolean(reason.trim()) && /^\d+(?:\.\d{1,2})?$/.test(numeric) && Number(numeric) <= max;
    const participants = participation.isSuccess ? participation.data : null;

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
            <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>{item.project_name}</DialogTitle></DialogHeader>
                {denied ? <p role="alert" className="mt-4 text-sm text-app-muted">Итоги недоступны для вашей роли.</p> : (
                    <div className="mt-4 grid gap-4 text-sm text-app-text">
                        {result.isError && <p role="alert">{getGradingError(result.error)}</p>}
                        {result.isPending && <p role="status">Загружаем результаты…</p>}
                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-app-ghost p-4">
                            <span>Расчётный балл <strong className="block text-xl">{scoreText(preliminary?.score)}</strong></span>
                            <span>Принятый итог <strong className="block text-xl">{scoreText(edition?.final_score)}</strong></span>
                            {preliminary && <span className="text-app-muted">Максимум {scoreText(max)}</span>}
                            {edition && <span className="text-app-muted">Редакция {version} · {edition.published_at ? "Опубликован" : "Принят"}</span>}
                        </div>
                        {result.data?.outdated && <p>Расчёт изменился с момента принятия итога.</p>}
                        {windowOpen ? <p>Принять итог можно после закрытия оценивания.</p> : result.isSuccess && (
                            <div className="grid gap-2">
                                <label className="grid gap-1">Причина решения
                                    <textarea value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} className={fieldClass} />
                                </label>
                                <label className="grid gap-1">Ручной балл
                                    <input inputMode="decimal" value={manual} onChange={(event) => setManual(event.target.value)} className={fieldClass} />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="blue" size="hug36" disabled={!canDecide || preliminary?.score == null || (version > 0 && !reason.trim())} onClick={() => mutation.mutate("accept")}>Утвердить расчёт</Button>
                                    <Button variant="outline" size="hug36" disabled={!canManual} onClick={() => mutation.mutate("manual")}>Установить вручную</Button>
                                    <Button variant="outline" size="hug36" disabled={!edition || Boolean(edition.published_at) || mutation.isPending} onClick={() => mutation.mutate("publish")}>Опубликовать</Button>
                                </div>
                            </div>
                        )}
                        {mutation.isError && <p role="alert">{getGradingError(mutation.error)}</p>}
                        <details className="rounded-lg border border-app-border p-3">
                            <summary className="cursor-pointer font-medium">История редакций</summary>
                            {editions.isError ? <p>{getGradingError(editions.error)}</p> : !editions.isSuccess ? <p>Загружаем историю…</p>
                                : !editions.data.items.length ? <p>Редакций пока нет.</p>
                                : <ul className="mt-2 space-y-2">{editions.data.items.map((row) => (
                                    <li key={row.version}>Версия {row.version} · {scoreText(row.final_score)} · {row.kind === "manual" ? "Вручную" : "По расчёту"} · {formatExamDate(row.decided_at)} · {row.published_at ? "Опубликована" : "Принята"}{row.reason ? ` · ${row.reason}` : ""}</li>
                                ))}</ul>}
                        </details>
                        <details className="rounded-lg border border-app-border p-3">
                            <summary className="cursor-pointer font-medium">Участие в оценивании</summary>
                            {participation.isError ? <p>{getGradingError(participation.error)}</p> : participants ? (
                                <>
                                    <p className="mt-2 text-app-muted">Допущено {participants.summary.total.admitted} · отправили {participants.summary.total.submitted} · не отправили {participants.summary.total.not_submitted} · исключено {participants.summary.total.excluded}</p>
                                    {participants.state === "not_offered" && <p>Оценивание не открывалось.</p>}
                                    <ul className="mt-2 divide-y divide-app-border">{participants.items.map((row) => (
                                        <li key={row.user_id} className="py-2">
                                            {row.name} · {roleTitles[row.role]} · {row.status === "excluded"
                                                ? row.exclusion_reason === "manager_of_defending_team" ? "Исключён: руководитель команды" : "Исключён: участник команды"
                                                : row.submission ? `Отправил ${row.submission.total} баллов · ${formatExamDate(row.submission.submitted_at)}` : "Не отправил"}
                                            {row.submission && (
                                                <details className="mt-1 text-app-muted">
                                                    <summary className="cursor-pointer">Последняя отправленная оценка</summary>
                                                    <ol className="list-decimal pl-5">{row.submission.answers.map((answer) => (
                                                        <li key={answer.question_id}>{answer.score} баллов{answer.comment ? ` · ${answer.comment}` : ""}</li>
                                                    ))}</ol>
                                                </details>
                                            )}
                                        </li>
                                    ))}</ul>
                                </>
                            ) : <p>Загружаем участие…</p>}
                        </details>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
