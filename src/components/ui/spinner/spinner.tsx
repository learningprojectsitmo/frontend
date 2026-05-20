import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

function Spinner({ className, size, ...props }: React.ComponentProps<"svg"> & { size?: number | "lg" | "sm" }) {
    const sizeMap = { lg: 24, sm: 16, md: 16 };
    const pixelSize = typeof size === "string" ? (sizeMap[size as keyof typeof sizeMap] ?? 16) : (size ?? 16);

    return (
        <Loader2Icon
            size={pixelSize}
            role="status"
            aria-label="Loading"
            className={cn("animate-spin", className)}
            {...props}
        />
    );
}

export { Spinner };
