import type { CSSProperties } from "react";

type Bat = {
    top: string;
    size: string;
    duration: string;
    delay: string;
    reverse: boolean;
};

/**
 * Летучие мыши проносятся через верхнюю часть экрана. По роли — как ёлочные
 * шары у новогоднего декора: оживляют сцену, но держатся у краёв и в верхней
 * зоне, чтобы не мешать чтению и не ловить клики.
 *
 * `reverse` разворачивает анимацию: мыши летят в обе стороны, иначе движение
 * выглядело бы механическим.
 */
const BATS: Bat[] = [
    { top: "8%", size: "46px", duration: "24s", delay: "0s", reverse: false },
    { top: "15%", size: "30px", duration: "30s", delay: "-6s", reverse: true },
    { top: "25%", size: "22px", duration: "27s", delay: "-13s", reverse: false },
    { top: "7%", size: "18px", duration: "34s", delay: "-21s", reverse: true },
    { top: "20%", size: "38px", duration: "29s", delay: "-3s", reverse: false },
    { top: "31%", size: "26px", duration: "32s", delay: "-17s", reverse: true },
];

const BatSvg = () => {
    return (
        <svg viewBox="0 0 120 44" fill="currentColor">
            {/* Крылья */}
            <path d="M60 16 C50 6 36 6 26 16 C36 15 46 19 53 27 Z" />
            <path d="M60 16 C70 6 84 6 94 16 C84 15 74 19 67 27 Z" />
            {/* Тело */}
            <ellipse cx="60" cy="22" rx="6" ry="9" />
            {/* Уши */}
            <path d="M55 13 L57 3 L61 11 Z" />
            <path d="M65 13 L63 3 L59 11 Z" />
        </svg>
    );
};

/** При системном «уменьшить движение» мыши просто замирают на местах. */
export const Bats = ({ staticMode = false }: { staticMode?: boolean }) => {
    return (
        <>
            {BATS.map((bat, index) => (
                <span
                    key={index}
                    className={
                        staticMode
                            ? "halloween-decor__bat halloween-decor__bat--static"
                            : "halloween-decor__bat"
                    }
                    style={
                        {
                            top: bat.top,
                            width: bat.size,
                            // В статике анимации нет, поэтому позиция X задаётся
                            // здесь же, иначе мышь застряла бы за кадром (left: -160px).
                            left: staticMode ? `${10 + index * 15}%` : undefined,
                            "--bat-duration": bat.duration,
                            "--bat-delay": bat.delay,
                            "--bat-direction": bat.reverse ? "reverse" : "normal",
                        } as CSSProperties
                    }
                >
                    <BatSvg />
                </span>
            ))}
        </>
    );
};
