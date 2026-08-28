import { Icon } from "@/components/ui/icons";
import { ProfileHeader } from "@/components/ui/profile-header";
import { type ResumeUserInfo } from "@/types/api";

type Props = {
    user: ResumeUserInfo;
    role: string | null;
    isEditing?: boolean;
    editHeader?: string;
    onHeaderChange?: (value: string) => void;
    onEdit?: () => void;
};

const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
};

export const ProfileCard = ({
    user,
    role,
    isEditing,
    editHeader,
    onHeaderChange,
    onEdit,
}: Props) => {
    const fullName = [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ");

    const socials: { label: string; value: string }[] = [];
    if (user.tg_nickname) socials.push({ label: "Telegram", value: user.tg_nickname });
    if (user.vk_nickname) socials.push({ label: "VK", value: user.vk_nickname });

    if (isEditing) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-app-surface p-4 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8">
                <div className="h-[80px] w-[80px] sm:h-[120px] sm:w-[120px] rounded-[20px] bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-4xl font-bold shrink-0">
                    {getInitials(user.first_name, user.last_name)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 leading-tight truncate">
                            {fullName}
                        </h1>
                        <input
                            type="text"
                            value={editHeader ?? ""}
                            onChange={(e) => onHeaderChange?.(e.target.value)}
                            placeholder="Название резюме"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Контакты
                            </p>
                            <div className="flex flex-col gap-2">
                                {user.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Icon name="mail" size={14} className="text-gray-400" />
                                        {user.email}
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Icon name="clock" size={14} className="text-gray-400" />
                                        {user.phone}
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
                                                s.label.toLowerCase() === "telegram"
                                                    ? "telegram"
                                                    : "vk"
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
    }

    return (
        <ProfileHeader
            fullName={fullName}
            initials={getInitials(user.first_name, user.last_name)}
            role={role}
            email={user.email}
            phone={user.phone}
            socials={socials}
            showActions={!!onEdit}
            onEdit={onEdit}
        />
    );
};
