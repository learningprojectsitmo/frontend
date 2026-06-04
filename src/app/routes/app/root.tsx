import { SpaceLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/lib/auth";

export const ErrorBoundary = () => {
    return <div>Something went wrong!</div>;
};

const AppRoot = () => {
    return (
        <ProtectedRoute>
            <SpaceLayout />
        </ProtectedRoute>
    );
};

export default AppRoot;
