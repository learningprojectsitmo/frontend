import { Popover } from "@base-ui/react/popover";
import { Tooltip } from "@base-ui/react/tooltip";
import { useMemo, useState, type ReactNode, type Ref } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useProject } from "@/lib/projects";
import type { Attempt, QueueItem } from "@/types/exam";
import type { ProjectFullResponse, ProjectListItemResponse } from "@/types/api";
import type { getExamTimer } from "../exam-timer";
import { getExamProjectLeader } from "../use-exam-projects";

const cardClass = "flex min-w-0 flex-col rounded-[22px] border border-[#0000001A] dark:border-app-border bg-white dark:bg-app-surface p-8";
const controlClass = "inline-flex min-h-10 items-center gap-2 rounded-lg text-left text-sm font-medium text-[#155DFC] dark:text-blue-300 hover:underline disabled:opacity-40 disabled:no-underline";
const timerControlClass = "box-border grid size-12 shrink-0 place-items-center rounded-[14px] border border-[#0000001A] dark:border-app-border bg-white dark:bg-app-surface p-3 text-[#0A0A0A] dark:text-app-text hover:bg-gray-50 dark:hover:bg-app-ghost disabled:opacity-40";
const timerPopupClass = "w-[280px] max-w-[var(--available-width)] rounded-xl border border-app-border bg-app-surface p-4 text-sm text-app-text shadow-lg";
const tickCount = 60;

function projectDescriptionText(description?: string | null) {
    if (!description) return "";
    const template = document.createElement("template");
    template.innerHTML = description;
    template.content.querySelectorAll("script, style").forEach((element) => element.remove());
    template.content.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, br").forEach((element) => element.after("\n"));
    return template.content.textContent?.trim() ?? "";
}

function formatTimerSeconds(seconds: number) {
    return [Math.floor(seconds / 60), seconds % 60].map((part) => String(part).padStart(2, "0")).join(":");
}

function TimerRing({ timer, paused, inTransition, idleLabel }: {
    timer: ReturnType<typeof getExamTimer>;
    paused: boolean;
    inTransition: boolean;
    idleLabel?: string;
}) {
    const { remaining, total, stage } = timer;
    const seconds = Math.abs(remaining);
    const progress = stage && total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0;
    const strokeClass = !inTransition && remaining <= 30 ? "stroke-[#E11D48] dark:stroke-rose-400" : "stroke-[#155DFC] dark:stroke-blue-400";
    const status = stage?.label ?? idleLabel ?? "Ожидаем начала";

    return (
        <div className="relative mx-auto my-5 grid aspect-square w-full max-w-[248px] place-items-center">
            <div aria-hidden="true" className="absolute inset-0">
                {Array.from({ length: tickCount }, (_, index) => (
                    <span
                        key={index}
                        className="absolute inset-0"
                        style={{ transform: `rotate(${index * 360 / tickCount}deg)` }}
                    >
                        <span className="absolute left-1/2 top-0 h-[14px] w-1 -translate-x-1/2 rounded-full bg-[#CFCFCF] dark:bg-slate-600" />
                    </span>
                ))}
            </div>
            {progress > 0 && (
                <svg aria-hidden="true" viewBox="0 0 248 248" className="pointer-events-none absolute inset-0 size-full">
                    <circle cx="124" cy="124" r="114" pathLength="1" fill="none" className={strokeClass} strokeWidth="20" strokeLinecap="round"
                        strokeDasharray={`${progress} 1`} transform="rotate(-90 124 124)" />
                </svg>
            )}
            <div className="flex max-w-[78%] flex-col items-center text-center">
                <span role="timer" className={`whitespace-nowrap font-extrabold leading-none tabular-nums text-[#121212] dark:text-app-text ${seconds >= 6000 ? "text-[34px]" : "text-[clamp(28px,10vw,52px)]"}`}>
                    {remaining < 0 ? "+" : ""}{formatTimerSeconds(seconds)}
                </span>
                <span className="mt-1 text-[17px] text-[#717182] dark:text-app-muted">{status}</span>
                {stage && remaining <= 0 && <span className="text-sm text-[#BE123C] dark:text-rose-300">{remaining < 0 ? "Превышение" : "Время вышло"}</span>}
                {paused && <span className="text-sm text-[#717182] dark:text-app-muted">Приостановлен</span>}
            </div>
        </div>
    );
}

