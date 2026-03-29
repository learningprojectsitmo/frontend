import { IconButton } from "@/components/ui/button/icon-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths.ts";
import { useNavigate } from "react-router";
import { useLogout } from "@/lib/auth";

export function UserNav() {
    const navigate = useNavigate();
    const logout = useLogout();
    const handleLogout = () => {
        logout.mutate(undefined, {
            onSuccess: () => {
                navigate("/auth/login");
            },
        });
    };

    return (
        <div className="flex items-center gap-4">
            {/* Выпадающее меню профиля */}
            <DropdownMenu modal={false}>
                {/* modal=false чтобы меню не блокировало фокус при открытии */}
                <DropdownMenuTrigger asChild>
                    <IconButton
                        className="outline-none w-9 h-9 flex items-center justify-center cursor-pointer"
                        icon={<Icon name="profile" size={20} />}
                        variant="ghost"
                    />
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-[194px] rounded-[12px] p-0" align="end">
                    <DropdownMenuLabel className="font-semibold font-sans text-[13px] px-4 py-3 h-[40px]">
                        Мой аккаунт
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-gray-200 my-0" />

                    <DropdownMenuGroup className="p-[6px] gap-1 flex flex-col">
                        <DropdownMenuItem className="cursor-pointer px-2 py-1 focus:bg-gray-50 rounded-[8px] gap-2">
                            <Icon name="profile" size={16} className="h-5 w-5 text-gray-500" />
                            <span className="text-[13px] font-sans font-medium text-gray-900">
                                Профиль и Резюме
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="cursor-pointer px-2 py-1 focus:bg-gray-50 rounded-[8px] gap-2"
                            onClick={() => navigate(paths.app.settings.roles.getHref())}
                        >
                            <Icon name="settings" size={16} className="h-5 w-5 text-gray-500" />
                            <span className="text-[13px] font-sans font-medium">Настройки</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer px-2 py-1 focus:bg-gray-50 rounded-[8px] gap-1.5">
                            <Icon name="help" size={16} className=" h-5 w-5 text-gray-500" />
                            <span className="text-[13px] font-sans font-medium">
                                Помощь и поддержка
                            </span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-gray-200 my-0" />

                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <button
                                className="cursor-pointer px-2 py-1 text-gray-900 focus:bg-gray-50 focus:text-gray-900 gap-2 h-[40px]"
                                onClick={handleLogout}
                            >
                                <Icon
                                    name="sign-out"
                                    size={16}
                                    className="h-5 ml-1 w-5 text-gray-500"
                                />
                                <span className="text-[13px] font-sans font-medium">Выйти</span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
