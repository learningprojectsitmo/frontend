



export function Sidebar({ isCollapsed, onToggle, data, selectedId }: SidebarProps) {
    const state = getSidebarState(data, selectedId);
    
    return (
        <aside className={cn("...", isCollapsed ? "w-[56px]" : "w-[248px]")}>
            <SidebarHeader isCollapsed={isCollapsed} onToggle={onToggle} />
            <SidebarContent 
                state={state}
                isCollapsed={isCollapsed}
                categories={data.categories}
                selectedId={selectedId}
            />
            <SidebarFooter isCollapsed={isCollapsed} userRole={data.userRole} />
        </aside>
    );
}
