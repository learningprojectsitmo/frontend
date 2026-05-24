import { Icon } from "@/components/ui/icons";

type PortfolioLink = { title: string; url: string };
type EducationEntry = { institution: string; faculty: string; degree: string; years: string };
type Language = { name: string; level: string; flag: string };

type AdditionalSectionProps = {
    portfolio: PortfolioLink[];
    education: EducationEntry[];
    languages: Language[];
};

function SectionMiniEmptyState({ description }: { description: string }) {
    return (
        <div className="flex flex-col items-center py-8 px-4">
            <Icon name="rocket" size={80} className="text-gray-300 mb-4" />
            <p className="text-sm font-bold text-gray-900">Здесь пока пусто</p>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">{description}</p>
        </div>
    );
}

function AddLink() {
    return (
        <button className="text-[13px] font-medium text-blue-500 hover:text-blue-700 transition-colors">
            + Добавить
        </button>
    );
}

export function AdditionalSection({ portfolio, education, languages }: AdditionalSectionProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-6">
            <h2 className="text-base font-bold text-gray-900">Дополнительно</h2>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                        Портфолио
                    </h3>
                    <AddLink />
                </div>
                {portfolio.length === 0 ? (
                    <SectionMiniEmptyState description="Добавьте ссылки на портфолио, чтобы ваши работы могли видеть другие" />
                ) : (
                    <div className="flex flex-col gap-2">
                        {portfolio.map((item) => (
                            <a
                                key={item.url}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Icon name="link" size={14} className="text-blue-500 shrink-0" />
                                <span className="truncate">{item.title}</span>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                        Образование
                    </h3>
                    <AddLink />
                </div>
                {education.length === 0 ? (
                    <SectionMiniEmptyState description="Добавьте информацию о своём образовании" />
                ) : (
                    <div className="flex flex-col gap-4">
                        {education.map((item, i) => (
                            <div key={i}>
                                <p className="text-sm font-semibold text-gray-900">
                                    {item.institution}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.faculty}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {item.years} &middot; {item.degree}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                        Языки
                    </h3>
                    <AddLink />
                </div>
                {languages.length === 0 ? (
                    <SectionMiniEmptyState description="Добавьте информацию о ваших языках, чтобы с вами было легче общаться" />
                ) : (
                    <div className="flex flex-col gap-2">
                        {languages.map((lang) => (
                            <div key={lang.name} className="flex items-center gap-2 text-sm">
                                <span className="text-base">{lang.flag}</span>
                                <span className="text-gray-900 font-medium">{lang.name}</span>
                                <span className="text-gray-500">({lang.level})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
