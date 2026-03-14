import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            // Добавляем кастомные классы для font-size
            "font-size": [
                "text-subheading",
                "text-signature-small",
                "text-heading-1",
                "text-heading-2",
                "text-heading-3",
                "text-heading-4",
                "text-body-large",
                "text-body",
                "text-button-large",
                "text-button",
                "text-input",
                "text-input-message",
                "text-signature",
                "text-link",
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return customTwMerge(clsx(inputs));
}
