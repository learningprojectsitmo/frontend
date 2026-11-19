import { Popover } from "@base-ui/react/popover";
import { Tooltip } from "@base-ui/react/tooltip";
import { useMemo, useState, type FormEvent } from "react";

import { Icon } from "@/components/ui/icons";
import { useProject } from "@/lib/projects";
import type { Attempt, QueueItem } from "@/types/exam";
import type { ProjectFullResponse, ProjectListItemResponse } from "@/types/api";
import { timerStages, type getExamTimer, type TimerDurations } from "../exam-timer";
import { getExamProjectLeader } from "../use-exam-projects";

const cardClass = "flex min-w-0 flex-col rounded-[22px] border border-[#0000001A] bg-white p-8";
const controlClass = "inline-flex min-h-10 items-center gap-2 rounded-lg text-left text-sm font-medium text-[#155DFC] hover:underline disabled:opacity-40 disabled:no-underline";
const timerControlClass = "box-border grid size-12 shrink-0 place-items-center rounded-[14px] border border-[#0000001A] bg-white p-3 text-[#0A0A0A] hover:bg-gray-50 disabled:opacity-40";
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

function TimerRing({ timer, paused }: {
    timer: ReturnType<typeof getExamTimer>;
    paused: boolean;
}) {
    const { remaining, total, stage } = timer;
    const seconds = Math.abs(remaining);
    const progress = stage ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0;
    const color = remaining <= 30 ? "#E11D48" : "#155DFC";
    const status = remaining < 0 ? "Превышение" : remaining === 0 ? "Время вышло" : stage?.label ?? "Ожидает начала";

    return (
        <div className="relative mx-auto my-5 grid aspect-square w-full max-w-[248px] place-items-center">
            <div aria-hidden="true" className="absolute inset-0">
                {Array.from({ length: tickCount }, (_, index) => (
                    <span
                        key={index}
                        className="absolute inset-0"
                        style={{ transform: `rotate(${index * 360 / tickCount}deg)` }}
                    >
                        <span className="absolute left-1/2 top-0 h-[14px] w-1 -translate-x-1/2 rounded-full bg-[#CFCFCF]" />
                    </span>
                ))}
            </div>
            {progress > 0 && (
                <svg aria-hidden="true" viewBox="0 0 248 248" className="pointer-events-none absolute inset-0 size-full">
                    <circle cx="124" cy="124" r="117" pathLength="1" fill="none" stroke={color} strokeWidth="14"
                        strokeDasharray={`${progress} 1`} transform="rotate(-90 124 124)" />
                </svg>
            )}
            <div className="flex max-w-[78%] flex-col items-center text-center">
                <span role="timer" className={`whitespace-nowrap font-extrabold leading-none tabular-nums text-[#121212] ${seconds >= 6000 ? "text-[34px]" : "text-[clamp(28px,10vw,52px)]"}`}>
                    {remaining < 0 ? "+" : ""}{formatTimerSeconds(seconds)}
                </span>
                <span className="mt-1 text-[17px] text-[#717182]">{status}</span>
                {paused && <span className="text-sm text-[#717182]">Приостановлен</span>}
            </div>
        </div>
    );
}

function TimerSettings({ durations, disabled, running, onSave }: {
    durations: TimerDurations;
    disabled: boolean;
    running: boolean;
    onSave: (value: TimerDurations) => void;
}) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const save = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (disabled || running) return;
        const fields = new FormData(event.currentTarget);
        const secondsFor = (key: keyof TimerDurations) =>
            Number(fields.get(`${key}-minutes`)) * 60 + Number(fields.get(`${key}-seconds`));
        const value = {
            transition: secondsFor("transition"),
            defense: secondsFor("defense"),
            questions: secondsFor("questions"),
        };
        if (value.defense < 1) {
            setError(true);
            return;
        }
        onSave(value);
        setOpen(false);
    };

    return (
        <Popover.Root open={open} onOpenChange={(value) => { setOpen(value); setError(false); }}>
            <Popover.Trigger disabled={disabled} className={timerControlClass} aria-label="Настроить таймер">
                <Icon name="settings" size={24} />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner sideOffset={8} className="z-[500]">
                    <Popover.Popup className="max-h-[var(--available-height)] w-[340px] max-w-[var(--available-width)] overflow-auto rounded-xl border border-[#ECECF0] bg-white p-4 text-sm text-[#4A5565] shadow-lg">
                        <Popover.Title className="font-semibold text-[#0A0A0A]">Длительность этапов</Popover.Title>
                        <Popover.Description className="mb-3 mt-1">
                            {running ? "Изменить длительность можно на паузе." : "Настройки для этой команды сохраняются в текущей вкладке."}
                        </Popover.Description>
                        <form onSubmit={save} className="grid gap-3">
                            {timerStages.map(({ key, label }) => (
                                <fieldset key={key} disabled={disabled || running} className="grid grid-cols-2 gap-2 disabled:opacity-50">
                                    <legend className="mb-1 font-medium">{label}</legend>
                                    <label className="grid gap-1">
                                        Минуты
                                        <input name={`${key}-minutes`} type="number" min={0} max={1440} required
                                            defaultValue={Math.floor(durations[key] / 60)}
                                            className="min-w-0 rounded-lg border border-[#0000001A] p-2" />
                                    </label>
                                    <label className="grid gap-1">
                                        Секунды
                                        <input name={`${key}-seconds`} type="number" min={0} max={59} required
                                            defaultValue={durations[key] % 60}
                                            className="min-w-0 rounded-lg border border-[#0000001A] p-2" />
                                    </label>
                                </fieldset>
                            ))}
                            {error && <p role="alert" className="text-[#E11D48]">Укажите хотя бы одну секунду для защиты.</p>}
                            <button type="submit" disabled={disabled || running} className="justify-self-end rounded-lg bg-[#155DFC] px-3 py-2 font-medium text-white disabled:opacity-50">
                                Сохранить
                            </button>
                        </form>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}

