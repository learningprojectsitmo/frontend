import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch/switch";
import { type ResumeDetail } from "@/types/api";
import { CoverLetterCard } from "./cover-letter-card";
import { ProfileCard } from "./profile-card";
import { ExperienceTimeline } from "./experience-timeline";
import { ExperienceSection } from "@/features/profile/components/ExperienceSection";
import { AboutCard } from "./about-card";
import { PortfolioCard } from "./portfolio-card";
import { EducationCard } from "./education-card";
import { LanguagesCard } from "./languages-card";
import { SkillsCard } from "./skills-card";
import { InterestsCard } from "./interests-card";

type Props = {
    data: ResumeDetail;
    isEditing?: boolean;
    sectionsEditable?: boolean;
    onEdit?: () => void;
    onSave?: (data: {
        header: string;
        role: string | null;
        about: string | null;
        cover_letter: string | null;
        has_experience: boolean;
        no_experience_description: string | null;
        is_visible: boolean;
    }) => void;
    onCancel?: () => void;
};

export const ResumePage = ({
    data,
    isEditing,
    sectionsEditable = isEditing,
    onEdit,
    onSave,
    onCancel,
}: Props) => {
    const [editHeader, setEditHeader] = useState("");
    const [editAbout, setEditAbout] = useState("");
    const [editCoverLetter, setEditCoverLetter] = useState("");
    const [editHasExperience, setEditHasExperience] = useState(true);
    const [editNoExpDescription, setEditNoExpDescription] = useState("");
    const [editIsVisible, setEditIsVisible] = useState(true);

    useEffect(() => {
        setEditHeader(data.resume.header);
        setEditAbout(data.resume.about ?? "");
        setEditCoverLetter(data.resume.cover_letter ?? "");
        setEditHasExperience(data.resume.has_experience);
        setEditNoExpDescription(data.resume.no_experience_description ?? "");
        setEditIsVisible(data.resume.is_visible);
    }, [
        data.resume.header,
        data.resume.about,
        data.resume.cover_letter,
        data.resume.has_experience,
        data.resume.no_experience_description,
        data.resume.is_visible,
    ]);

    return (
        <div className="flex flex-col gap-6">
            {isEditing && (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={editIsVisible}
                            onCheckedChange={setEditIsVisible}
                            id="resume-visibility"
                        />
                        <label
                            htmlFor="resume-visibility"
                            className="text-sm text-gray-600 cursor-pointer"
                        >
                            {editIsVisible ? "Видно всем" : "Скрыто"}
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="hug36"
                            className="text-[13px] font-semibold gap-1.5 rounded-xl"
                            onClick={onCancel}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            icon={<Icon name="check" size={14} />}
                            className="text-[13px] font-semibold gap-1.5 rounded-xl"
                            onClick={() =>
                                onSave?.({
                                    header: editHeader,
                                    role: data.resume.role,
                                    about: editAbout || null,
                                    cover_letter: editCoverLetter || null,
                                    has_experience: editHasExperience,
                                    no_experience_description: editNoExpDescription || null,
                                    is_visible: editIsVisible,
                                })
                            }
                        >
                            Сохранить
                        </Button>
                    </div>
                </div>
            )}

            <ProfileCard
                user={data.user}
                role={data.resume.role}
                isEditing={isEditing}
                editHeader={editHeader}
                onHeaderChange={setEditHeader}
                onEdit={onEdit}
            />

            {(data.resume.cover_letter || isEditing) && (
                <CoverLetterCard
                    content={data.resume.cover_letter ?? ""}
                    isEditing={isEditing}
                    editValue={editCoverLetter}
                    onChange={setEditCoverLetter}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                <div className="flex flex-col gap-6">
                    {isEditing ? (
                        <ExperienceTimeline
                            experiences={data.experiences}
                            isEditing={sectionsEditable}
                            resumeId={data.resume.id}
                            hasExperience={editHasExperience}
                            noExperienceDescription={editNoExpDescription}
                            onHasExperienceChange={setEditHasExperience}
                            onNoExperienceDescriptionChange={setEditNoExpDescription}
                        />
                    ) : data.experiences.length > 0 ? (
                        <ExperienceSection experiences={data.experiences} />
                    ) : !data.resume.has_experience && data.resume.no_experience_description ? (
                        <div className="bg-app-surface rounded-3xl border border-zinc-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold tracking-tight text-gray-900 mb-3">
                                Опыт работы
                            </h3>
                            <p className="text-sm text-gray-600">Нет опыта</p>
                            <p className="text-[15px] leading-relaxed text-gray-700 mt-2 whitespace-pre-line">
                                {data.resume.no_experience_description}
                            </p>
                        </div>
                    ) : null}
                    {data.resume.about && !isEditing && <AboutCard content={data.resume.about} />}
                    {isEditing && (
                        <AboutCard
                            content={data.resume.about ?? ""}
                            isEditing
                            editValue={editAbout}
                            onChange={setEditAbout}
                        />
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {(data.links.length > 0 || isEditing) && (
                        <PortfolioCard
                            links={data.links}
                            isEditing={sectionsEditable}
                            resumeId={data.resume.id}
                        />
                    )}
                    {(data.educations.length > 0 || isEditing) && (
                        <EducationCard
                            educations={data.educations}
                            isEditing={sectionsEditable}
                            resumeId={data.resume.id}
                        />
                    )}
                    {(data.languages.length > 0 || isEditing) && (
                        <LanguagesCard
                            languages={data.languages}
                            isEditing={sectionsEditable}
                            resumeId={data.resume.id}
                        />
                    )}
                    {(data.skills.length > 0 || isEditing) && (
                        <SkillsCard
                            skills={data.skills}
                            isEditing={sectionsEditable}
                            resumeId={data.resume.id}
                        />
                    )}
                    {(data.interests.length > 0 || isEditing) && (
                        <InterestsCard
                            interests={data.interests}
                            isEditing={sectionsEditable}
                            resumeId={data.resume.id}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
