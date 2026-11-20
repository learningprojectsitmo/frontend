import { useSearchParams } from "react-router";
import { ExamsOverview } from "@/features/exam/components/exams-overview";

export default function ExamsRoute() {
    const [params, setParams] = useSearchParams();
    const workspaceId = Number(params.get("workspaceId")) || 0;

    return (
        <ExamsOverview
            workspaceId={workspaceId}
            onWorkspaceChange={(id) => setParams(id ? { workspaceId: String(id) } : {})}
        />
    );
}
