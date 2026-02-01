import { NavLink, Outlet } from "react-router";
import { Home, LayoutGrid, Plus, Search, Bell, UserCircle } from "lucide-react";
import { paths } from "@/config/paths";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/features/spases/components/user-nav";

export function SpasesLayout({ children }: { children?: React.ReactNode }) {
    const disciplines = [
        { name: "Управление проектами", count: 8, color: "text-blue-500" },
        { name: "Проектная деятельность", count: 5, color: "text-indigo-500" },
        { name: "Введение в профдеятельность", count: 7, color: "text-orange-500" },
    ];

    return (
        <div className="flex min-h-screen bg-[#F9FAFB]">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6">
                    <div className="text-2xl font-bold text-blue-600 mb-8">EduSpace</div>

                    <Button
                        variant="ghost"
                        asChild
                        className="w-full bg-[#0F1117] text-white justify-start gap-3 px-4 py-3"
                    >
                        <NavLink
                            to={paths.app.spases.getHref()}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center font-medium transition-all",
                                    isActive
                                        ? "bg-[#0F1117] text-white"
                                        : "text-gray-600 hover:bg-gray-100",
                                )
                            }
                        >
                            <Home size={20} />
                            Все пространства
                        </NavLink>
                    </Button>

                    <div className="mt-8">
                        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Дисциплины
                        </h3>
                        <nav className="space-y-1">
                            {disciplines.map((item) => (
                                <button
                                    key={item.name}
                                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <LayoutGrid size={16} className={item.color} />
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{item.count}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                        <Plus size={18} />
                        Создать пространство
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header / Topbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <div className="relative w-96">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Ищите проекты, пространства..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Bell className="text-gray-500 cursor-pointer" size={22} />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                                3
                            </span>
                        </div>
                        <UserNav />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">{children || <Outlet />}</main>
            </div>
        </div>
    );
}
