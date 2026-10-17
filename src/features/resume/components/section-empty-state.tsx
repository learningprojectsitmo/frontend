import { Icon } from "@/components/ui/icons";

export const SectionEmptyState = ({ description }: { description: string }) => {
    return (
        <div className="flex flex-col items-center py-8 px-4">
            <Icon name="rocket" size={80} className="text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-900">Здесь пока пусто</p>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">{description}</p>
        </div>
    );
};
