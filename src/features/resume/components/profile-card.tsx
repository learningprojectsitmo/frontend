import { ProfileHeader } from "@/components/ui/profile-header";
import { type ResumeUserInfo } from "@/types/api";

type Props = {
    user: ResumeUserInfo;
    role: string | null;
};

const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
};

export const ProfileCard = ({ user, role }: Props) => {
    const fullName = [user.last_name, user.first_name, user.middle_name]
        .filter(Boolean)
        .join(" ");

    const socials: { label: string; value: string }[] = [];
    if (user.tg_nickname) socials.push({ label: "Telegram", value: user.tg_nickname });
    if (user.vk_nickname) socials.push({ label: "VK", value: user.vk_nickname });

    return (
        <ProfileHeader
            fullName={fullName}
            initials={getInitials(user.first_name, user.last_name)}
            role={role}
            email={user.email}
            phone={user.phone}
            socials={socials}
            showActions
        />
    );
};
