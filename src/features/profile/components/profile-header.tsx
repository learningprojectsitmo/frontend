import { ProfileHeader as SharedProfileHeader } from "@/components/ui/profile-header";

type SocialLink = { label: string; value: string };

type ProfileHeaderProps = {
    firstName: string;
    middleName?: string;
    lastName: string;
    role: string;
    phone: string;
    email: string;
    socials: SocialLink[];
    avatarUrl?: string;
    onAvatarEdit?: () => void;
    readOnly?: boolean;
    onEdit?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
};

export const ProfileHeader = ({
    firstName,
    middleName,
    lastName,
    role,
    phone,
    email,
    socials,
    avatarUrl,
    onAvatarEdit,
    readOnly,
    onEdit,
    onShare,
    onDelete,
}: ProfileHeaderProps) => {
    const fullName = `${lastName} ${firstName}${middleName ? ` ${middleName}` : ""}`.trim();
    const initials = String(`${firstName[0] ?? ""}${lastName[0] ?? ""}`).toUpperCase();

    return (
        <SharedProfileHeader
            fullName={fullName}
            initials={initials}
            role={role}
            email={email}
            phone={phone}
            socials={socials}
            avatarUrl={avatarUrl}
            onAvatarEdit={onAvatarEdit}
            showActions={!readOnly}
            onEdit={onEdit}
            onShare={onShare}
            onDelete={onDelete}
        />
    );
};
