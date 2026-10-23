import { useEffect, useState, type CSSProperties } from "react";

import { HALLOWEEN_EASTER_EGG_EVENT } from "./legends";

type Pumpkin = {
    id: number;
    x: string;
    y: string;
    size: string;
    delay: string;
};

/**
 * Тыквы-светильники покачиваются у краёв экрана. По роли — как ёлочные шары:
 * декор по периметру, который не перекрывает контент и не мешает кликам.
 *
 * Клик по тыкве зажигает огонёк: глаза и улыбка становятся тёпло-жёлтыми, а
 * вокруг появляется свечение. Повторный клик гасит.
 */
const PUMPKINS: Pumpkin[] = [
    { id: 1, x: "1.5%", y: "38%", size: "32px", delay: "0s" },
    { id: 2, x: "96%", y: "44%", size: "28px", delay: "-2s" },
    { id: 3, x: "2%", y: "83%", size: "24px", delay: "-3.4s" },
    { id: 4, x: "94%", y: "84%", size: "36px", delay: "-1.2s" },
    { id: 5, x: "88%", y: "14%", size: "26px", delay: "-2.7s" },
];

const PumpkinSvg = ({ lit }: { lit: boolean }) => {
    const face = lit ? "#fff3a0" : "#3a1d0a";

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
            <path d="M22 31l7 0-3.5 7z" fill={face} />
            <path d="M42 31l-7 0 3.5 7z" fill={face} />
            {/* Улыбка */}
            <path
                d="M22 43l4 4 4-4 4 4 4-4 4 4"
                fill="none"
                stroke={face}
                strokeWidth="2.4"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export const Pumpkins = () => {
    const [litIds, setLitIds] = useState<Set<number>>(() => new Set());
    const allLit = litIds.size === PUMPKINS.length;

    useEffect(() => {
        if (allLit) {
            window.dispatchEvent(new Event(HALLOWEEN_EASTER_EGG_EVENT));
        }
    }, [allLit]);

    const toggle = (id: number) => {
        setLitIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <>
            {PUMPKINS.map((pumpkin) => {
                const lit = litIds.has(pumpkin.id);
                return (
                    <span
                        key={pumpkin.id}
                        className={
                            lit
                                ? "halloween-decor__pumpkin halloween-decor__pumpkin--lit"
                                : "halloween-decor__pumpkin"
                        }
                        style={
                            {
                                "--halloween-x": pumpkin.x,
                                "--halloween-y": pumpkin.y,
                                "--halloween-size": pumpkin.size,
                                "--halloween-delay": pumpkin.delay,
                            } as CSSProperties
                        }
                        onClick={() => toggle(pumpkin.id)}
                        title={lit ? "Погасить тыкву" : "Зажечь тыкву"}
                    >
                        <PumpkinSvg lit={lit} />
                    </span>
                );
            })}
        </>
    );
};
