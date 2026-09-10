import { cn } from "@/lib/utils";

interface RichTextViewerProps {
    html: string;
    className?: string;
    clamp?: number;
}

export const RichTextViewer = ({ html, className, clamp }: RichTextViewerProps) => {
    return (
        <div
            className={cn(
                "block-editor-content",
                clamp && `line-clamp-${clamp}`,
                className,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};
