import { type ResumeLanguage } from "@/types/api";

const LANGUAGE_FLAGS: Record<string, string> = {
    "Русский": "🇷🇺",
    "English": "🇬🇧",
    "Deutsch": "🇩🇪",
    "Français": "🇫🇷",
    "Español": "🇪🇸",
    "中文": "🇨🇳",
    "日本語": "🇯🇵",
};

type Props = {
    languages: ResumeLanguage[];
};

export const LanguagesCard = ({ languages }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-base font-semibold tracking-tight mb-4">Языки</h3>
            <div className="space-y-2">
                {languages.map((lang) => (
                    <div key={lang.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">
                            {LANGUAGE_FLAGS[lang.name] && `${LANGUAGE_FLAGS[lang.name]} `}{lang.name}
                        </span>
                        {lang.level && (
                            <span className="text-gray-400">{lang.level}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
