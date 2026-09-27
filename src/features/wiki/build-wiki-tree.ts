import type { WikiPageSummary } from "@/types/api";

/**
 * Плоский список страниц → дерево.
 *
 * Бэкенд отдаёт вики плоским списком. Страница с несуществующим родителем и
 * страница, вложенная в собственного потомка, через API невозможны — create и
 * update проверяют оба случая. Но helper не должен ронять на них весь список:
 * потерянная страница молча исчезла бы из сайдбара. Поэтому всё, что не
 * привязалось к корню (взаимное родительтельство a→b→a), поднимается в корень.
 */
export type WikiTreeNode = WikiPageSummary & {
    children: WikiTreeNode[];
};

export const buildWikiTree = (pages: WikiPageSummary[]): WikiTreeNode[] => {
    const nodes = new Map<number, WikiTreeNode>();
    for (const page of pages) {
        nodes.set(page.id, { ...page, children: [] });
    }

    const roots: WikiTreeNode[] = [];
    const attached = new Set<number>();
    for (const page of pages) {
        const node = nodes.get(page.id);
        if (!node) continue;
        const parent = page.parent_id !== null ? nodes.get(page.parent_id) : undefined;
        // isInside ловит длинную цепочку a→b→c→a; короткий цикл из двух узлов
        // (a→b, b→a) — нет, и такие остаются unattached до второго прохода.
        if (parent && !isAncestorOf(nodes, page.parent_id as number, page.id)) {
            parent.children.push(node);
            attached.add(node.id);
        } else {
            roots.push(node);
        }
    }

    for (const page of pages) {
        const node = nodes.get(page.id);
        if (node && !attached.has(node.id) && !roots.includes(node)) {
            roots.push(node);
        }
    }

    // Порядок задаёт position, иначе страницы после сохранения прыгают.
    const byPosition = (a: WikiTreeNode, b: WikiTreeNode) =>
        a.position - b.position || a.title.localeCompare(b.title, "ru");

    const sortRec = (list: WikiTreeNode[]): WikiTreeNode[] => {
        list.sort(byPosition);
        for (const node of list) sortRec(node.children);
        return list;
    };

    return sortRec(roots);
};

/** Сейчас `candidateAncestor` станет родителем `nodeId` — значит он не может быть его потомком. */
const isAncestorOf = (
    nodes: Map<number, WikiTreeNode>,
    candidateAncestor: number,
    nodeId: number,
): boolean => {
    let current = nodes.get(candidateAncestor);
    while (current) {
        if (current.id === nodeId) return true;
        current = current.parent_id !== null ? nodes.get(current.parent_id) : undefined;
    }
    return false;
};
