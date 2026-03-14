import React, { useState, useEffect } from "react";

interface ResendCodeTimerProps {
    initialSeconds?: number;
    onResend: () => void;
    disabled?: boolean;
}

export const ResendCodeTimer: React.FC<ResendCodeTimerProps> = ({
    initialSeconds = 60,
    onResend,
    disabled = false,
}) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    const resetTimer = () => setSecondsLeft(initialSeconds);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    const formatTime = (totalSeconds: number): string => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const isActive = secondsLeft <= 0;

    const isButtonDisabled = !isActive || disabled;

    return (
        <div className="flex items-center justify-between py-2">
            {!isActive ? (
                <span className="text-gray-600 text-sans font-semibold text-signature">
                    Новый код через {formatTime(secondsLeft)}
                </span>
            ) : (
                <span className="text-gray-600 w-150"></span>
            )}
            <button
                type="button"
                onClick={() => {
                    if (isActive && !disabled) {
                        onResend();
                        resetTimer();
                    }
                }}
                disabled={isButtonDisabled}
                className="text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed text-sans font-semibold text-signature"
            >
                Отправить код повторно
            </button>
        </div>
    );
};
