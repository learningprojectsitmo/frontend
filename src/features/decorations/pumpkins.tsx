import type { CSSProperties } from "react";

type Pumpkin = {
    x: string;
    y: string;
    size: string;
    delay: string;
};

/**
 * Тыквы-светильники покачиваются у краёв экрана. По роли — как ёлочные шары:
 * декор по периметру, который не перекрывает контент и не мешает кликам.
 */
const PUMPKINS: Pumpkin[] = [
    { x: "2%", y: "24%", size: "30px", delay: "0s" },
    { x: "94%", y: "32%", size: "26px", delay: "-2s" },
    { x: "6%", y: "72%", size: "22px", delay: "-3.4s" },
    { x: "90%", y: "78%", size: "34px", delay: "-1.2s" },
    { x: "46%", y: "5%", size: "24px", delay: "-2.7s" },
];

const PumpkinSvg = () => {
    return (
        <svg viewBox="0 0 64 62">
            {/* Тело — шире, чем выше: тыква приплюснутая, а не вытянутая */}
            <ellipse cx="32" cy="36" rx="24" ry="18" fill="#e8720c" />
            {/* Боковые дольки поверх тела, по краям */}
            <path
                d="M17 22c-6 4-9 9-9 14s3 10 9 14"
                fill="none"
                stroke="#c65f0a"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.5"
            />
            <path
                d="M47 22c6 4 9 9 9 14s-3 10-9 14"
                fill="none"
                stroke="#c65f0a"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.5"
            />
            {/* Центральная долька */}
            <ellipse cx="32" cy="36" rx="9" ry="18" fill="#f2913a" />
            {/* Черешок */}
            <rect x="29" y="8" width="6" height="11" rx="2.6" fill="#4f7f2c" />
            {/* Глаза-треугольники */}
            <path d="M22 31l7 0-3.5 7z" fill="#3a1d0a" />
            <path d="M42 31l-7 0 3.5 7z" fill="#3a1d0a" />
            {/* Улыбка */}
            <path
                d="M22 43l4 4 4-4 4 4 4-4 4 4"
                fill="none"
                stroke="#3a1d0a"
                strokeWidth="2.4"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export const Pumpkins = () => {
    return (
        <>
            {PUMPKINS.map((pumpkin, index) => (
                <span
                    key={index}
                    className="halloween-decor__pumpkin"
                    style={
                        {
                            "--halloween-x": pumpkin.x,
                            "--halloween-y": pumpkin.y,
                            "--halloween-size": pumpkin.size,
                            "--halloween-delay": pumpkin.delay,
                        } as CSSProperties
                    }
                >
                    <PumpkinSvg />
                </span>
            ))}
        </>
    );
};
