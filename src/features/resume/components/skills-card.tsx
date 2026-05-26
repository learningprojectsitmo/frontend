import { type ResumeSkill } from "@/types/api";

type Props = {
    skills: ResumeSkill[];
};

export const SkillsCard = ({ skills }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-base font-semibold tracking-tight mb-4">Навыки</h3>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <span
                        key={skill.id}
                        className="px-3 py-1 rounded-full bg-zinc-100 text-sm text-gray-700"
                    >
                        {skill.name}
                    </span>
                ))}
            </div>
        </div>
    );
};
