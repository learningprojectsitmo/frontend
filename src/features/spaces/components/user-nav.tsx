import { User, Settings, LifeBuoy, LogOut, UserCircle } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserNav() {
    return (
        <div className="flex items-center gap-4 p-4">
            {/* Выпадающее меню уведомлений */} {/* Выпадающее меню профиля */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <User className="text-gray-400 cursor-pointer" size={25} />
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-bold text-base px-4 py-3">
                        Мой аккаунт
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="p-1">
                        <DropdownMenuItem className="flex items-center px-4 py-3 rounded-[14px] cursor-pointer focus:bg-gray-50 group outline-none">
                            <UserCircle className="mr-3 h-5 w-5 text-gray-800" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium text-gray-900">
                                Профиль и Резюме
                            </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer py-2.5 px-3 focus:bg-gray-50">
                            <Settings className="mr-3 h-5 w-5 text-gray-500" />
                            <span className="text-[15px] font-medium">Настройки</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer py-2.5 px-3 focus:bg-gray-50">
                            <LifeBuoy className="mr-3 h-5 w-5 text-gray-500" />
                            <span className="text-[15px] font-medium">Помощь и поддержка</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup className="p-1">
                        <DropdownMenuItem className="cursor-pointer py-2.5 px-3 text-gray-900 focus:bg-gray-50 focus:text-gray-900">
                            <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                            <span className="text-[15px] font-medium">Выйти</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
