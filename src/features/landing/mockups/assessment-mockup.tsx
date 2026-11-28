import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

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
    sidebar: {
        spaces: string;
        space: string;
        exams: string;
        create: string;
    };
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
};

const rowClass: Record<MockRowState, string> = {
    score: "bg-[#155DFC0A]",
    action: "bg-[#155DFC0A]",
    waiting: "",
    break: "bg-gray-50 text-gray-400",
};

/**
 * Мокап страницы экзамена: шапка экзамена, карточки «К выступлению готовится»
 * и «Таймер», очередь выступлений с колонкой оценки. Повторяет реальную
 * страницу экзамена, а не отдельную форму: оценивание открывается из строки
 * команды после защиты.
 */
export const AssessmentMockup = () => {
    const { t } = useTranslation();

    const mockup = t("landing.assessment.mockup", {
        returnObjects: true,
    }) as unknown as ExamPageMock;

    return (
        <div
            role="img"
            aria-label={t("landing.assessment.mockupLabel")}
            className="pointer-events-none w-full select-none overflow-hidden rounded-2xl border border-gray-200 bg-app-surface shadow-xl shadow-gray-900/5"
        >
            {/* Строка браузера: подчёркивает, что это страница приложения */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <div className="flex shrink-0 gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-200 bg-app-surface px-2.5 py-1">
                    <Icon name="link" size={10} className="shrink-0 text-gray-400" />
                    <span className="truncate text-[10px] text-gray-400">{mockup.window}</span>
                </div>
            </div>

            <div className="flex">
                {/* Боковое меню приложения */}
                <aside className="hidden w-40 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-2.5 lg:flex">
                    <Icon
                        name="logo-edu-flow"
                        width={74}
                        height={21}
                        alt="EduFlow"
                        color="var(--app-text)"
                    />
                    <div className="mt-3 rounded-lg bg-app-surface px-2 py-1.5 text-[9px] font-semibold text-gray-700">
                        {mockup.sidebar.spaces}
                    </div>
                    <div className="mt-1 truncate rounded-lg px-2 py-1.5 text-[9px] text-gray-500">
                        {mockup.sidebar.space}
                    </div>
                    <div className="mt-3 px-2 text-[8px] font-semibold uppercase tracking-wide text-gray-400">
                        {mockup.sidebar.exams}
                    </div>
                    <div className="mt-1 rounded-lg bg-gray-200/80 px-2 py-1.5 text-[9px] font-semibold text-gray-800">
                        {mockup.sidebar.exams}
                    </div>
                    <div className="mt-auto rounded-lg border border-gray-200 bg-app-surface px-2 py-1.5 text-center text-[8px] font-medium text-gray-600">
                        {mockup.sidebar.create}
                    </div>
                </aside>

                <div className="relative min-w-0 flex-1 p-3 sm:p-4">
                    <p className="text-[9px] text-gray-400">{mockup.breadcrumb}</p>

                    {/* Шапка экзамена */}
                    <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#4338CA] text-white">
                                <Icon name="exam" size={18} />
                            </span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[16px] font-bold leading-tight text-gray-900">
                                        {mockup.examTitle}
                                    </p>
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700">
                                        {mockup.examStatus}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500">{mockup.discipline}</p>
                                <p className="text-[9px] text-gray-400">{mockup.period}</p>
                                <p className="text-[9px] text-gray-400">{mockup.spaceMeta}</p>
                            </div>
                        </div>
                        <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                            <span className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[9px] font-medium text-gray-700">
                                {mockup.startExam}
                            </span>
                            <span className="rounded-lg bg-app-blue px-2.5 py-1.5 text-[9px] font-medium text-white">
                                {mockup.connect}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3">
                        <p className="text-[10px] font-semibold text-gray-900">
                            {mockup.descriptionTitle}
                        </p>
                        <p className="text-[9px] text-gray-500">{mockup.description}</p>
                    </div>

                    {/* К выступлению готовится + таймер */}
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1.25fr_1fr]">
                        <div className="min-w-0 rounded-xl border border-gray-200 p-3">
                            <p className="text-[10px] font-semibold text-gray-900">
                                {mockup.upcomingTitle}
                            </p>
                            <div className="mt-2 flex items-start gap-2">
                                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-app-blue text-[10px] font-semibold text-white">
                                    {mockup.teamNumber}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-[10px] font-medium text-gray-900">
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
                                <p className="text-[10px] font-semibold text-gray-900">
                                    {mockup.timerTitle}
                                </p>
                                <span className="text-[8px] text-gray-400">
                                    {mockup.timerDuration}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                                <div className="grid size-[78px] shrink-0 place-items-center rounded-full border-[6px] border-dashed border-gray-200">
                                    <div className="text-center">
                                        <p className="text-[15px] font-extrabold tabular-nums text-gray-900">
                                            {mockup.timerValue}
                                        </p>
                                        <p className="text-[7px] text-gray-400">
                                            {mockup.timerStatus}
                                        </p>
                                    </div>
                                </div>
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

                    {/* Порядок выступлений */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-gray-900">{mockup.queueTitle}</p>
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
                                                            className="grid size-5 place-items-center rounded-full bg-gray-100 text-[7px] font-semibold text-gray-600 ring-1 ring-white"
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
                                                    Слот {row.slot}
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
                                                    <span className="text-[7px] text-amber-600">
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
                            <p className="text-[8px] text-amber-600">{mockup.toastCountdown}</p>
                        </div>
                        <Icon name="cross" size={11} className="shrink-0 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};
