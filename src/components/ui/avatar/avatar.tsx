// components/ui/avatar/avatar.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps {
    src?: string;
    name: string;
    className?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
    ({ src, name, className }, ref) => {
        // Get initials from name (max 2 letters)
        const initials = name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        if (src) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        "w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border-2 border-white",
                        className,
                    )}
                >
                    <img src={src} alt={name} className="w-full h-full object-cover" />
                </div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "w-6 h-6 rounded-full bg-[--azure-24] flex items-center justify-center flex-shrink-0 border-2 border-white",
                    "text-[--grey-4] text-[12px] font-medium",
                    className,
                )}
            >
                {initials}
            </div>
        );
    },
);

Avatar.displayName = "Avatar";
