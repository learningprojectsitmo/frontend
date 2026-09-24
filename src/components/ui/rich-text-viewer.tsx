import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface RichTextViewerProps {
    html: string;
    className?: string;
    clamp?: number;
}

const clampClasses: Record<number, string> = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
    5: "line-clamp-5",
    6: "line-clamp-6",
};

const RichTextViewer = forwardRef<HTMLDivElement, RichTextViewerProps>(
    ({ html, className, clamp }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("block-editor-content", clamp && clampClasses[clamp], className)}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );
    },
);

RichTextViewer.displayName = "RichTextViewer";

export { RichTextViewer };
