import * as React from "react";
import { IconButton } from "@/components/ui/button/icon-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";
import { LineButton } from "@/components/ui/button";

// Типы уведомлений
type NotificationType = "mention" | "request" | "join";

interface Notification {
    id: number;
    type: NotificationType;
    name: string;
    action: string;
    project: string;
    time: string;
    avatar: string;
    read: boolean;
}

// Моковые данные
const notifications: Notification[] = [
    {
        id: 1,
        type: "mention",
        name: "Anna N.",
        action: "mentioned you in",
        project: "AI Learning Platform",
        time: "5d ago",
        avatar: "AN",
        read: false,
    },
    {
        id: 2,
        type: "request",
        name: "Edward W.",
        action: "asks to join project",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "EW",
        read: false,
    },
    {
        id: 3,
        type: "join",
        name: "Will B.",
        action: "joined to",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "WB",
        read: true,
    },
    {
        id: 4,
        type: "mention",
        name: "Anna N.",
        action: "mentioned you in",
        project: "AI Learning Platform",
        time: "5d ago",
        avatar: "AN",
        read: true,
    },
    {
        id: 5,
        type: "request",
        name: "Edward W.",
        action: "asks to join project",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "EW",
        read: false,
    },
    {
        id: 6,
        type: "join",
        name: "Will B.",
        action: "joined to",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "WB",
        read: false,
    },
    {
        id: 7,
        type: "mention",
        name: "Anna N.",
        action: "mentioned you in",
        project: "AI Learning Platform",
        time: "5d ago",
        avatar: "AN",
        read: false,
    },
    {
        id: 8,
        type: "request",
        name: "Edward W.",
        action: "asks to join project",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "EW",
        read: false,
    },
    {
        id: 9,
        type: "join",
        name: "Will B.",
        action: "joined to",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "WB",
        read: true,
    },
    {
        id: 10,
        type: "mention",
        name: "Anna N.",
        action: "mentioned you in",
        project: "AI Learning Platform",
        time: "5d ago",
        avatar: "AN",
        read: true,
    },
    {
        id: 11,
        type: "request",
        name: "Edward W.",
        action: "asks to join project",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "EW",
        read: false,
    },
    {
        id: 12,
        type: "join",
        name: "Will B.",
        action: "joined to",
        project: "AI Learning Platform",
        time: "5h ago",
        avatar: "WB",
        read: false,
    },
];

