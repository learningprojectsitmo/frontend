type Props = {
    content: string;
};

export const CoverLetterCard = ({ content }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Сопроводительное письмо
            </h2>
            <div className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
                {content}
            </div>
        </div>
    );
};
