import { type ResumeExperience } from "@/types/api";

type Props = {
    experiences: ResumeExperience[];
};

export const ExperienceTimeline = ({ experiences }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">Опыт работы</h2>
            <div className="flex flex-col gap-6">
                {experiences.map((exp) => (
                    <ExperienceItem key={exp.id} experience={exp} />
                ))}
            </div>
        </div>
    );
};

const ExperienceItem = ({ experience }: { experience: ResumeExperience }) => {
    const period = [
        experience.period_from
            ? new Date(experience.period_from).toLocaleDateString("ru-RU", {
                  month: "long",
                  year: "numeric",
              })
            : "",
        experience.period_to
            ? new Date(experience.period_to).toLocaleDateString("ru-RU", {
                  month: "long",
                  year: "numeric",
              })
            : "настоящее время",
    ]
        .filter(Boolean)
        .join(" — ");

    return (
        <div className="border-l-2 border-zinc-200 pl-5 pb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span className="font-medium text-gray-900">{experience.company}</span>
                {experience.duration && (
                    <>
                        <span className="text-zinc-300">·</span>
                        <span>{experience.duration}</span>
                    </>
                )}
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">{experience.position}</p>
            {period && <p className="text-xs text-gray-400 mb-3">{period}</p>}
            {experience.responsibilities && experience.responsibilities.length > 0 && (
                <ul className="space-y-1 mb-3">
                    {experience.responsibilities.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-zinc-300 mt-0.5">•</span>
                            {item}
                        </li>
                    ))}
                </ul>
            )}
            {experience.skills && experience.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {experience.skills.map((skill, i) => (
                        <span
                            key={i}
                            className="px-3 py-1 rounded-full bg-zinc-100 text-sm text-gray-600"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
