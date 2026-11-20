import { Button } from "@/components/ui/button";

export function ExamErrorState({ message, retry, pending }: {
    message: string;
    retry?: () => void;
    pending?: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-sm text-app-text [overflow-wrap:anywhere]">
            <p role="alert">{message}</p>
            {retry && (
                <Button variant="outline" size="hug36" loading={pending} onClick={retry}>
                    Повторить
                </Button>
            )}
        </div>
    );
}

export function ExamRouteError() {
    return (
        <div className="flex flex-col items-center gap-3 p-8 text-center text-app-text">
            <p role="alert">Что-то пошло не так. Попробуйте перезагрузить страницу.</p>
            <Button variant="outline" size="hug36" onClick={() => window.location.reload()}>
                Перезагрузить
            </Button>
        </div>
    );
}