type ExamPresentationProps = {
    current?: QueueItem;
    project?: ProjectListItemResponse | ProjectFullResponse;
    number?: number;
    attempt?: Attempt | null;
    timer: ReturnType<typeof getExamTimer>;
    durations: TimerDurations;
    settingsTeamId?: number;
    onSaveDurations: (value: TimerDurations) => void;
    canManage: boolean;
    pending: boolean;
    previousUnavailable?: string;
    canGoForward: boolean;
    onToggle: () => void;
    onPrevious: () => void;
    onNext: () => void;
};

export function ExamPresentation({
    current, project, number, attempt, timer, durations, settingsTeamId,
    onSaveDurations, canManage, pending, previousUnavailable, canGoForward, onToggle, onPrevious, onNext,
}: ExamPresentationProps) {
    const projectQuery = useProject(current ? String(current.project_id) : "");
    const detail = projectQuery.data ?? (project && "members" in project ? project : undefined);
    const shownProject = detail ?? project;
    const description = useMemo(() => projectDescriptionText(shownProject?.description), [shownProject?.description]);
    const team = detail?.members.map((member) => member.name)
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
                    <h2 className="mb-5 text-xl font-semibold text-[#0A0A0A]">Текущее выступление</h2>
                    {current ? (
                        <>
                            <div className="flex flex-wrap items-start justify-between gap-5">
                                <div className="flex min-w-0 flex-[1_1_180px] items-start gap-5">
                                    <span className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-[#155DFC] text-xl text-white">{number}</span>
                                    <div className="min-w-0">
                                        <h3 className="break-words text-xl text-[#0A0A0A]">{shownProject?.name ?? "Проект команды"}</h3>
                                        <p className="mt-1 whitespace-pre-line break-words text-[15px] text-[#6D7585]">{description || "Описание проекта не указано"}</p>
                                    </div>
                                </div>
                                {canManage && (
                                    <Tooltip.Provider delay={100}>
                                        <Tooltip.Root>
                                            <Tooltip.Trigger render={<span tabIndex={0} />} className="inline-flex">
                                                <button type="button" disabled className="pointer-events-none rounded-lg border border-[#CFCFCF] bg-white px-3 py-2 text-sm font-medium text-[#0A0A0A] opacity-50">
                                                    Начать оценивание
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Portal>
                                                <Tooltip.Positioner positionMethod="fixed" sideOffset={8} collisionPadding={8} className="z-[500]">
                                                    <Tooltip.Popup className="max-w-[min(280px,var(--available-width))] rounded-lg border border-app-border bg-app-surface p-3 text-sm text-app-text shadow-lg">
                                                        Общее окно оценивания откроется после завершения выступления.
                                                    </Tooltip.Popup>
                                                </Tooltip.Positioner>
                                            </Tooltip.Portal>
                                        </Tooltip.Root>
                                    </Tooltip.Provider>
                                )}
                            </div>
                            <hr className="my-5 border-[#ECECF0]" />
                            <div className="space-y-1 break-words text-[15px] text-[#4A5565]">
                                <p><strong>Руководитель:</strong> {getExamProjectLeader(shownProject) ?? "Имя не указано"}</p>
                                <p><strong>Команда:</strong> {team?.join(", ") || (projectQuery.isFetching ? "Загружаем состав…" : "Состав команды не указан")}</p>
                            </div>
                        </>
                    ) : <p className="text-[15px] text-[#6D7585]">Сейчас никто не выступает.</p>}
                    {canManage && (
                        <div className="mt-auto flex flex-wrap justify-between gap-x-4 pt-5">
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
                            <button type="button" className={`${controlClass} ml-auto`} onClick={onNext} disabled={pending || !canGoForward}>
                                Следующая команда <Icon name="arrow-right" size={16} />
                            </button>
                        </div>
                    )}
                </section>
                <section className={cardClass}>
                    <h2 className="text-xl font-semibold text-[#0A0A0A]">Таймер</h2>
                    <p className="mt-1 text-[15px] text-[#4A5565]">
                        На сколько минут таймер <span className="ml-1 font-medium tabular-nums">{formatTimerSeconds(timer.total)}</span>
                    </p>
                    <TimerRing timer={timer} paused={paused} />
                    {canManage && (
                        <div className="mt-auto flex items-center justify-between gap-2">
                            <button type="button" className={timerControlClass} disabled={pending || !attempt} onClick={onToggle}
                                aria-label={!attempt || paused ? "Запустить таймер" : "Приостановить таймер"}>
                                <Icon name={!attempt || paused ? "play" : "pause"} size={24} />
                            </button>
                            <TimerSettings
                                key={settingsTeamId}
                                durations={durations}
                                disabled={pending || !settingsTeamId}
                                running={Boolean(attempt) && !paused}
                                onSave={onSaveDurations}
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
