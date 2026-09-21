import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { type PortfolioFull, type EducationFull, type LanguageFull } from "@/types/api";
import {
    useCreatePortfolio,
    useDeletePortfolio,
    useCreateEducation,
    useDeleteEducation,
    useCreateLanguage,
    useDeleteLanguage,
} from "@/lib/profile";

const FLAG_OPTIONS: { value: string; label: string }[] = [
    { value: "🇷🇺", label: "Русский" },
    { value: "🇺🇸", label: "Английский (US)" },
    { value: "🇬🇧", label: "Английский (UK)" },
    { value: "🇩🇪", label: "Немецкий" },
    { value: "🇫🇷", label: "Французский" },
    { value: "🇪🇸", label: "Испанский" },
    { value: "🇮🇹", label: "Итальянский" },
    { value: "🇨🇳", label: "Китайский" },
    { value: "🇯🇵", label: "Японский" },
    { value: "🇰🇷", label: "Корейский" },
    { value: "🇵🇱", label: "Польский" },
    { value: "🇹🇷", label: "Турецкий" },
    { value: "🌐", label: "Без флага" },
];

type AdditionalSectionProps = {
    portfolio: PortfolioFull[];
    education: EducationFull[];
    languages: LanguageFull[];
    readOnly?: boolean;
};

function SectionMiniEmptyState({ description }: { description: string }) {
    return (
        <div className="flex flex-col items-center py-8 px-4">
            <Icon name="rocket" size={80} className="text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-900">Здесь пока пусто</p>
            <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">{description}</p>
        </div>
    );
}

function AddForm({ children }: { children: ReactNode }) {
    return <div className="mt-3 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">{children}</div>;
}

function SectionActions({ onAdd }: { onAdd: () => void }) {
    return (
        <button
            onClick={onAdd}
            className="text-[13px] font-medium text-blue-500 hover:text-blue-700 transition-colors"
        >
            + Добавить
        </button>
    );
}

// ─── Portfolio Section ──────────────────────────────────────────────────

