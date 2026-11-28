import { useTranslation } from "react-i18next";
import { Link as LinkIcon, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import { AppWindowMockup } from "./app-window-mockup";

type MockRowState = "score" | "action" | "waiting" | "break";

type MockRow = {
    number: string;
    project: string;
    source: string;
    leader: string;
    team: string[];
    time: string;
    slot: string;
    score: string;
    state: MockRowState;
};

type ExamPageMock = {
    window: string;
    tag: string;
    breadcrumb: string;
    examTitle: string;
    examStatus: string;
    startExam: string;
    connect: string;
    discipline: string;
    period: string;
    spaceMeta: string;
    descriptionTitle: string;
    description: string;
    upcomingTitle: string;
    teamNumber: string;
    projectName: string;
    projectDescription: string;
    leaderLabel: string;
    leader: string;
    teamLabel: string;
    team: string;
    previous: string;
    next: string;
    timerTitle: string;
    timerDuration: string;
    timerValue: string;
    timerStatus: string;
    forecastTitle: string;
    forecastCurrentLabel: string;
    forecastQueueLabel: string;
    forecastCurrent: string;
    forecastQueue: string;
    queueTitle: string;
    assign: string;
    search: string;
    filter: string;
    tableHeaders: string[];
    rows: MockRow[];
    statement: string;
    toastTitle: string;
    toastCountdown: string;
    scoreAction: string;
    scorePending: string;
    slotLabel: string;
};

const rowClass: Record<MockRowState, string> = {
    score: "bg-[#155DFC0A] dark:bg-blue-400/10",
    action: "bg-[#155DFC0A] dark:bg-blue-400/10",
    waiting: "",
    break: "bg-gray-50 text-gray-400",
};

/** Кольцо таймера с рисками — как `TimerRing` в exam-presentation. */
function TimerRing({ value, status }: { value: string; status: string }) {
    return (
        <div className="relative mx-auto grid aspect-square w-full max-w-[120px] place-items-center">
            <div aria-hidden="true" className="absolute inset-0">
                {Array.from({ length: 60 }).map((_, index) => (
                    <span
                        key={index}
                        className="absolute inset-0"
                        style={{ transform: `rotate(${index * 6}deg)` }}
                    >
                        <span className="absolute left-1/2 top-0 h-[7px] w-0.5 -translate-x-1/2 rounded-full bg-gray-300 dark:bg-slate-600" />
                    </span>
                ))}
            </div>
            <div className="flex flex-col items-center text-center">
                <span className="text-[18px] font-extrabold leading-none tabular-nums text-gray-900">
                    {value}
                </span>
                <span className="mt-0.5 text-[8px] text-gray-400">{status}</span>
            </div>
        </div>
    );
}

/**
 * Мокап страницы экзамена: шапка экзамена, карточки «К выступлению готовится»
 * и «Таймер», прогноз окончания, очередь выступлений с колонкой оценки.
 * Повторяет реальную страницу экзамена; боковое меню не показываем.
 */
export const AssessmentMockup = () => {
    const { t } = useTranslation();

    const mockup = t("landing.assessment.mockup", {
        returnObjects: true,
    }) as unknown as ExamPageMock;

    return (
        <AppWindowMockup url={mockup.window} label={t("landing.assessment.mockupLabel")}>
            <div className="relative p-3 sm:p-5">
                <p className="text-[10px] text-gray-400">{mockup.breadcrumb}</p>

                {/* Шапка экзамена */}
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#4338CA] text-white">
                            <Icon name="exam" size={20} />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[17px] font-bold leading-tight text-gray-900">
                                    {mockup.examTitle}
                                </p>
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                    {mockup.examStatus}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500">{mockup.discipline}</p>
                            <p className="text-[9px] text-gray-400">{mockup.period}</p>
                            <p className="text-[9px] text-gray-400">{mockup.spaceMeta}</p>
                        </div>
                    </div>
                    <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                        <Button
                            variant="outline"
                            size="hug36"
                            icon={<Play size={12} />}
                            className="!h-8 !rounded-[10px] !px-2.5 !text-[9px]"
                        >
                            {mockup.startExam}
                        </Button>
                        <Button
                            variant="blue"
                            size="hug36"
                            icon={<LinkIcon size={12} />}
                            className="!h-8 !rounded-[10px] !px-2.5 !text-[9px]"
                        >
                            {mockup.connect}
                        </Button>
                    </div>
                </div>

                <div className="mt-3">
                    <p className="text-[11px] font-semibold text-gray-900">
                        {mockup.descriptionTitle}
                    </p>
                    <p className="text-[10px] text-gray-500">{mockup.description}</p>
                </div>

                {/* К выступлению готовится + таймер */}
                <div className="mt-3 grid gap-2 sm:grid-cols-[1.25fr_1fr]">
                    <div className="min-w-0 rounded-xl border border-gray-200 p-3">
                        <p className="text-[11px] font-semibold text-gray-900">
                            {mockup.upcomingTitle}
                        </p>
                        <div className="mt-2 flex items-start gap-2">
                            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-app-blue text-[10px] font-semibold text-white">
                                {mockup.teamNumber}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[11px] font-medium text-gray-900">
                                    {mockup.projectName}
                                </p>
                                <p className="line-clamp-2 text-[9px] text-gray-500">
                                    {mockup.projectDescription}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2 text-[9px] text-gray-500">
                            <p className="truncate">
                                <span className="font-semibold text-gray-700">
                                    {mockup.leaderLabel}
                                </span>{" "}
                                {mockup.leader}
                            </p>
                            <p className="truncate">
                                <span className="font-semibold text-gray-700">
                                    {mockup.teamLabel}
                                </span>{" "}
                                {mockup.team}
                            </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[9px] text-app-blue">
                            <span>{mockup.previous}</span>
                            <span>{mockup.next}</span>
                        </div>
                    </div>

                    <div className="min-w-0 rounded-xl border border-gray-200 p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[11px] font-semibold text-gray-900">
                                {mockup.timerTitle}
                            </p>
                            <span className="text-[8px] text-gray-400">{mockup.timerDuration}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <TimerRing value={mockup.timerValue} status={mockup.timerStatus} />
                            <div className="grid gap-1.5">
                                <span className="grid size-7 place-items-center rounded-md border border-gray-200 text-gray-600">
                                    <Icon name="play" size={12} />
                                </span>
                                <span className="grid size-7 place-items-center rounded-md border border-gray-200 text-gray-400">
                                    <Icon name="settings" size={12} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <span className="mt-3 inline-flex h-6 items-center rounded-lg bg-gray-100 px-2 text-[9px] font-medium text-gray-900 dark:bg-app-ghost">
                    {mockup.tag}
                </span>

                {/* Прогноз окончания */}
                <div className="mt-3 rounded-xl border border-[#DCE6FA] bg-[#F5F8FF] p-3 dark:border-[#293B5A] dark:bg-[#121D30]">
                    <div className="flex items-center gap-2">
                        <Icon
                            name="clock"
                            size={12}
                            className="text-[#155DFC] dark:text-[#90B8FF]"
                        />
                        <p className="text-[10px] font-semibold text-[#182844] dark:text-[#E8EFFF]">
                            {mockup.forecastTitle}
                        </p>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                            <dt className="text-[8px] text-[#4B5D7D] dark:text-[#ACBCDA]">
                                {mockup.forecastCurrentLabel}
                            </dt>
                            <dd className="text-[14px] font-semibold tabular-nums text-[#182844] dark:text-[#E8EFFF]">
                                ≈ {mockup.forecastCurrent}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[8px] text-[#4B5D7D] dark:text-[#ACBCDA]">
                                {mockup.forecastQueueLabel}
                            </dt>
                            <dd className="text-[14px] font-semibold tabular-nums text-[#155DFC] dark:text-[#90B8FF]">
                                ≈ {mockup.forecastQueue}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Порядок выступлений */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-gray-900">{mockup.queueTitle}</p>
                    <div className="hidden items-center gap-1.5 sm:flex">
                        <span className="rounded-md border border-gray-200 px-2 py-1 text-[9px] font-medium text-gray-600">
                            {mockup.assign}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[9px] text-gray-400">
                            <Icon name="magnifier" size={9} />
                            {mockup.search}
                        </span>
                        <span className="rounded-md border border-gray-200 px-2 py-1 text-[9px] text-gray-600">
                            {mockup.filter}
                        </span>
                    </div>
                </div>

                <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full border-collapse text-left">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                {mockup.tableHeaders.map((header, index) => (
                                    <th
                                        key={header}
                                        scope="col"
                                        className={cn(
                                            "px-2 py-2 text-[9px] font-semibold text-gray-900",
                                            index === 0 && "w-8",
                                            index > 1 &&
                                                index < mockup.tableHeaders.length - 1 &&
                                                "hidden sm:table-cell",
                                            index === mockup.tableHeaders.length - 1 &&
                                                "text-right",
                                        )}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mockup.rows.map((row) => (
                                <tr
                                    key={`${row.number}-${row.project}`}
                                    className={cn(
                                        "border-b border-gray-100 last:border-0",
                                        rowClass[row.state],
                                    )}
                                >
                                    <td className="px-2 py-2 text-[9px] tabular-nums text-gray-500">
                                        {row.number}
                                    </td>
                                    <td className="px-2 py-2">
                                        {row.state === "break" ? (
                                            <span className="text-[9px] font-medium">
                                                {row.project}
                                            </span>
                                        ) : (
                                            <>
                                                <p className="truncate text-[9px] font-medium text-app-blue">
                                                    {row.project}
                                                </p>
                                                <p className="truncate text-[7px] text-gray-400">
                                                    {row.source}
                                                </p>
                                            </>
                                        )}
                                    </td>
                                    <td className="hidden px-2 py-2 sm:table-cell">
                                        {row.state === "break" ? (
                                            <span className="text-[9px]">—</span>
                                        ) : (
                                            <span className="flex items-center gap-1 whitespace-nowrap text-[9px] text-gray-600">
                                                <Icon name="profile" size={10} />
                                                {row.leader}
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden px-2 py-2 sm:table-cell">
                                        {row.team.length ? (
                                            <div className="flex -space-x-1">
                                                {row.team.map((initials) => (
                                                    <span
                                                        key={initials}
                                                        className="grid size-5 place-items-center rounded-full bg-gray-100 text-[7px] font-semibold text-gray-600 ring-1 ring-app-surface"
                                                    >
                                                        {initials}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[9px]">—</span>
                                        )}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-2 py-2 sm:table-cell">
                                        <p className="text-[9px] tabular-nums text-gray-700">
                                            {row.time}
                                        </p>
                                        {row.slot && row.slot !== row.time && (
                                            <p className="text-[7px] text-gray-400">
                                                {mockup.slotLabel}: {row.slot}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        {row.state === "score" && (
                                            <span className="text-[10px] font-semibold tabular-nums text-app-blue">
                                                {row.score}
                                            </span>
                                        )}
                                        {row.state === "action" && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-semibold text-app-blue">
                                                    {mockup.scoreAction}
                                                </span>
                                                <span className="text-[7px] text-amber-600 dark:text-amber-300">
                                                    {mockup.scorePending}
                                                </span>
                                            </div>
                                        )}
                                        {row.state === "waiting" && (
                                            <span className="text-[9px] text-gray-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[9px] font-semibold text-gray-700">
                    <Icon name="arrow-down" size={11} className="text-gray-400" />
                    {mockup.statement}
                </div>

                {/* Уведомление об открытом окне оценивания */}
                <div className="absolute bottom-3 right-3 hidden w-52 items-start justify-between gap-2 rounded-xl border border-gray-200 bg-app-surface p-2.5 shadow-lg sm:flex">
                    <div className="min-w-0">
                        <p className="text-[9px] font-semibold text-gray-900">
                            {mockup.toastTitle}
                        </p>
                        <p className="text-[8px] text-amber-600 dark:text-amber-300">
                            {mockup.toastCountdown}
                        </p>
                    </div>
                    <Icon name="cross" size={11} className="shrink-0 text-gray-400" />
                </div>
            </div>
        </AppWindowMockup>
    );
};
