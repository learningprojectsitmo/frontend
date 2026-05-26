import { type ResumeInterest } from "@/types/api";

type Props = {
    interests: ResumeInterest[];
};

export const InterestsCard = ({ interests }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-base font-semibold tracking-tight mb-4">Интересы</h3>
            <div className="space-y-1">
                {interests.map((item) => (
                    <p key={item.id} className="text-sm text-gray-700">
                        {item.name}
                    </p>
                ))}
            </div>
        </div>
    );
};
