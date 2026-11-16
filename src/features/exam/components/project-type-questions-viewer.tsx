import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useProjectTypeQuestions } from "@/lib/exams";

export const ProjectTypeQuestionsViewer = ({ workspaceId, typeId, typeName }: {
    workspaceId: number;
    typeId: number;
    typeName: string;
}) => {
    const [open, setOpen] = useState(false);
    const query = useProjectTypeQuestions(workspaceId, typeId);
    return (
        <div className="rounded-xl border border-gray-200">
            <button type="button" className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen((value) => !value)}>
                <span className="font-semibold text-app-text">Критерии: {typeName}</span>
                {open ? <ChevronUp className="size-4 text-app-muted" /> : <ChevronDown className="size-4 text-app-muted" />}
            </button>
            {open && <div className="border-t border-gray-200 p-4">
                {query.isLoading ? <Spinner /> : query.data?.questions.length ? (
                    <div className="space-y-4">
                        {query.data.questions.map((question, index) => (
                            <div key={question.id} className="rounded-lg bg-gray-50 p-3">
                                <p className="font-medium text-app-text">{index + 1}. {question.text}</p>
                                {question.description && <p className="mt-1 text-sm text-app-muted">{question.description}</p>}
                                <div className="mt-3 grid gap-2 sm:grid-cols-5">
                                    {question.levels.map((level) => <div key={level.score} className="rounded-md border bg-app-surface p-2 text-xs">
                                        <span className="font-semibold text-blue-700">{level.score}</span>
                                        <p className="mt-1 text-app-muted">{level.description}</p>
                                    </div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-app-muted">Критерии ещё не добавлены.</p>}
            </div>}
        </div>
    );
};
