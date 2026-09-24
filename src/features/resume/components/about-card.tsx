import { LIMITS } from "@/features/resume/validation";

type Props = {
    content: string;
    isEditing?: boolean;
    editValue?: string;
    onChange?: (value: string) => void;
};

export const AboutCard = ({ content, isEditing, editValue, onChange }: Props) => {
    return (
        <div className="bg-app-surface rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">Обо мне</h2>
                {isEditing && (editValue?.length ?? 0) > 0 && (
                    <span className="text-xs text-gray-400">
                        {editValue?.length ?? 0} / {LIMITS.text}
                    </span>
                )}
            </div>
            {isEditing ? (
                <textarea
                    value={editValue ?? ""}
                    onChange={(e) => onChange?.(e.target.value)}
                    rows={5}
                    maxLength={LIMITS.text}
                    className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-[15px] text-app-text outline-none focus:border-app-blue resize-y"
                />
            ) : (
                <div className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
                    {content}
                </div>
            )}
        </div>
    );
};
