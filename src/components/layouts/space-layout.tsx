import { NavLink, Outlet } from "react-router";
import { paths } from "@/config/paths";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/features/spaces/components/user-nav";
import { Icon } from "@/components/ui/icons";
import { SearchBar } from "../ui/search-bar";
import { NotificationsNav } from "@/features/spaces/components/notifications";
import { DropdownMenuSeparator } from "@/components/ui/dropdown/dropdown-menu";
import { GraduationCapIcon } from "lucide-react";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router";
import { useDebounce } from "../../utils/debounce";
import { getSuggestions, useSpacesList, useNotificationsList } from "@/lib/spaces";
import { Link } from "react-router";

export function SpaceLayout({ children }: { children?: React.ReactNode }) {
    const { data: spacesData } = useSpacesList(); // isLoading: isLoadingSpaces, error: errorSpaces
    const { data: notificationsData } = useNotificationsList(); // isLoading: isLoadingNotifications, error: errorNotifications,

    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id");

    const categories = useMemo(() => {
        //if (!spacesData) return [];
        return spacesData?.categories.map((cat) => ({
            name: cat.name,
            spaces: spacesData.spaces.filter((space) => space.category === cat.name),
        }));
    }, [spacesData]);

    const categoriesExample = [
        {
            name: "Дисциплины",
            spaces: [
                { id: 1, title: "Управление проектами", projectsCount: 8, color: "bg-blue-500" },
                {
                    id: 2,
                    title: "Проектная деятельность",
                    projectsCount: 5,
                    color: "bg-indigo-500",
                },
                {
                    id: 3,
                    title: "Введение в профдеятельность",
                    projectsCount: 7,
                    color: "bg-orange-500",
                },
                { id: 4, title: "Управление процессами", projectsCount: 12, color: "bg-red-500" },
                { id: 5, title: "Основы управления", projectsCount: 9, color: "bg-pink-500" },
            ],
        },
        {
            name: "Общеуниверситетские проекты",
            spaces: [
                {
                    id: 6,
                    title: "Центр студенческих инициатив",
                    projectsCount: 512,
                    color: "bg-green-500",
                },
            ],
        },
    ];

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [suggestions, setSuggestions] = useState<string[]>([
        "Mobile App",
        "Mobile App Learning",
        "Mobile App X",
        "Web Development",
        "UI/UX Design",
    ]);

    useEffect(() => {
        const loadSuggestions = async () => {
            const suggestions = await getSuggestions(debouncedSearch);
            setSuggestions(suggestions);
        };
        if (debouncedSearch) {
            loadSuggestions();
        }
    }, [debouncedSearch]);

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
                            onChange={setSearch}
                            suggestions={suggestions}
                            value={search}
                        />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                            variant="outlineSoft"
                            size="fixed36"
                            align="left"
                            hasIconAsChild={true}
                            asChild
                            className="w-full"
                        >
                            <NavLink
                                to={paths.app.kanban.getHref(1)} // ID = 1 для примера
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center font-medium transition-all w-full",
                                        isActive
                                            ? "bg-[#0F1117] text-white"
                                            : "text-gray-600 hover:bg-gray-100",
                                    )
                                }
                            >
                                Канбан доска
                            </NavLink>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <NotificationsNav notifications={notificationsData} />
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
                            {(categories || categoriesExample).map((category) => (
                                <div>
                                    <h3 className=" text-signature-small font-semibold font-sans text-gray-400 uppercase tracking-wider mb-4">
                                        {category.name}
                                    </h3>
                                    <nav className="space-y-1">
                                        {category.spaces.map((space) => (
                                            <Link to={paths.app.space.getHref(space.id)}>
                                                <button
                                                    key={space.title}
                                                    className={cn(
                                                        "w-full flex flex-col items-center justify-between px-4 py-2 text-sm rounded-[14px] transition duration-150 mb-1",
                                                        urlId === String(space.id)
                                                            ? "bg-white border-gray-200 border-1 border"
                                                            : "text-gray-700 hover:bg-white hover:border-gray-200 hover:border-1 border border-gray-50",
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 ">
                                                        <div
                                                            className={`${space.color} rounded-lg  text-white h-[32px] w-[32px] flex items-center justify-center`}
                                                        >
                                                            <GraduationCapIcon size={16} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-sans font-semibold w-[156px] truncate text-left">
                                                                {space.title}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-sans font-medium truncate text-left">
                                                                {space.projectsCount} проектов
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </Link>
                                        ))}
                                    </nav>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* footer */}
                    {spacesData?.role !== "manager" && spacesData?.role !== "member" ? (
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
                    ) : (
                        ""
                    )}
                </aside>

                <main className="flex-1 overflow-y-auto ml-64">{children || <Outlet />}</main>
            </div>
        </div>
    );
}
