import { Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type IdeasHeaderProps = {
    onNewIdea: () => void;
};

export function IdeasHeader({ onNewIdea }: IdeasHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[--azure-60]/10 flex items-center justify-center shrink-0">
                    <Lightbulb size={24} className="text-[--azure-60]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                        У вас есть идея?
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Предлагайте свои идеи по улучшению платформы
                    </p>
                </div>
            </div>
            <Button variant="dark" size="hug36" icon={<Plus size={18} />} onClick={onNewIdea}>
                Предложить идею
            </Button>
        </div>
    );
}