// Фиксированные табы (без archive в данных, но оставим для дизайна)
const tabs = [
    { key: "all", label: "Все" },
    { key: "mentions", label: "Упоминания" },
    { key: "requests", label: "Запросы" },
    { key: "archive", label: "Архив" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function NotificationsNav() {
    const [activeTab, setActiveTab] = React.useState<TabKey>("all");

    // Подсчёт количества для каждого таба (для отображения рядом с названием)
    const counts = React.useMemo(() => {
        const all = notifications.length;
        const mentions = notifications.filter((n) => n.type === "mention").length;
        const requests = notifications.filter((n) => n.type === "request").length;
        // Для archive пока всегда 0, так как тип archive отсутствует
        const archive = 0;
        return { all, mentions, requests, archive };
    }, []);

    // Фильтрация уведомлений по активному табу
    const filteredNotifications = React.useMemo(() => {
        if (activeTab === "all") return notifications;
        if (activeTab === "mentions") return notifications.filter((n) => n.type === "mention");
        if (activeTab === "requests") return notifications.filter((n) => n.type === "request");
        if (activeTab === "archive") return []; // В архиве пока пусто
        return [];
    }, [activeTab]);

    // Отметить все как прочитанные
    const handleMarkAllAsRead = () => {
        // Здесь будет логика обновления данных
    };

    // Клик по уведомлению
    //const handleNotificationClick = (id: number) => {
    //  console.log("Notification clicked", id);
    //};

    // Количество непрочитанных для бейджа
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <IconButton
                    variant="ghost"
                    icon={<Icon name="bell" size={20} />}
                    badge={unreadCount}
                    className="outline-none"
                />
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-[481px] h-[472px] rounded-[16px]"
                align="end"
                sideOffset={4}
            >
                {/* Шапка */}
                <div className="flex items-center justify-between py-1 px-3.5 gap-1">
                    <DropdownMenuLabel className="font-sans text-[17px] font-semibold p-0">
                        Уведомления
                    </DropdownMenuLabel>
                    <LineButton
                        onClick={handleMarkAllAsRead}
                        className="font-sans text-[13px] font-semibold p-0 pt-1"
                    >
                        Пометить все как прочитанные
                    </LineButton>
                </div>

                {/* Табы */}
                <div className="flex gap-1 px-3 py-2">
                    {tabs.map((tab) => {
                        const count = counts[tab.key as keyof typeof counts];
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 font-sans text-[13px] font-medium rounded-full transition-colors",
                                    activeTab === tab.key
                                        ? "bg-white text-gray-900"
                                        : "text-gray-600 hover:bg-gray-100",
                                )}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={cn(
                                        "px-1.5 py-0.5 rounded-[6px] font-semibold font-sans text-[11px]",
                                        activeTab === tab.key
                                            ? "bg-blue-600 text-gray-200"
                                            : "bg-gray-200 text-gray-700",
                                    )}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <DropdownMenuSeparator className="bg-gray-200 my-0" />

                {/* Список уведомлений */}
                <div className="max-h-96 overflow-y-auto overflow-x-hidden pb-2">
                    {filteredNotifications.length === 0 ? (
                        <>
                            <div className="px-4 py-8 pb-10 text-center text-gray-500 text-sm font-sans">
                                Нет уведомлений
                            </div>
                            <DropdownMenuSeparator className="bg-gray-200 my-0 shrink-0" />
                        </>
                    ) : (
                        filteredNotifications.map((item) => (
                            <>
                                <DropdownMenuItem
                                    key={item.id}
                                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-none"
                                    //onSelect={() => handleNotificationClick(item.id)}
                                >
                                    {/* Аватар */}
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-sans text-signature-small font-medium shrink-0 border-white border border-[2px]">
                                        {item.avatar}
                                    </div>

                                    {/* Контент */}
                                    <div className="flex-1 flex flex-row justify-between min-w-0">
                                        {item.type === "request" ? (
                                            <>
                                                <div className="w-[280px]">
                                                    <p className="font-sans text-[13px] text-gray-900 truncate text-left">
                                                        <span className="font-semibold ">
                                                            {item.name}
                                                        </span>{" "}
                                                        {item.action}{" "}
                                                        <span className="font-semibold">
                                                            {item.project}
                                                        </span>
                                                    </p>
                                                    <p className="font-sans text-[10px] text-gray-500 font-medium">
                                                        {item.time}
                                                    </p>
                                                </div>
                                                <div className="flex ml-4 flex-row items-center">
                                                    <button className="p-2 flex items-center justify-center hover:bg-gray-200 rounded-[8px]">
                                                        <Icon name="check" size={20} />
                                                    </button>
                                                    <button className="p-2 flex items-center justify-center hover:bg-gray-200 rounded-[8px]">
                                                        <Icon name="cross" size={20} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col">
                                                <p className="font-sans text-[13px] text-gray-900 truncate text-left">
                                                    <span className="font-semibold ">
                                                        {item.name}
                                                    </span>{" "}
                                                    {item.action}{" "}
                                                    <span className="font-semibold">
                                                        {item.project}
                                                    </span>
                                                </p>
                                                <p className="font-sans text-[10px] text-gray-500 font-medium">
                                                    {item.time}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Индикатор непрочитанного убран, так как на дизайне его нет */}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-200 my-0 shrink-0" />
                            </>
                        ))
                    )}
                    {/* Footer */}

                    <div className="px-3 text-center shrink-0">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium font-sans w-full py-4">
                            Показать все
                        </button>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
