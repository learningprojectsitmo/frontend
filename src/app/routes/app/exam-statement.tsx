import { useSearchParams } from "react-router";
import { ExamStatement } from "@/features/exam/components/exam-statement";

export default function ExamStatementRoute() {
    const [params] = useSearchParams();
    const workspaceId = Number(params.get("workspaceId") ?? 0);
    return <ExamStatement key={String(workspaceId)} workspaceId={workspaceId} />;
}
