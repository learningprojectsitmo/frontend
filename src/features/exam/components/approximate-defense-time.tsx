import { Tooltip } from "@base-ui/react/tooltip";
import { Icon } from "@/components/ui/icons";
import { formatExamTime } from "../exam-display";
import { formatScheduleTime } from "../exam-schedule";

export const approximateTimeMessage =
    "Время ориентировочное и может измениться по решению преподавателя";

export const beforeStartEtaMessage =
    "Прогноз учитывает порядок и длительность выступлений. Защита может начаться раньше времени, указанного при записи.";

export const liveEtaMessage =
    "Прогноз обновляется по ходу экзамена и зависит от фактического порядка и длительности выступлений.";

export function ExamTimeHint({ message }: { message: string }) {
    return (
        <Tooltip.Provider delay={100}>
            <Tooltip.Root>
                <Tooltip.Trigger
                    type="button"
                    aria-label={message}
                    className="inline-flex cursor-help items-center rounded text-app-muted focus-visible:outline focus-visible:outline-2"
                >
                    <Icon name="info" size={16} />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Positioner
                        positionMethod="fixed"
                        sideOffset={8}
                        collisionPadding={8}
                        className="z-[500]"
                    >
                        <Tooltip.Popup className="w-max max-w-[min(280px,var(--available-width))] whitespace-normal rounded-xl border border-gray-200 dark:border-app-border bg-app-surface p-3 text-xs leading-5 text-app-text shadow-lg">
                            {message}
                        </Tooltip.Popup>
                    </Tooltip.Positioner>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}

export function ApproximateDefenseTime({
    value,
    examStart,
    message = approximateTimeMessage,
}: {
    value: string;
    examStart?: string;
    message?: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            {examStart ? formatScheduleTime(value, examStart) : formatExamTime(value)}
            <ExamTimeHint message={message} />
        </span>
    );
}
