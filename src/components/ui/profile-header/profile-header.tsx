import { Icon } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/button/icon-button";
import { Button } from "@/components/ui/button";

type SocialLink = { label: string; value: string };

type ProfileHeaderProps = {
    fullName: string;
    initials: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    socials: SocialLink[];
    showActions?: boolean;
    onEdit?: () => void;
};

export const ProfileHeader = ({
    fullName,
    initials,
    role,
    email,
    phone,
    socials,
    showActions = false,
    onEdit,
}: ProfileHeaderProps) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="h-[80px] w-[80px] sm:h-[120px] sm:w-[120px] rounded-[20px] bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-4xl font-bold shrink-0">
                {initials}
            </div>

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
                            <IconButton
                                className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center"
                                icon={<Icon name="kebab" size={16} />}
                                variant="ghost"
                            />
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
