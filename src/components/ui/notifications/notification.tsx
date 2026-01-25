import { Info, CircleAlert, CircleX, CircleCheck, X } from "lucide-react";

const icons = {
    info: <Info className="size-6 text-blue-500" aria-hidden="true" />,
    success: <CircleCheck className="size-6 text-green-500" aria-hidden="true" />,
    warning: <CircleAlert className="size-6 text-yellow-500" aria-hidden="true" />,
    error: <CircleX className="size-6 text-red-500" aria-hidden="true" />,
};

export type NotificationProps = {
    notification: {
        id: string;
        type: keyof typeof icons;
        title: string;
        message?: string;
    };
    onDismiss: (id: string) => void;
};

export const Notification = ({
    notification: { id, type, title, message },
    onDismiss,
}: NotificationProps) => {
    return (
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            {/* Изменили rounded-lg на rounded-2xl для более сильного скругления */}
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                <div className="p-5" role="alert" aria-label={title}>
                    <div className="flex items-start">
                        <div className="shrink-0">{icons[type]}</div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-semibold text-gray-900">{title}</p>
                            {message && (
                                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                    {message}
                                </p>
                            )}
                        </div>
                        <div className="ml-4 flex shrink-0">
                            <button
                                className="inline-flex rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                                onClick={() => onDismiss(id)}
                            >
                                <span className="sr-only">Close</span>
                                {/* Заменил CircleX на обычный X для кнопки закрытия, так изящнее */}
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
