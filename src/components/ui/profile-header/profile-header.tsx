import { Camera } from "lucide-react";

import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SocialLink = { label: string; value: string };

type ProfileHeaderProps = {
    fullName: string;
    initials: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    socials: SocialLink[];
    /** Абсолютный URL фото профиля (см. resolveAvatarUrl). */
    avatarUrl?: string;
    /** Если задан — на аватаре появляется оверлей «Изменить фото». */
    onAvatarEdit?: () => void;
    showActions?: boolean;
    onEdit?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
};

export const ProfileHeader = ({
    fullName,
    initials,
    role,
    email,
    phone,
    socials,
    avatarUrl,
    onAvatarEdit,
    showActions = false,
    onEdit,
    onShare,
    onDelete,
}: ProfileHeaderProps) => {
    const avatar = (
        <Avatar className="size-[80px] shrink-0 sm:size-[120px]">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-600 text-2xl font-bold text-white sm:text-4xl">
                {initials}
            </AvatarFallback>
        </Avatar>
    );

    return (
        <div className="rounded-2xl border border-gray-200 bg-app-surface p-4 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8">
            {onAvatarEdit ? (
                <button
                    type="button"
                    onClick={onAvatarEdit}
                    aria-label="Изменить фото профиля"
                    className="group/avatar-edit relative h-fit w-fit shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-app-blue focus-visible:ring-offset-2"
                >
                    {avatar}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover/avatar-edit:opacity-100 group-focus-visible/avatar-edit:opacity-100">
                        <Camera className="size-6 sm:size-7" aria-hidden />
                    </span>
                </button>
            ) : (
                avatar
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 leading-tight truncate">
                            {fullName}
                        </h1>
                        {role && <p className="text-sm text-gray-500 mt-1">{role}</p>}
                    </div>

                    {showActions && (
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="dark"
                                size="hug36"
                                icon={<Icon name="pen" size={14} />}
                                className="text-[13px] font-semibold gap-1.5 rounded-xl"
                                onClick={onEdit}
                            >
                                <span className="hidden sm:inline">Редактировать</span>
                            </Button>
                            {onShare && (
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    icon={<Icon name="share" size={14} />}
                                    className="text-[13px] font-semibold gap-1.5 rounded-xl"
                                    onClick={onShare}
                                >
                                    <span className="hidden sm:inline">Поделиться</span>
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    icon={<Icon name="trash" size={14} />}
                                    className="text-[13px] font-semibold gap-1.5 rounded-xl border-red-300 text-red-700 hover:bg-red-100"
                                    onClick={onDelete}
                                >
                                    <span className="hidden sm:inline">Удалить</span>
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Контакты
                        </p>
                        <div className="flex flex-col gap-2">
                            {email && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Icon name="mail" size={14} className="text-gray-400" />
                                    {email}
                                </div>
                            )}
                            {phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Icon name="clock" size={14} className="text-gray-400" />
                                    {phone}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Соцсети
                        </p>
                        <div className="flex flex-col gap-2">
                            {socials.map((s) => (
                                <div
                                    key={s.label}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <Icon
                                        name={
                                            s.label.toLowerCase() === "telegram" ? "telegram" : "vk"
                                        }
                                        size={14}
                                        className="text-gray-400"
                                    />
                                    {s.value}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
