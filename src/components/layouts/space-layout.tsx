import { NavLink, Outlet } from "react-router";
import { paths } from "@/config/paths";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/features/spaces/components/user-nav";
import { Icon } from "@/components/ui/icons";
import { SearchBar } from "../ui/search-bar";
import { NotificationsNav } from "@/features/spaces/components/notifications";
import { DropdownMenuSeparator } from "@/components/ui/dropdown/dropdown-menu";
import { GraduationCapIcon } from "lucide-react";

export function SpaceLayout({ children }: { children?: React.ReactNode }) {
    const categories = [
        { name: "Дисциплины", spaces: [
                { name: "Управление проектами", count: 8, color: "bg-blue-500" },
                { name: "Проектная деятельность", count: 5, color: "bg-indigo-500" },
                { name: "Введение в профдеятельность", count: 7, color: "bg-orange-500" },
                { name: "Управление процессами", count: 12, color: "bg-red-500" },
                { name: "Основы управления", count: 9, color: "bg-pink-500" },
            ]  
        },
        { name: "Общеуниверситетские проекты", spaces: [
                { name: "Центр студенческих инициатив", count: 512, color: "bg-green-500" },
            ]
        },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-12">
                    <div className="flex">
                        <Icon name="logo-edu-flow" width={120} height={32} alt="EduFlow Logo" />
                    </div>

                    <div className="relative w-full md:w-96 lg:w-[415px]">
                        <SearchBar
                            placeholder="Ищите проекты, пространства или участников..."
                            suggestions={[
                                "Mobile App",
                                "Mobile App Learning",
                                "Mobile App X",
                                "Web Development",
                                "UI/UX Design",
                            ]}
                        />
                    </div>
                </div>
                

                <div className="flex items-center gap-3">
                    <NotificationsNav />
                    <UserNav />
                </div>

            </header>
            
            <div className="flex-1 flex flex-row mt-16">
                <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed top-16 left-0 bottom-0 z-9">

                    {/* header */}
                    <div className="p-4">
                        <Button
                            variant="dark"
                            size="fixed36"
                            align="left"
                            hasIconAsChild={true}
                            asChild
                            className="text-[13px] font-semibold font-sans"
                        >
                            <NavLink
                                to={paths.app.spaces.getHref()}
                                className="flex items-center font-medium w-full"
                            >
                                <Icon name="home" size={16} />
                                Все пространства
                            </NavLink>
                        </Button>
                    </div>

                    <DropdownMenuSeparator className="bg-gray-200 my-0 w-[262px]" />

                    {/* список пространств */}
                    <div className="flex flex-col grow min-h-0 overflow-y-auto overflow-x-hidden">
                        <div className="p-4 flex flex-col gap-6 bg-gray-50 flex-1 ">
                            {categories.map((category) => (
                                <div>
                                    <h3 className=" text-signature-small font-semibold font-sans text-gray-400 uppercase tracking-wider mb-4">
                                        {category.name}
                                    </h3>
                                    <nav className="space-y-1">
                                        {category.spaces.map((space) => (
                                            <button
                                                key={space.name}
                                                className="w-full flex flex-col items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-white hover:border-gray-200 hover:border-1 border border-gray-50 rounded-[14px] transition duration-150"
                                            >
                                                <div className="flex items-center gap-3 ">
                                                    <div className={`${space.color} rounded-lg  text-white h-[32px] w-[32px] flex items-center justify-center`}>
                                                        <GraduationCapIcon size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-sans font-semibold w-[156px] truncate text-left">{space.name}</span>
                                                        <span className="text-[10px] text-gray-400 font-sans font-medium truncate text-left">{space.count} проектов</span>
                                                    </div>
                                                </div>
                                                
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* footer */}
                    <div className="flex h-[69px] border-t border-gray-200 flex-none">
                        <div className="m-4 shrink-0 flex-none">
                            <Button
                                variant="outlineSoft"
                                size="fixed36"
                                icon={<Icon name="plus" size={16} />}
                                className="text-[13px] font-semibold font-sans justify-start"
                            >
                                Создать пространство
                            </Button>
                        </div>
                    </div>
                    
                    
                </aside>

                <main className="flex-1 overflow-y-auto ml-64">{children || <Outlet />}</main>
            </div>
        </div>
    );
}