function PortfolioSection({ items, readOnly }: { items: PortfolioFull[]; readOnly?: boolean }) {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const createMutation = useCreatePortfolio();
    const deleteMutation = useDeletePortfolio();

    const handleAdd = () => {
        if (!title.trim() || !url.trim()) return;
        createMutation.mutate(
            { title: title.trim(), url: url.trim() },
            {
                onSuccess: () => {
                    setTitle("");
                    setUrl("");
                    setShowForm(false);
                },
            },
        );
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                    Портфолио
                </h3>
                {!readOnly && !showForm && <SectionActions onAdd={() => setShowForm(true)} />}
            </div>
            {items.length === 0 && !showForm ? (
                <SectionMiniEmptyState
                    description={
                        readOnly
                            ? "Здесь пока нет ссылок на портфолио"
                            : "Добавьте ссылки на портфолио, чтобы ваши работы могли видеть другие"
                    }
                />
            ) : (
                <div className="flex flex-col gap-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <Icon name="link" size={14} className="text-blue-500 shrink-0" />
                                <span className="truncate">{item.title}</span>
                            </a>
                            {!readOnly && (
                                <button
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {showForm && (
                <AddForm>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Название"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="URL"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-xs text-gray-500 px-3 py-1.5"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!title.trim() || !url.trim() || createMutation.isPending}
                            className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {createMutation.isPending ? "..." : "Добавить"}
                        </button>
                    </div>
                </AddForm>
            )}
        </div>
    );
}

// ─── Education Section ─────────────────────────────────────────────────

function EducationSection({ items, readOnly }: { items: EducationFull[]; readOnly?: boolean }) {
    const [showForm, setShowForm] = useState(false);
    const [institution, setInstitution] = useState("");
    const [faculty, setFaculty] = useState("");
    const [degree, setDegree] = useState("");
    const [years, setYears] = useState("");
    const createMutation = useCreateEducation();
    const deleteMutation = useDeleteEducation();

    const handleAdd = () => {
        if (!institution.trim()) return;
        createMutation.mutate(
            {
                institution: institution.trim(),
                faculty: faculty.trim(),
                degree: degree.trim(),
                years: years.trim(),
            },
            {
                onSuccess: () => {
                    setInstitution("");
                    setFaculty("");
                    setDegree("");
                    setYears("");
                    setShowForm(false);
                },
            },
        );
    };

    return (
        <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                    Образование
                </h3>
                {!readOnly && !showForm && <SectionActions onAdd={() => setShowForm(true)} />}
            </div>
            {items.length === 0 && !showForm ? (
                <SectionMiniEmptyState
                    description={
                        readOnly
                            ? "Здесь пока нет информации об образовании"
                            : "Добавьте информацию о своём образовании"
                    }
                />
            ) : (
                <div className="flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="group flex justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {item.institution}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.faculty}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {item.years} &middot; {item.degree}
                                </p>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {showForm && (
                <AddForm>
                    <input
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Учебное заведение"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <input
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        placeholder="Факультет"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <input
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        placeholder="Степень"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <input
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                        placeholder="Годы"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-xs text-gray-500 px-3 py-1.5"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!institution.trim() || createMutation.isPending}
                            className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {createMutation.isPending ? "..." : "Добавить"}
                        </button>
                    </div>
                </AddForm>
            )}
        </div>
    );
}

// ─── Language Section ──────────────────────────────────────────────────

function LanguageSection({ items, readOnly }: { items: LanguageFull[]; readOnly?: boolean }) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [level, setLevel] = useState("");
    const [flag, setFlag] = useState("");
    const createMutation = useCreateLanguage();
    const deleteMutation = useDeleteLanguage();

    const handleAdd = () => {
        if (!name.trim()) return;
        createMutation.mutate(
            { name: name.trim(), level: level.trim(), flag: flag.trim() || "🌐" },
            {
                onSuccess: () => {
                    setName("");
                    setLevel("");
                    setFlag("");
                    setShowForm(false);
                },
            },
        );
    };

    return (
        <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                    Языки
                </h3>
                {!readOnly && !showForm && <SectionActions onAdd={() => setShowForm(true)} />}
            </div>
            {items.length === 0 && !showForm ? (
                <SectionMiniEmptyState
                    description={
                        readOnly
                            ? "Здесь пока нет языков"
                            : "Добавьте информацию о ваших языках, чтобы с вами было легче общаться"
                    }
                />
            ) : (
                <div className="flex flex-col gap-2">
                    {items.map((lang) => (
                        <div
                            key={lang.id}
                            className="flex items-center justify-between text-sm group"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base">{lang.flag}</span>
                                <span className="text-gray-900 font-medium">{lang.name}</span>
                                <span className="text-gray-500">({lang.level})</span>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => deleteMutation.mutate(lang.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {showForm && (
                <AddForm>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Язык"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <input
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        placeholder="Уровень"
                        className="text-sm px-3 py-2 rounded-lg border border-app-border bg-app-surface text-app-text outline-none focus:border-app-blue"
                    />
                    <Select value={flag || "🌐"} onValueChange={setFlag}>
                        <SelectTrigger className="h-9 text-sm px-3 py-2 rounded-lg bg-app-surface">
                            <SelectValue placeholder="Флаг" />
                        </SelectTrigger>
                        <SelectContent>
                            {FLAG_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <span className="flex items-center gap-2">
                                        <span className="text-base leading-none">
                                            {option.value}
                                        </span>
                                        {option.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-xs text-gray-500 px-3 py-1.5"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!name.trim() || createMutation.isPending}
                            className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {createMutation.isPending ? "..." : "Добавить"}
                        </button>
                    </div>
                </AddForm>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────

export function AdditionalSection({
    portfolio,
    education,
    languages,
    readOnly,
}: AdditionalSectionProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-app-surface p-4 sm:p-6 flex flex-col gap-6">
            <h2 className="text-base font-bold text-gray-900">Дополнительно</h2>
            <PortfolioSection items={portfolio} readOnly={readOnly} />
            <EducationSection items={education} readOnly={readOnly} />
            <LanguageSection items={languages} readOnly={readOnly} />
        </div>
    );
}
