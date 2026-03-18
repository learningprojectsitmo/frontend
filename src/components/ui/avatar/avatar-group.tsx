// components/ui/avatar/avatar-group.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

export interface AvatarGroupProps {
    users: Array<{
        src?: string;
        name: string;
    }>;
    max?: number;
    className?: string;
}

export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
    ({ users, max = 3, className }, ref) => {
        const displayUsers = users.slice(0, max);
        const remainingCount = users.length - max;

        return (
            <div ref={ref} className={cn("flex flex-row-reverse items-center", className)}>
                {remainingCount > 0 && (
                    <div className="w-6 h-6 rounded-full bg-[--azure-24] flex items-center justify-center border-2 border-white text-[--grey-4] text-[10px] font-medium -ml-2 z-10">
                        +{remainingCount}
                    </div>
                )}
                {displayUsers.map((user, index) => (
                    <div key={index} className="-ml-2 first:ml-0" style={{ zIndex: max - index }}>
                        <Avatar name={user.name} src={user.src} />
                    </div>
                ))}
            </div>
        );
    },
);

AvatarGroup.displayName = "AvatarGroup";
