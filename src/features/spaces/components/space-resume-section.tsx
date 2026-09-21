import { useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { paths } from "@/config/paths";
import { type WorkspaceResumeItem } from "@/types/api";
import { Spinner } from "@/components/ui/spinner/spinner";
import { GraduationCap, Eye, Tag } from "lucide-react";
import { FilterTrigger } from "@/features/spaces/components/filters/filter-trigger";
import { FilterDropdown } from "@/features/spaces/components/filters/filter-dropdown";
import { FilterSection } from "@/features/spaces/components/filters/filter-section";
import { CheckboxGroup } from "@/features/spaces/components/filters/checkbox-group";

type SpaceResumeSectionProps = {
    items: WorkspaceResumeItem[];
    isLoading: boolean;
    workspaceId: number;
    isPrivate?: boolean;
    search: string;
    onSearchChange: (value: string) => void;
    selectedSkills: string[];
    onSkillsChange: (skills: string[]) => void;
    selectedInterests: string[];
    onInterestsChange: (interests: string[]) => void;
    availableSkills: string[];
    availableInterests: string[];
    onResetFilters: () => void;
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

function ResumeCard({
    resume,
    workspaceId,
    isPrivate,
}: {
    resume: WorkspaceResumeItem;
    workspaceId: number;
    isPrivate?: boolean;
}) {
    const initials = resume.participant_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <Link to={paths.app.resume.getHref(resume.id, null, workspaceId)} className="block h-full">
            <div className="bg-app-surface border border-gray-200 rounded-[20px] transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] min-w-[320px] h-full flex flex-col">
                <div className="p-5 flex flex-col gap-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center h-7 px-2.5 rounded-full text-[13px] font-medium leading-none bg-app-badge-blue text-app-badge-blue-fg">
                            <GraduationCap size={14} className="mr-1.5" />
                            Резюме
                        </span>
                        {isPrivate && !resume.in_team && (
                            <span className="inline-flex items-center h-7 px-2.5 rounded-full text-[12px] font-medium leading-none bg-app-badge-amber text-app-badge-amber-fg whitespace-nowrap">
                                Ещё не в команде
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[24px] font-bold text-gray-900 leading-[1.3] truncate">
                                    {resume.participant_name}
                                </h3>
                                <p className="text-[14px] leading-[1.6] text-app-muted truncate">
                                    {resume.header}
                                </p>
                            </div>
                        </div>
                    </div>

                    {resume.skills.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] text-gray-400">Навыки</span>
                            <div className="flex flex-wrap gap-2">
                                {resume.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center h-6 px-2 rounded-[8px] bg-app-badge-blue text-[12px] font-medium text-app-badge-blue-fg leading-none"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {resume.interests.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] text-gray-400">Интересы</span>
                            <div className="flex flex-wrap gap-2">
                                {resume.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="inline-flex items-center h-6 px-2 rounded-[8px] bg-app-badge-pink text-[12px] font-medium text-app-badge-pink-fg leading-none"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-5 pt-4 pb-5 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Eye size={16} className="text-gray-500 shrink-0" />
                        <span className="text-[13px] text-gray-600">Открыть резюме</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function Pagination({
    page,
    totalPages,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Назад
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-gray-400 text-sm">...</span>
                        )}
                        <button
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 text-sm font-medium rounded-[8px] transition-colors ${
                                p === page
                                    ? "bg-[#2563EB] text-white"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                            {p}
                        </button>
                    </span>
                ))}

            <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 rounded-[8px] border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                Вперёд
            </button>
        </div>
    );
}

export function SpaceResumeSection({
    items,
    isLoading,
    workspaceId,
    isPrivate = false,
    search,
    onSearchChange,
    selectedSkills,
    onSkillsChange,
    selectedInterests,
    onInterestsChange,
    availableSkills,
    availableInterests,
    onResetFilters,
    total,
    page,
    totalPages,
    onPageChange,
}: SpaceResumeSectionProps) {
    const [filterOpen, setFilterOpen] = useState(false);

    const activeFilterCount = selectedSkills.length + selectedInterests.length;
    const hasActiveFilters = Boolean(search) || activeFilterCount > 0;

    if (isLoading) {
        return (
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-app-text">Резюме участников</h2>
                </div>
                <div className="flex items-center justify-center py-16">
                    <Spinner size="lg" />
                </div>
            </section>
        );
    }

    if (total === 0 && !hasActiveFilters) {
        return null;
    }

    return (
        <section>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-app-text">Резюме участников ({total})</h2>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Поиск резюме"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-[240px] h-10 pl-9 pr-3 bg-app-surface border border-gray-200 rounded-[12px] text-[14px] text-app-text placeholder:text-gray-400 outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>

                    {(availableSkills.length > 0 || availableInterests.length > 0) && (
                        <div className="relative">
                            <FilterTrigger
                                activeCount={activeFilterCount}
                                open={filterOpen}
                                onClick={() => setFilterOpen((v) => !v)}
                            />
                            <FilterDropdown
                                open={filterOpen}
                                onClose={() => setFilterOpen(false)}
                                onReset={onResetFilters}
                            >
                                {availableSkills.length > 0 && (
                                    <FilterSection
                                        icon={<Tag size={16} />}
                                        label="Навыки"
                                        count={selectedSkills.length}
                                    >
                                        <CheckboxGroup
                                            options={availableSkills.map((s) => ({
                                                value: s,
                                                label: s,
                                            }))}
                                            selected={selectedSkills}
                                            onChange={onSkillsChange}
                                        />
                                    </FilterSection>
                                )}
                                {availableInterests.length > 0 && (
                                    <FilterSection
                                        icon={<Tag size={16} />}
                                        label="Интересы"
                                        count={selectedInterests.length}
                                    >
                                        <CheckboxGroup
                                            options={availableInterests.map((i) => ({
                                                value: i,
                                                label: i,
                                            }))}
                                            selected={selectedInterests}
                                            onChange={onInterestsChange}
                                        />
                                    </FilterSection>
                                )}
                            </FilterDropdown>
                        </div>
                    )}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-16 text-app-muted text-sm">
                    {hasActiveFilters ? "Резюме не найдены" : "В этом пространстве пока нет резюме"}
                </div>
            ) : (
                <>
                    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                        {items.map((resume) => (
                            <ResumeCard
                                key={resume.id}
                                resume={resume}
                                workspaceId={workspaceId}
                                isPrivate={isPrivate}
                            />
                        ))}
                    </div>

                    <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </>
            )}
        </section>
    );
}
