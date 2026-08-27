import { useState, useMemo } from "react";
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
            <div className="bg-white border border-[#E5E7EB] rounded-[20px] transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] min-w-[320px] h-full flex flex-col">
                <div className="p-5 flex flex-col gap-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center h-7 px-2.5 rounded-full text-[13px] font-medium leading-none bg-[#EEF2FF] text-[#4F46E5]">
                            <GraduationCap size={14} className="mr-1.5" />
                            Резюме
                        </span>
                        {isPrivate && !resume.in_team && (
                            <span className="inline-flex items-center h-7 px-2.5 rounded-full text-[12px] font-medium leading-none bg-[#FEF3C7] text-[#92400E] whitespace-nowrap">
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
                                <h3 className="text-[24px] font-bold text-[#111827] leading-[1.3] truncate">
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
                            <span className="text-[12px] text-[#9CA3AF]">Навыки</span>
                            <div className="flex flex-wrap gap-2">
                                {resume.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center h-6 px-2 rounded-[8px] bg-[#EEF2FF] text-[12px] font-medium text-[#4F46E5] leading-none"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {resume.interests.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] text-[#9CA3AF]">Интересы</span>
                            <div className="flex flex-wrap gap-2">
                                {resume.interests.map((interest) => (
                                    <span
                                        key={interest}
                                        className="inline-flex items-center h-6 px-2 rounded-[8px] bg-[#FDF2F8] text-[12px] font-medium text-[#DB2777] leading-none"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-5 pt-4 pb-5 border-t border-[#F1F1F1]">
                    <div className="flex items-center gap-2">
                        <Eye size={16} className="text-[#6B7280] shrink-0" />
                        <span className="text-[13px] text-[#4B5563]">Открыть резюме</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function SpaceResumeSection({
    items,
    isLoading,
    workspaceId,
    isPrivate = false,
}: SpaceResumeSectionProps) {
    const [search, setSearch] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);

    const allSkills = useMemo(() => {
        return [...new Set(items.flatMap((r) => r.skills))].sort((a, b) =>
            a.localeCompare(b, "ru"),
        );
    }, [items]);

    const allInterests = useMemo(() => {
        return [...new Set(items.flatMap((r) => r.interests))].sort((a, b) =>
            a.localeCompare(b, "ru"),
        );
    }, [items]);

    const filteredItems = useMemo(() => {
        let result = items;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (r) =>
                    r.participant_name.toLowerCase().includes(q) ||
                    r.header.toLowerCase().includes(q) ||
                    r.skills.some((s) => s.toLowerCase().includes(q)) ||
                    r.interests.some((i) => i.toLowerCase().includes(q)),
            );
        }

        if (selectedSkills.length > 0) {
            result = result.filter((r) => selectedSkills.some((s) => r.skills.includes(s)));
        }

        if (selectedInterests.length > 0) {
            result = result.filter((r) => selectedInterests.some((i) => r.interests.includes(i)));
        }

        return result;
    }, [items, search, selectedSkills, selectedInterests]);

    const activeFilterCount = selectedSkills.length + selectedInterests.length;

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

    if (items.length === 0) {
        return null;
    }

    return (
        <section>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-app-text">
                    Резюме участников ({filteredItems.length})
                </h2>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                        />
                        <input
                            type="text"
                            placeholder="Поиск резюме"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[240px] h-10 pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[12px] text-[14px] text-app-text placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB] transition-colors"
                        />
                    </div>

                    {(allSkills.length > 0 || allInterests.length > 0) && (
                        <div className="relative">
                            <FilterTrigger
                                activeCount={activeFilterCount}
                                open={filterOpen}
                                onClick={() => setFilterOpen((v) => !v)}
                            />
                            <FilterDropdown
                                open={filterOpen}
                                onClose={() => setFilterOpen(false)}
                                onReset={() => {
                                    setSelectedSkills([]);
                                    setSelectedInterests([]);
                                }}
                            >
                                {allSkills.length > 0 && (
                                    <FilterSection
                                        icon={<Tag size={16} />}
                                        label="Навыки"
                                        count={selectedSkills.length}
                                    >
                                        <CheckboxGroup
                                            options={allSkills.map((s) => ({
                                                value: s,
                                                label: s,
                                            }))}
                                            selected={selectedSkills}
                                            onChange={setSelectedSkills}
                                        />
                                    </FilterSection>
                                )}
                                {allInterests.length > 0 && (
                                    <FilterSection
                                        icon={<Tag size={16} />}
                                        label="Интересы"
                                        count={selectedInterests.length}
                                    >
                                        <CheckboxGroup
                                            options={allInterests.map((i) => ({
                                                value: i,
                                                label: i,
                                            }))}
                                            selected={selectedInterests}
                                            onChange={setSelectedInterests}
                                        />
                                    </FilterSection>
                                )}
                            </FilterDropdown>
                        </div>
                    )}
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-app-muted text-sm">
                    {search || selectedSkills.length > 0
                        ? "Резюме не найдены"
                        : "В этом пространстве пока нет резюме"}
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                    {filteredItems.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            workspaceId={workspaceId}
                            isPrivate={isPrivate}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
