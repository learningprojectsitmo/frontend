import { type ResumeEducation } from "@/types/api";

type Props = {
    educations: ResumeEducation[];
};

export const EducationCard = ({ educations }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-base font-semibold tracking-tight mb-4">Образование</h3>
            <div className="space-y-4">
                {educations.map((edu) => (
                    <div key={edu.id}>
                        <p className="text-sm font-medium text-gray-900">{edu.institution}</p>
                        {edu.faculty && (
                            <p className="text-sm text-gray-500">{edu.faculty}</p>
                        )}
                        <p className="text-sm text-gray-400">
                            {[edu.degree, edu.year].filter(Boolean).join(", ")}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
