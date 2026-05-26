import { ProfileHeader as SharedProfileHeader } from "@/components/ui/profile-header";

type ProfileHeaderProps = {
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    email: string;
    socials: { label: string; value: string }[];
};

export function ProfileHeader({
    firstName,
    lastName,
    role,
    phone,
    email,
    socials,
}: ProfileHeaderProps) {
    return (
        <SharedProfileHeader
            fullName={`${firstName} ${lastName}`}
            initials={`${firstName[0]}${lastName[0]}`}
            role={role}
            email={email}
            phone={phone}
            socials={socials}
            showActions
        />
    );
}
