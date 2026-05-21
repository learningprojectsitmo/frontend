import { type SidebarState } from "../../types/sidebar";

type SidebarContentProps = {
    state: SidebarState;
    isCollapsed: boolean;
    categories: { name: string; spaces: { id: number; title: string; projectsCount: number; color: string }[] }[];
    selectedId: string | null;
};

export function SidebarContent({ state, isCollapsed, categories, selectedId }: SidebarContentProps) {
    if (state === "loading") return <SidebarSkeleton isCollapsed={isCollapsed} />;
    if (state === "notFound") return <SidebarNotFound isCollapsed={isCollapsed} />;
    if (categories.length === 0) return <SidebarEmpty />;

    return isCollapsed ? (
        <SidebarCollapsed categories={categories} selectedId={selectedId} />
    ) : (
        <SidebarExpanded categories={categories} selectedId={selectedId} />
    );
}
