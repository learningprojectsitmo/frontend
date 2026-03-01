import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icons";

export function UserNav() {
    return (
        <div className="flex items-center gap-4 p-4">
            {/* Выпадающее меню профиля */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="outline-none">
                        <Icon name="profile" size={25} className="text-gray-400 cursor-pointer" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-bold text-base px-4 py-3">
                        Мой аккаунт
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="p-1">
                        <DropdownMenuItem className="flex items-center px-4 py-3 rounded-[14px] cursor-pointer focus:bg-gray-50 group outline-none">
                            <Icon name="profile" size={16} className="mr-3 h-5 w-5 text-gray-800" />
                            <span className="text-[15px] font-medium text-gray-900">
                                Профиль и Резюме
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer py-2.5 px-3 focus:bg-gray-50">
                            <Icon
                                name="settings"
                                size={16}
                                className="mr-3 h-5 w-5 text-gray-500"
                            />
                            <span className="text-[15px] font-medium">Настройки</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer py-2.5 px-3 focus:bg-gray-50">
                            <Icon name="help" size={16} className="mr-3 h-5 w-5 text-gray-500" />
                            <span className="text-[15px] font-medium">Помощь и поддержка</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="p-1">
                        <DropdownMenuItem className="cursor-pointer py-2.5 px-3 text-gray-900 focus:bg-gray-50 focus:text-gray-900">
                            <Icon name="sign-out" size={16} className="mr-3 h-5 w-5 text-gray-500" />
                            <span className="text-[15px] font-medium">Выйти</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}