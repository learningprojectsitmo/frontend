import { useEffect, useRef, useState, type CSSProperties } from "react";

import { HALLOWEEN_EASTER_EGG_EVENT } from "./legends";

type Bat = {
    left: string;
    size: string;
    delay: string;
};

type Escape = {
    x: string;
    y: string;
    rotate: string;
    midX: string;
    midY: string;
    midRotate: string;
};

/**
 * Мыши висят под хедером вниз головой, как в пещере. Клик по мыши вспугивает
 * только её: она улетает и через несколько секунд возвращается на насест.
 * Кромка «пещеры» сверху вспугивает всю стаю сразу.
 */
const BATS: Bat[] = [
    { left: "10%", size: "40px", delay: "0s" },
    { left: "28%", size: "32px", delay: "-1.2s" },
    { left: "46%", size: "44px", delay: "-2.6s" },
    { left: "65%", size: "34px", delay: "-0.7s" },
    { left: "82%", size: "38px", delay: "-3.1s" },
];

const ESCAPE_ANIMATION_MS = 2600;
const RETURN_DELAY_MS = 8000;

const BatOpenSvg = () => {
    return (
        <svg
            className="halloween-decor__bat-svg halloween-decor__bat-svg--open"
            viewBox="0 0 64 80"
            fill="currentColor"
        >
            {/* По одному цельному крылу с каждой стороны, без «лишних» лопастей */}
            <g className="halloween-decor__bat-wing halloween-decor__bat-wing--left">
                <path d="M31 33C24 21 13 16 2 20c7 8 10 17 11 27 1 5 4 9 9 11-1-7 1-16 9-25Z" />
                <path
                    className="halloween-decor__bat-wing-vein"
                    d="M28 35C21 31 14 27 6 22M27 44c-4 3-7 7-8 12"
                />
            </g>
            <g className="halloween-decor__bat-wing halloween-decor__bat-wing--right">
                <path d="M33 33c7-12 18-17 29-13-7 8-10 17-11 27-1 5-4 9-9 11 1-7-1-16-9-25Z" />
                <path
                    className="halloween-decor__bat-wing-vein"
                    d="M36 35c7-4 14-8 22-13M37 44c4 3 7 7 8 12"
                />
            </g>
            {/* Тело */}
            <g className="halloween-decor__bat-body">
                <ellipse cx="32" cy="40" rx="7" ry="16" />
                {/* Уши */}
                <path d="M27 30 24 13l8 13Z" />
                <path d="M37 30 40 13l-8 13Z" />
                {/* Лапки */}
                <path
                    d="M29 56l-2 8M35 56l2 8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="none"
                />
                {/* Красные глаза */}
                <ellipse className="halloween-decor__bat-eye" cx="29" cy="34" rx="1.5" ry="2" />
                <ellipse className="halloween-decor__bat-eye" cx="35" cy="34" rx="1.5" ry="2" />
            </g>
        </svg>
    );
};

/** Свернувшаяся мышь: крылья обнимают тело, видны только уши, лапки и глаза. */
const BatFoldedSvg = () => {
    return (
        <svg
            className="halloween-decor__bat-svg halloween-decor__bat-svg--folded"
            viewBox="0 0 64 80"
            fill="currentColor"
        >
            <g className="halloween-decor__bat-folded-body">
                {/* Сложенные крылья — тонкие складки вдоль тела */}
                <path d="M28 24c-5 4-7 14-6 24 1 6 3 10 6 9-3-10-3-23 0-33Z" />
                <path d="M36 24c5 4 7 14 6 24-1 6-3 10-6 9 3-10 3-23 0-33Z" />
                {/* Узкое вытянутое тело */}
                <path d="M32 18c-5 0-7 7-7 15 0 9 2 20 4 30 1 4 2 6 3 6s2-2 3-6c2-10 4-21 4-30 0-8-2-15-7-15Z" />
                {/* Уши */}
                <path d="M28 20 27 8l5 9Z" />
                <path d="M36 20 37 8l-5 9Z" />
                {/* Лапки, за которые мышь держится за паутинку */}
                <path
                    d="M30 69l-1 8M34 69l1 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                />
                {/* Красные глаза */}
                <ellipse className="halloween-decor__bat-eye" cx="29.5" cy="32" rx="1.5" ry="2.1" />
                <ellipse className="halloween-decor__bat-eye" cx="34.5" cy="32" rx="1.5" ry="2.1" />
            </g>
        </svg>
    );
};

