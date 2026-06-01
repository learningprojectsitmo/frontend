import { useState } from "react";
import { type ResumeEducation } from "@/types/api";
import { Icon } from "@/components/ui/icons";
import { useCreateResumeEducation, useDeleteResumeEducation } from "@/lib/resume";

type Props = {
    educations: ResumeEducation[];
    isEditing?: boolean;
    resumeId: number;
};

export const EducationCard = ({ educations, isEditing, resumeId }: Props) => {
    const [showForm, setShowForm] = useState(false);
    const [institution, setInstitution] = useState("");
    const [faculty, setFaculty] = useState("");
    const [degree, setDegree] = useState("");
    const [years, setYears] = useState("");

    const createMutation = useCreateResumeEducation(resumeId);
    const deleteMutation = useDeleteResumeEducation(resumeId);

    const handleAdd = () => {
        if (!institution.trim()) return;
        createMutation.mutate(
            { resumeId, data: { institution: institution.trim(), faculty: faculty || null, degree: degree || null, years: years || null } },
            { onSuccess: () => { setInstitution(""); setFaculty(""); setDegree(""); setYears(""); setShowForm(false); } },
        );
    };

    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold tracking-tight">Образование</h3>
                {isEditing && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-[13px] font-medium text-blue-500 hover:text-blue-700"
                    >
                        + Добавить
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {educations.map((edu) => (
                    <div key={edu.id} className="group flex justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{edu.institution}</p>
                            {edu.faculty && <p className="text-sm text-gray-500">{edu.faculty}</p>}
                            <p className="text-sm text-gray-400">
                                {[edu.degree, edu.years].filter(Boolean).join(", ")}
                            </p>
                        </div>
                        {isEditing && (
                            <button
                                onClick={() => deleteMutation.mutate(edu.id)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                            >
                                <Icon name="trash" size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {isEditing && showForm && (
                <div className="mt-4 flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                    <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Учебное заведение" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
                    <input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="Факультет" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
                    <input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="Степень" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
                    <input value={years} onChange={(e) => setYears(e.target.value)} placeholder="Год" className="text-sm px-3 py-2 rounded-lg border border-gray-200" />
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowForm(false)} className="text-xs text-gray-500 px-3 py-1.5">Отмена</button>
                        <button onClick={handleAdd} disabled={!institution.trim() || createMutation.isPending} className="text-xs font-medium text-white bg-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50">
                            {createMutation.isPending ? "..." : "Добавить"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