function QuestionsControl({ disabled, overtime, onQuestions }: {
    disabled: boolean;
    overtime: boolean;
    onQuestions: () => void;
}) {
    const [open, setOpen] = useState(false);
    const label = <>Перейти к вопросам <Icon name="arrow-right" size={16} /></>;
    if (overtime && !open) {
        return <button type="button" className={controlClass} disabled={disabled} onClick={onQuestions}>{label}</button>;
    }

    return (
        <Popover.Root open={open && !disabled} onOpenChange={setOpen}>
            <Popover.Trigger className={controlClass} disabled={disabled} onClick={overtime ? onQuestions : undefined}>
                {label}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner positionMethod="fixed" sideOffset={8} collisionPadding={8} className="z-[500]">
                    <Popover.Popup className={timerPopupClass}>
                        <Popover.Title className="font-semibold">Перейти к вопросам?</Popover.Title>
                        <Popover.Description className="mt-1 text-app-muted">Время выступления закончится, и начнётся отсчёт для вопросов.</Popover.Description>
                        <Button type="button" variant="blue" size="hug36" className="mt-3" onClick={() => {
                            setOpen(false);
                            onQuestions();
                        }}>Начать вопросы</Button>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}

function TimerSettings({ href }: { href: string }) {
    return (
        <Popover.Root>
            <Popover.Trigger className={`${timerControlClass} ml-auto`} aria-label="Настройки таймера" title="Настройки таймера">
                <Icon name="settings" size={24} />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner positionMethod="fixed" align="end" sideOffset={8} collisionPadding={8} className="z-[500]">
                    <Popover.Popup className={timerPopupClass}>
                        <Popover.Title className="font-semibold">Перейти на страницу настроек?</Popover.Title>
                        <Link to={href} className="mt-3 inline-flex rounded-lg bg-app-blue px-3 py-2 font-medium text-white hover:opacity-90">
                            Открыть настройки
                        </Link>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}

type ExamPresentationProps = {
    team?: QueueItem;
    project?: ProjectListItemResponse | ProjectFullResponse;
    number?: number;
    attempt?: Attempt | null;
    timer: ReturnType<typeof getExamTimer>;

    canManage: boolean;
    pending: boolean;
    previousUnavailable?: string;
    canGoForward: boolean;
    canStart: boolean;
    playButtonRef?: Ref<HTMLButtonElement>;
    autoStarting?: boolean;
    inTransition: boolean;
    idleLabel?: string;
    onToggle: () => void;
    onQuestions: () => void;
    timerSettingsHref?: string;
    onPrevious: () => void;
    onNext: () => void;
    finishLastDefenseAction?: ReactNode;
};

export function ExamPresentation({
    team, project, number, attempt, timer,
    canManage, pending, previousUnavailable, canGoForward, canStart, playButtonRef, autoStarting, inTransition, idleLabel, onToggle, onQuestions, timerSettingsHref, onPrevious, onNext, finishLastDefenseAction,
}: ExamPresentationProps) {
    const projectQuery = useProject(team ? String(team.project_id) : "");
    const detail = projectQuery.data ?? (project && "members" in project ? project : undefined);
    const shownProject = detail ?? project;
    const description = useMemo(() => projectDescriptionText(shownProject?.description), [shownProject?.description]);
    const members = detail?.members.map((member) => member.name)
        ?? project?.participants_preview.map((member) => member.full_name);
    const paused = Boolean(attempt?.paused_at);
    const backReason = previousUnavailable ?? (pending ? "дождитесь завершения текущего действия." : undefined);
    const previousButton = (
        <button type="button" className={`${controlClass} disabled:pointer-events-none`} onClick={onPrevious} disabled={Boolean(backReason)}>
            <Icon name="arrow-left" size={16} /> Предыдущая команда
        </button>
    );

    return (
        <div className="pt-5">
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr))]">
                <section className={cardClass}>
                    <h2 className="mb-5 text-xl font-semibold text-[#0A0A0A] dark:text-app-text">{team && !attempt ? "К выступлению готовится" : "Текущее выступление"}</h2>
                    {team ? (
                        <>
                            <div className="flex flex-wrap items-start justify-between gap-5">
                                <div className="flex min-w-0 flex-[1_1_180px] items-start gap-5">
                                    <span className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-[#155DFC] text-xl text-white">{number}</span>
                                    <div className="min-w-0">
                                        <h3 className="break-words text-xl text-[#0A0A0A] dark:text-app-text">{shownProject?.name ?? "Проект команды"}</h3>
                                        <p className="mt-1 whitespace-pre-line break-words text-[15px] text-[#6D7585] dark:text-app-muted">{description || "Описание проекта не указано"}</p>
                                    </div>
                                </div>

                            </div>
                            <hr className="my-5 border-[#ECECF0] dark:border-app-border" />
                            <div className="space-y-1 break-words text-[15px] text-[#4A5565] dark:text-slate-300">
                                <p><strong>Руководитель:</strong> {getExamProjectLeader(shownProject) ?? "Имя не указано"}</p>
                                <p><strong>Команда:</strong> {members?.join(", ") || (projectQuery.isFetching ? "Загружаем состав…" : "Состав команды не указан")}</p>
                            </div>
                        </>
                    ) : <p className="text-[15px] text-[#6D7585] dark:text-app-muted">Сейчас никто не выступает.</p>}
                    {(canManage || attempt) && (
                        <div className="mt-auto space-y-2 pt-5">
                            {canManage && (
                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                    {backReason ? (
                                        <Tooltip.Root>
                                            <Tooltip.Trigger render={<span tabIndex={0} />} className="inline-flex">
                                                {previousButton}
                                            </Tooltip.Trigger>
                                            <Tooltip.Portal>
                                                <Tooltip.Positioner sideOffset={8} className="z-[500]">
                                                    <Tooltip.Popup className="max-w-[min(280px,var(--available-width))] rounded-lg border border-app-border bg-app-surface p-3 text-sm text-app-text shadow-lg">
                                                        Переход назад недоступен: {backReason}
                                                    </Tooltip.Popup>
                                                </Tooltip.Positioner>
                                            </Tooltip.Portal>
                                        </Tooltip.Root>
                                    ) : previousButton}
                                    {finishLastDefenseAction ?? (
                                        <button type="button" className={`${controlClass} ml-auto`} onClick={onNext} disabled={pending || !canGoForward}>
                                            Следующая команда <Icon name="arrow-right" size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                            {attempt && (
                                <p className="text-sm text-app-muted">
                                    {canGoForward
                                        ? "Оценивание откроется, когда ведущий завершит выступление или нажмёт «Следующая команда»."
                                        : "Оценивание откроется после завершения выступления."}
                                </p>
                            )}
                        </div>
                    )}
                </section>
                <section className={cardClass}>
                    <h2 className="text-xl font-semibold text-[#0A0A0A] dark:text-app-text">Таймер</h2>
                    <p className="mt-1 text-[15px] text-[#4A5565] dark:text-slate-300">
                        Длительность этапа <span className="ml-1 font-medium tabular-nums">{formatTimerSeconds(timer.total)}</span>
                    </p>
                    <TimerRing timer={timer} paused={paused} inTransition={inTransition} idleLabel={idleLabel} />
                    {autoStarting ? (
                        <p className="mb-4 text-center text-sm text-app-muted" role="status">
                            {inTransition ? "Выступление начнётся автоматически после перехода." : "Запускаем следующее выступление…"}
                        </p>
                    ) : canManage && canStart && !inTransition && (
                        <p className="mb-4 text-center text-sm text-app-muted">Нажмите Play, чтобы начать выступление.</p>
                    )}
                    {canManage && (
                        <div className="mt-auto flex items-center justify-between gap-2">
                            <button type="button" ref={playButtonRef}
                                className={cn(timerControlClass, inTransition && !attempt && "flex w-auto min-w-0 items-center gap-2 text-left text-sm font-medium")} disabled={pending || (!attempt && !canStart)} onClick={onToggle}
                                aria-label={!attempt ? "Начать выступление" : paused ? "Продолжить таймер" : "Приостановить таймер"}>
                                <Icon name={!attempt || paused ? "play" : "pause"} size={24} />
                                {inTransition && !attempt && <span>Начать выступление</span>}
                            </button>
                            {attempt?.status === "speaking" && (
                                <QuestionsControl key={`${attempt.id}:${attempt.version}`} disabled={pending || paused}
                                    overtime={timer.remaining < 0} onQuestions={onQuestions} />
                            )}
                            {timerSettingsHref && <TimerSettings href={timerSettingsHref} />}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
