type Props = {
    content: string;
    isEditing?: boolean;
    editValue?: string;
    onChange?: (value: string) => void;
};

export const CoverLetterCard = ({ content, isEditing, editValue, onChange }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Сопроводительное письмо</h2>
            {isEditing ? (
                <textarea
                    value={editValue ?? ""}
                    onChange={(e) => onChange?.(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[15px] text-gray-700 outline-none focus:border-gray-500 resize-y"
                />
            ) : (
                <div className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
                    {content}
                </div>
            )}
        </div>
    );
};
