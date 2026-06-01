import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { type ResumeDetail } from "@/types/api";
import { CoverLetterCard } from "./cover-letter-card";
import { ProfileCard } from "./profile-card";
import { ExperienceTimeline } from "./experience-timeline";
import { AboutCard } from "./about-card";
import { PortfolioCard } from "./portfolio-card";
import { EducationCard } from "./education-card";
import { LanguagesCard } from "./languages-card";
import { SkillsCard } from "./skills-card";
import { InterestsCard } from "./interests-card";

type Props = {
    data: ResumeDetail;
    isEditing?: boolean;
    onEdit?: () => void;
    onSave?: (data: { role: string | null; about: string | null; cover_letter: string | null }) => void;
    onCancel?: () => void;
};

export const ResumePage = ({ data, isEditing, onEdit, onSave, onCancel }: Props) => {
    const [editRole, setEditRole] = useState("");
    const [editAbout, setEditAbout] = useState("");
    const [editCoverLetter, setEditCoverLetter] = useState("");

    useEffect(() => {
        setEditRole(data.resume.role ?? "");
        setEditAbout(data.resume.about ?? "");
        setEditCoverLetter(data.resume.cover_letter ?? "");
    }, [data.resume.role, data.resume.about, data.resume.cover_letter]);

    return (
        <div className="flex flex-col gap-6">
            {isEditing && (
                <div className="flex items-center justify-end gap-3">
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
                                role: editRole || null,
                                about: editAbout || null,
                                cover_letter: editCoverLetter || null,
                            })
                        }
                    >
                        Сохранить
                    </Button>
                </div>
            )}

            {data.resume.cover_letter && !isEditing && (
                <CoverLetterCard content={data.resume.cover_letter} />
            )}
            {isEditing && (
                <CoverLetterCard
                    content={data.resume.cover_letter ?? ""}
                    isEditing
                    editValue={editCoverLetter}
                    onChange={setEditCoverLetter}
                />
            )}

            <ProfileCard
                user={data.user}
                role={data.resume.role}
                isEditing={isEditing}
                editRole={editRole}
                onRoleChange={setEditRole}
                onEdit={onEdit}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                <div className="flex flex-col gap-6">
                    {data.experiences.length > 0 && (
                        <ExperienceTimeline experiences={data.experiences} />
                    )}
                    {data.resume.about && !isEditing && (
                        <AboutCard content={data.resume.about} />
                    )}
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
                        <PortfolioCard links={data.links} isEditing={isEditing} resumeId={data.resume.id} />
                    )}
                    {(data.educations.length > 0 || isEditing) && (
                        <EducationCard educations={data.educations} isEditing={isEditing} resumeId={data.resume.id} />
                    )}
                    {(data.languages.length > 0 || isEditing) && (
                        <LanguagesCard languages={data.languages} isEditing={isEditing} resumeId={data.resume.id} />
                    )}
                    {data.skills.length > 0 && (
                        <SkillsCard skills={data.skills} />
                    )}
                    {data.interests.length > 0 && (
                        <InterestsCard interests={data.interests} />
                    )}
                </div>
            </div>
        </div>
    );
};
