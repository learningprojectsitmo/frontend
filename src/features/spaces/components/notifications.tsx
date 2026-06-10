import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { IconButton } from "@/components/ui/button/icon-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";
import { LineButton } from "@/components/ui/button";
import { useMyNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/lib/notifications";
import { api } from "@/lib/api-client";
import type { NotificationType } from "@/types/api";

const RESPONSE_TYPES: NotificationType[] = ["response_received", "response_accepted", "response_rejected"];
const INVITATION_TYPES: NotificationType[] = ["invitation_received", "invitation_accepted", "invitation_rejected"];

const tabs = [
    { key: "all", labelKey: "notifications.tabs.all" },
    { key: "responses", labelKey: "notifications.tabs.responses" },
    { key: "invitations", labelKey: "notifications.tabs.invitations" },
    { key: "archive", labelKey: "notifications.tabs.archive" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatRelativeTime(dateStr: string, t: (key: string, opts?: object) => string): string {
    const now = dayjs();
    const date = dayjs(dateStr);
    const diffMinutes = now.diff(date, "minute");
    const diffHours = now.diff(date, "hour");
    const diffDays = now.diff(date, "day");

    if (diffMinutes < 1) return t("notifications.time.justNow");
    if (diffMinutes < 60) return t("notifications.time.minutesAgo", { minutes: diffMinutes });
    if (diffHours < 24) return t("notifications.time.hoursAgo", { hours: diffHours });
    return t("notifications.time.daysAgo", { days: diffDays });
}

export function NotificationsNav() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = React.useState<TabKey>("all");
    const { data, isLoading } = useMyNotifications();
    const markAllRead = useMarkAllNotificationsRead();
    const markRead = useMarkNotificationRead();

    const notifications = data?.items ?? [];

    const unreadCount = data?.unread_count ?? 0;

    const counts = React.useMemo(() => {
        const all = notifications.length;
        const responses = notifications.filter((n) => RESPONSE_TYPES.includes(n.type)).length;
        const invitations = notifications.filter((n) => INVITATION_TYPES.includes(n.type)).length;
        return { all, responses, invitations, archive: 0 };
    }, [notifications]);

    const filteredNotifications = React.useMemo(() => {
        if (activeTab === "all") return notifications;
        if (activeTab === "responses") return notifications.filter((n) => RESPONSE_TYPES.includes(n.type));
        if (activeTab === "invitations") return notifications.filter((n) => INVITATION_TYPES.includes(n.type));
        return [];
    }, [notifications, activeTab]);

    const handleMarkAllAsRead = () => {
        markAllRead.mutate();
    };

    const handleNotificationClick = (notificationId: number) => {
        markRead.mutate(notificationId);
        navigate("/app/profile?tab=responses");
    };

    const handleInvitationAction = async (
        e: React.MouseEvent,
        invitationId: number | undefined,
        action: "accept" | "reject",
        notificationId: number,
    ) => {
        e.stopPropagation();
        if (!invitationId) return;
        try {
            await api.patch(`/invitations/${invitationId}/${action}`);
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["profile", "invitations"] });
            markRead.mutate(notificationId);
        } catch {
            // ignore
        }
    };

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

            <DropdownMenuPortal>
                <DropdownMenuContent
                    className="w-[481px] h-[472px] rounded-[16px]"
                    align="end"
                    sideOffset={4}
                >
                    <div className="flex items-center justify-between py-1 px-3.5 gap-1">
                        <DropdownMenuLabel className="font-sans text-[17px] font-semibold p-0">
                            {t("notifications.title")}
                        </DropdownMenuLabel>
                        <LineButton
                            onClick={handleMarkAllAsRead}
                            className="font-sans text-[13px] font-semibold p-0 pt-1"
                        >
                            {t("notifications.markAllRead")}
                        </LineButton>
                    </div>

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
                                    <span>{t(tab.labelKey)}</span>
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

                    <div className="max-h-96 overflow-y-auto overflow-x-hidden pb-2">
                        {isLoading ? (
                            <div className="px-4 py-8 pb-10 text-center text-gray-500 text-sm font-sans">
                                Загрузка...
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <>
                                <div className="px-4 py-8 pb-10 text-center text-gray-500 text-sm font-sans">
                                    {t("notifications.empty")}
                                </div>
                                <DropdownMenuSeparator className="bg-gray-200 my-0 shrink-0" />
                            </>
                        ) : (
                            filteredNotifications.map((item) => {
                                const msg = t(`notifications.types.${item.type}`, {
                                    actor_name: item.data.actor_name,
                                    project_name: item.data.project_name,
                                });
                                const timeStr = formatRelativeTime(item.created_at, t);
                                const initials = getInitials(item.data.actor_name);
                                const isInvitation = item.type === "invitation_received";

                                return (
                                    <React.Fragment key={item.id}>
                                        <DropdownMenuItem
                                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-none"
                                            onClick={() => handleNotificationClick(item.id)}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-sans text-signature-small font-medium shrink-0 border-white border border-[2px]">
                                                {initials}
                                            </div>

                                            <div className="flex-1 flex flex-row justify-between min-w-0">
                                                {isInvitation && item.data.invitation_id ? (
                                                    <>
                                                        <div className="w-[280px]">
                                                            <p className="font-sans text-[13px] text-gray-900 text-left">
                                                                {msg}
                                                            </p>
                                                            <p className="font-sans text-[10px] text-gray-500 font-medium">
                                                                {timeStr}
                                                            </p>
                                                        </div>
                                                        <div className="flex ml-4 flex-row items-center">
                                                            <button
                                                                type="button"
                                                                onClick={(e) =>
                                                                    handleInvitationAction(
                                                                        e,
                                                                        item.data.invitation_id,
                                                                        "accept",
                                                                        item.id,
                                                                    )
                                                                }
                                                                className="p-2 flex items-center justify-center hover:bg-gray-200 rounded-[8px]"
                                                            >
                                                                <Icon name="check" size={20} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) =>
                                                                    handleInvitationAction(
                                                                        e,
                                                                        item.data.invitation_id,
                                                                        "reject",
                                                                        item.id,
                                                                    )
                                                                }
                                                                className="p-2 flex items-center justify-center hover:bg-gray-200 rounded-[8px]"
                                                            >
                                                                <Icon name="cross" size={20} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <p className="font-sans text-[13px] text-gray-900 text-left">
                                                            {msg}
                                                        </p>
                                                        <p className="font-sans text-[10px] text-gray-500 font-medium">
                                                            {timeStr}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gray-200 my-0 shrink-0" />
                                    </React.Fragment>
                                );
                            })
                        )}

                        <div className="px-3 text-center shrink-0">
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium font-sans w-full py-4">
                                {t("notifications.showAll")}
                            </button>
                        </div>
                    </div>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}
