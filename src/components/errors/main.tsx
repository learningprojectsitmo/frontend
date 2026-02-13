import { Button } from "../ui/button/button";

export const MainErrorFallback = () => {
    return (
        <div
            className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
            role="alert"
        >
            <h2 className="text-lg font-semibold">Ooops, something went wrong :( </h2>
            <Button variant="outlineSoft" size="hug36">
                Refresh
            </Button>
        </div>
    );
};
