import { useRouteError } from "react-router";
import { SpaceLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function describeError(err: any): string {
    if (!err) return "undefined/null";
    if (err instanceof Error) return `${String(err?.stack ?? err.message ?? err)}`;
    return JSON.stringify(err, null, 2);
}

export const ErrorBoundary = () => {
    // @ts-expect-error — временный диагностический вывод (удалить после фикса)
    const routeError = useRouteError();

    return (
        <div style={{ padding: 32 }}>
            <h1 style={{ fontWeight: 700, marginBottom: 8 }}>Something went wrong!</h1>
            <pre
                style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "#b91c1c",
                    background: "#fef2f2",
                    padding: 16,
                    borderRadius: 8,
                    maxHeight: "60vh",
                    overflow: "auto",
                }}
            >
                {describeError(routeError)}
            </pre>
        </div>
    );
};

const AppRoot = () => {
    return (
        <ProtectedRoute>
            <SpaceLayout />
        </ProtectedRoute>
    );
};

export default AppRoot;
