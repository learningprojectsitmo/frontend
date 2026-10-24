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
    { left: "10%", size: "32px", delay: "0s" },
    { left: "28%", size: "26px", delay: "-1.2s" },
    { left: "46%", size: "35px", delay: "-2.6s" },
    { left: "65%", size: "27px", delay: "-0.7s" },
    { left: "82%", size: "30px", delay: "-3.1s" },
];

const ESCAPE_ANIMATION_MS = 2600;
const RETURN_DELAY_MS = 8000;

const BatOpenSvg = () => {
    return (
        <svg
            className="halloween-decor__bat-svg halloween-decor__bat-svg--open"
            viewBox="0 0 40 24"
            fill="none"
        >
            <g className="halloween-decor__bat-wing-group">
                <path
                    className="halloween-decor__bat-body"
                    d="M 20 4 C 18 4 16 7 15 9 C 10 6 4 7 1 10 C 3 13 4 16 4 19 C 7 17 10 17 13 19 C 15 16 17 14 20 14 C 23 14 25 16 27 19 C 30 17 33 17 36 19 C 36 16 37 13 39 10 C 36 7 30 6 25 9 C 24 7 22 4 20 4 Z"
                    fill="currentColor"
                />
                <path d="M 17 6 L 14 0 L 20 5 Z" fill="currentColor" />
                <path d="M 23 6 L 26 0 L 20 5 Z" fill="currentColor" />
                <circle className="halloween-decor__bat-eye" cx="18" cy="8" r="1" />
                <circle className="halloween-decor__bat-eye" cx="22" cy="8" r="1" />
            </g>
        </svg>
    );
};

/** Свернувшаяся мышь: висит вниз головой, уши и глаза смотрят вниз. */
const BatFoldedSvg = () => {
    return (
        <svg
            className="halloween-decor__bat-svg halloween-decor__bat-svg--folded"
            viewBox="0 0 40 40"
            fill="none"
        >
            <path
                d="M 19 7 L 19 1 M 21 7 L 21 1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <path
                className="halloween-decor__bat-folded-body"
                d="M 20 6 C 12 6 9 16 12 26 C 14 32 18 34 20 36 C 22 34 26 32 28 26 C 31 16 28 6 20 6 Z"
                fill="currentColor"
            />
            <path d="M 14 26 L 11 36 L 18 32 Z" fill="currentColor" />
            <path d="M 26 26 L 29 36 L 22 32 Z" fill="currentColor" />
            <circle className="halloween-decor__bat-eye" cx="16" cy="24" r="1.5" />
            <circle className="halloween-decor__bat-eye" cx="24" cy="24" r="1.5" />
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
