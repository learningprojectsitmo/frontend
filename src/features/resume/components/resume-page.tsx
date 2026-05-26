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
};

export const ResumePage = ({ data }: Props) => {
    return (
        <div className="flex flex-col gap-6">
            {data.resume.cover_letter && (
                <CoverLetterCard content={data.resume.cover_letter} />
            )}

            <ProfileCard
                user={data.user}
                role={data.resume.role}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                <div className="flex flex-col gap-6">
                    {data.experiences.length > 0 && (
                        <ExperienceTimeline experiences={data.experiences} />
                    )}
                    {data.resume.about && (
                        <AboutCard content={data.resume.about} />
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {data.links.length > 0 && (
                        <PortfolioCard links={data.links} />
                    )}
                    {data.educations.length > 0 && (
                        <EducationCard educations={data.educations} />
                    )}
                    {data.languages.length > 0 && (
                        <LanguagesCard languages={data.languages} />
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
