import { useState } from "react";
import { type ResumeSkill } from "@/types/api";
import { Icon } from "@/components/ui/icons";
import { useCreateResumeSkill, useDeleteResumeSkill } from "@/lib/resume";

type Props = {
    skills: ResumeSkill[];
    isEditing?: boolean;
    resumeId: number;
};

export const SkillsCard = ({ skills, isEditing, resumeId }: Props) => {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");

    const createMutation = useCreateResumeSkill(resumeId);
    const deleteMutation = useDeleteResumeSkill(resumeId);

    const handleAdd = () => {
        if (!name.trim()) return;
        createMutation.mutate(
            { resumeId, data: { name: name.trim() } },
            { onSuccess: () => { setName(""); setShowForm(false); } },
        );
    };

    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight">Навыки</h3>
                {isEditing && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-[13px] font-medium text-blue-500 hover:text-blue-700"
                    >
                        + Добавить
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <div key={skill.id} className="group relative">
                        <span className="px-3 py-1 rounded-full bg-zinc-100 text-sm text-gray-700">
                            {skill.name}
                        </span>
                        {isEditing && (
                            <button
                                onClick={() => deleteMutation.mutate(skill.id)}
                                className="absolute -top-1.5 -right-1.5 bg-red-400 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <Icon name="trash" size={10} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {isEditing && showForm && (
                <div className="mt-4 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Название навыка"
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-gray-400"
                    />
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowForm(false)} className="text-xs text-gray-500 px-3 py-1.5">
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
                </div>
            )}
        </div>
    );
};
