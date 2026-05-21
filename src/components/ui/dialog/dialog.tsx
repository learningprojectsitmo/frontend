import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
    className?: string;
};

export const Dialog = ({ open, onOpenChange, title, children, className }: DialogProps) => {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className={cn(
                        "fixed left-1/2 top-1/2 z-[300] w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
                        "rounded-2xl bg-white p-6 shadow-xl",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                        className,
                    )}
                >
                    <div className="mb-6 flex items-center justify-between">
                        <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
                            {title}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors">
                            <X className="size-5" />
                        </DialogPrimitive.Close>
                    </div>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
};