/** При системном «уменьшить движение» мыши не качаются, но остаются кликабельными. */
export const Bats = ({ staticMode = false }: { staticMode?: boolean }) => {
    const [statuses, setStatuses] = useState<Record<number, "fleeing" | "gone">>({});
    const [escapes, setEscapes] = useState<Record<number, Escape>>({});
    const fledRef = useRef<Set<number>>(new Set());
    const timersRef = useRef<number[]>([]);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    const makeEscape = (bat: Bat): Escape => {
        const awayFromCenter = parseFloat(bat.left) < 50 ? -1 : 1;
        const x = awayFromCenter * (22 + Math.random() * 42);
        const y = -(34 + Math.random() * 34);
        const rotate = awayFromCenter * (80 + Math.random() * 140);
        return {
            x: `${x}vw`,
            y: `${y}vh`,
            rotate: `${rotate}deg`,
            midX: `${x * 0.35}vw`,
            midY: `${y * 0.42}vh`,
            midRotate: `${rotate * 0.3}deg`,
        };
    };

    /** Вспугивает одну мышь; повторный клик по уже улетевшей игнорируется. */
    const flee = (index: number) => {
        if (fledRef.current.has(index)) {
            return;
        }
        fledRef.current.add(index);

        const escape = makeEscape(BATS[index]);
        setEscapes((prev) => ({ ...prev, [index]: escape }));
        setStatuses((prev) => ({ ...prev, [index]: "fleeing" }));

        timersRef.current.push(
            window.setTimeout(() => {
                setStatuses((prev) => ({ ...prev, [index]: "gone" }));
            }, ESCAPE_ANIMATION_MS),
            window.setTimeout(
                () => {
                    setStatuses((prev) => {
                        const next = { ...prev };
                        delete next[index];
                        return next;
                    });
                    setEscapes((prev) => {
                        const next = { ...prev };
                        delete next[index];
                        return next;
                    });
                    fledRef.current.delete(index);
                },
                ESCAPE_ANIMATION_MS + RETURN_DELAY_MS + Math.random() * 2500,
            ),
        );
    };

    const scatterAll = () => {
        BATS.forEach((_, index) => flee(index));
    };

    const scatterAllRef = useRef(scatterAll);

    useEffect(() => {
        scatterAllRef.current = scatterAll;
    });

    useEffect(() => {
        const handleEasterEgg = () => scatterAllRef.current();
        window.addEventListener(HALLOWEEN_EASTER_EGG_EVENT, handleEasterEgg);
        return () => window.removeEventListener(HALLOWEEN_EASTER_EGG_EVENT, handleEasterEgg);
    }, []);

    return (
        <>
            <span
                className="halloween-decor__cave"
                onClick={scatterAll}
                title="Пещера летучих мышей — вспугнуть всех"
            />
            {BATS.map((bat, index) => {
                const escape = escapes[index];
                const status = statuses[index];
                return (
                    <span
                        key={index}
                        className={[
                            "halloween-decor__bat",
                            staticMode ? "halloween-decor__bat--static" : "",
                            status === "fleeing" ? "halloween-decor__bat--fleeing" : "",
                            status === "gone" ? "halloween-decor__bat--gone" : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        style={
                            {
                                left: bat.left,
                                width: bat.size,
                                "--bat-delay": bat.delay,
                                "--fly-x": escape?.x ?? "0vw",
                                "--fly-y": escape?.y ?? "0vh",
                                "--fly-rotate": escape?.rotate ?? "0deg",
                                "--fly-x-mid": escape?.midX ?? "0vw",
                                "--fly-y-mid": escape?.midY ?? "0vh",
                                "--fly-rotate-mid": escape?.midRotate ?? "0deg",
                            } as CSSProperties
                        }
                        onClick={() => flee(index)}
                        title="Летучая мышь — вспугнуть"
                    >
                        <BatFoldedSvg />
                        <BatOpenSvg />
                    </span>
                );
            })}
        </>
    );
};
