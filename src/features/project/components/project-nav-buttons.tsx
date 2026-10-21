import { ChevronLeft, ChevronRight } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import type { ProjectNeighborItemResponse } from "@/types/api";

type ProjectNavButtonsProps = {
    /** Проект ниже текущего в списке пространства. */
    prev?: ProjectNeighborItemResponse | null;
    /** Проект выше текущего в списке пространства. */
    next?: ProjectNeighborItemResponse | null;
    onNavigate: (projectId: number) => void;
};

/**
 * Кнопки «назад/вперёд» по проектам пространства.
 *
 * ‹ ведёт к более раннему проекту (в списке пространства он ниже),
 * › — к более позднему (выше). Название соседа — в подсказке: без него
 * кнопка выглядит как стрелка «в никуда».
 */
const ProjectNavButtons = ({ prev, next, onNavigate }: ProjectNavButtonsProps) => {
    return (
        <div className="flex items-center gap-1 shrink-0" data-testid="project-nav-buttons">
            <IconButton
                variant="ghost"
                icon={<ChevronLeft />}
                onClick={() => prev && onNavigate(prev.id)}
                disabled={!prev}
                aria-label="Предыдущий проект"
                title={prev ? `Предыдущий проект: ${prev.name}` : "Нет более ранних проектов"}
            />
            <IconButton
                variant="ghost"
                icon={<ChevronRight />}
                onClick={() => next && onNavigate(next.id)}
                disabled={!next}
                aria-label="Следующий проект"
                title={next ? `Следующий проект: ${next.name}` : "Нет более поздних проектов"}
            />
        </div>
    );
};

export { ProjectNavButtons };
