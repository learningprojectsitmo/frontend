import { paths } from "@/config/paths";

/**
 * Ссылка на соседний проект с сохранением открытой вкладки.
 *
 * При переходе на другой проект вкладка сохраняется: человек листает
 * проекты, оставаясь в «Канбан-доске», а не возвращается на «Обзор».
 * Параметр `edit` сбрасывается — режим правки относится к конкретному
 * проекту, и незавершённая форма ушла бы в никуда.
 */
export const buildProjectNavHref = (projectId: number, currentParams: URLSearchParams): string => {
    const params = new URLSearchParams(currentParams);
    params.set("id", String(projectId));
    params.delete("edit");

    const href = paths.app.project.getHref(projectId);
    const tab = params.get("tab");
    return tab ? `${href}&tab=${encodeURIComponent(tab)}` : href;
};
