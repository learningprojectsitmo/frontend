import { useState } from "react";
import { ChevronRight, Globe, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WikiTreeNode } from "@/features/wiki/build-wiki-tree";

interface WikiTreeListProps {
    nodes: WikiTreeNode[];
    activeId: number | null;
    onSelect: (pageId: number) => void;
    /** Слот действий строки — в проекте это кнопка удаления. */
    renderActions?: (node: WikiTreeNode) => React.ReactNode;
}

/** Отступ уровня: направляющая линия должна читаться глазом, а не догадкой. */
const INDENT_REM = 16;

/**
 * Дерево страниц вики.
 *
 * Общий компонент для сайдбара в проекте и для публичной страницы — раньше
 * список был продублирован в двух местах и различался (в одном шеврон
 * показывался, но ничего не сворачивал, в другом не было вовсе).
 *
 * Вложенность показывают три вещи вместе: растущий отступ, вертикальная
 * направляющая на каждом уровне и сворачиваемый шеврон. Без шеврона строка с
 * детьми неотличима от листа, а без направляющей при двух уровнях не понять,
 * где кончился родитель.
 */
export const WikiTreeList = ({ nodes, activeId, onSelect, renderActions }: WikiTreeListProps) => {
    return (
        <ul className="flex flex-col">
            {nodes.map((node) => (
                <WikiTreeRow
                    key={node.id}
                    node={node}
                    activeId={activeId}
                    onSelect={onSelect}
                    renderActions={renderActions}
                />
            ))}
        </ul>
    );
};

interface WikiTreeRowProps {
    node: WikiTreeNode;
    activeId: number | null;
    onSelect: (pageId: number) => void;
    renderActions?: (node: WikiTreeNode) => React.ReactNode;
    depth?: number;
}

const WikiTreeRow = ({ node, activeId, onSelect, renderActions, depth = 0 }: WikiTreeRowProps) => {
    const hasChildren = node.children.length > 0;
    // Свёрнутые ветки остаются закрытыми при навигации по URL: страница из
    // ссылки должна быть видна, даже если её ветку закрыли в прошлый раз.
    const [collapsed, setCollapsed] = useState(false);
    const isActive = node.id === activeId;

    return (
        <li>
            <div
                className={cn(
                    "group flex items-center gap-0.5 rounded-[8px] pr-1 transition-colors",
                    "hover:bg-[--color-gray-100]",
                    isActive && "bg-[--color-gray-100]",
                )}
                style={{ paddingLeft: depth * INDENT_REM }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => setCollapsed((c) => !c)}
                        aria-label={collapsed ? "Развернуть ветку" : "Свернуть ветку"}
                        aria-expanded={!collapsed}
                        className="flex h-6 w-5 shrink-0 items-center justify-center rounded-[4px] text-app-muted transition-colors hover:text-gray-900"
                    >
                        <ChevronRight
                            size={14}
                            className={cn("transition-transform", !collapsed && "rotate-90")}
                        />
                    </button>
                ) : (
                    // Отступ под шеврон, чтобы листья выравнивались по заголовкам.
                    <span className="w-5 shrink-0" />
                )}

                <button
                    type="button"
                    onClick={() => onSelect(node.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                        "flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-[13px] transition-colors",
                        isActive
                            ? "font-semibold text-gray-900"
                            : "text-app-text hover:text-gray-900",
                    )}
                >
                    {node.visibility === "private" ? (
                        <Lock size={12} className="shrink-0 text-app-muted" />
                    ) : (
                        <Globe size={12} className="shrink-0 text-app-muted" />
                    )}
                    <span className="truncate">{node.title}</span>
                </button>

                {renderActions?.(node)}
            </div>

            {hasChildren && !collapsed && (
                // Направляющая уровня: дети стоят правее линии родителя, поэтому
                // граница идёт по левому краю вложенного списка на всю высоту.
                <ul
                    className="flex flex-col border-l border-[--color-gray-200] ml-[7px] pl-3"
                    data-depth={depth + 1}
                >
                    {node.children.map((child) => (
                        <WikiTreeRow
                            key={child.id}
                            node={child}
                            activeId={activeId}
                            onSelect={onSelect}
                            renderActions={renderActions}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};
