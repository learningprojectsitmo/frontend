import { useCallback, useEffect, useRef, useState } from "react";

import {
    EASTER_EGG_LEGEND,
    HALLOWEEN_EASTER_EGG_EVENT,
    RARE_EASTER_EGG_LEGEND,
    STUDENT_LEGENDS,
} from "./legends";

const BOO_TIMEOUT_MS = 1200;
const MESSAGE_TIMEOUT_MS = 15000;
const RARE_EASTER_EGG_CHANCE = 0.03;

type GhostMood = "calm" | "angry" | "happy" | "sad" | "secret";

const CLICK_MOODS: GhostMood[] = ["angry", "happy", "sad"];

const MOOD_TITLES: Record<GhostMood, string> = {
    calm: "Бу!",
    angry: "БУ!!!",
    happy: "Хи-хи!",
    sad: "У-у-у...",
    secret: "Пасхалка!",
};

type GhostMessage = {
    title: string;
    text: string;
    secret?: boolean;
};

type EasterEggEventDetail = {
    rare?: boolean;
};

const GhostFace = ({ mood }: { mood: GhostMood }) => {
    if (mood === "angry") {
        return (
            <>
                <path
                    className="halloween-decor__ghost-brow"
                    d="M23 36l10 4M57 36l-10 4"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <path className="halloween-decor__ghost-eye" d="M25 45l9-3-1 5Z" />
                <path className="halloween-decor__ghost-eye" d="M55 45l-9-3 1 5Z" />
                <path
                    className="halloween-decor__ghost-mouth"
                    d="M29 62c4-7 18-7 22 0"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <path className="halloween-decor__ghost-fang" d="M35 57l2 5 2-5M41 57l2 5 2-5" />
                <ellipse
                    className="halloween-decor__ghost-blush"
                    cx="22"
                    cy="52"
                    rx="4.5"
                    ry="2.4"
                />
                <ellipse
                    className="halloween-decor__ghost-blush"
                    cx="58"
                    cy="52"
                    rx="4.5"
                    ry="2.4"
                />
            </>
        );
    }

    if (mood === "sad") {
        return (
            <>
                <path
                    className="halloween-decor__ghost-brow"
                    d="M23 40l9-3M57 40l-9-3"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                />
                <ellipse className="halloween-decor__ghost-eye" cx="30" cy="44" rx="3.3" ry="4.7" />
                <ellipse className="halloween-decor__ghost-eye" cx="50" cy="44" rx="3.3" ry="4.7" />
                <path
                    className="halloween-decor__ghost-mouth"
                    d="M31 61c3-4 6-5 9-5s6 1 9 5"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <path className="halloween-decor__ghost-tear" d="M53 49c2 3 2 5 0 7-2-2-2-4 0-7Z" />
                <ellipse className="halloween-decor__ghost-blush" cx="23" cy="53" rx="4" ry="2.2" />
                <ellipse className="halloween-decor__ghost-blush" cx="57" cy="53" rx="4" ry="2.2" />
            </>
        );
    }

    if (mood === "secret") {
        return (
            <>
                {/* Звёздные глаза для редкой пасхалки */}
                <path
                    className="halloween-decor__ghost-eye"
                    d="M30 36l1.5 3.7 4 .4-3 2.5.9 3.9-3.4-2.1-3.4 2.1.9-3.9-3-2.5 4-.4Z"
                />
                <path
                    className="halloween-decor__ghost-eye"
                    d="M50 36l1.5 3.7 4 .4-3 2.5.9 3.9-3.4-2.1-3.4 2.1.9-3.9-3-2.5 4-.4Z"
                />
                <path
                    className="halloween-decor__ghost-mouth"
                    d="M29 55c4 8 18 8 22 0"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <ellipse className="halloween-decor__ghost-blush" cx="22" cy="52" rx="4" ry="2.2" />
                <ellipse className="halloween-decor__ghost-blush" cx="58" cy="52" rx="4" ry="2.2" />
            </>
        );
    }

    if (mood === "happy") {
        return (
            <>
                <path
                    className="halloween-decor__ghost-eye-arc"
                    d="M24 43c2.5-4 8.5-4 11 0M45 43c2.5-4 8.5-4 11 0"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                />
                <path
                    className="halloween-decor__ghost-mouth"
                    d="M29 55c4 8 18 8 22 0"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                />
                <ellipse
                    className="halloween-decor__ghost-blush"
                    cx="22"
                    cy="52"
                    rx="4.5"
                    ry="2.4"
                />
                <ellipse
                    className="halloween-decor__ghost-blush"
                    cx="58"
                    cy="52"
                    rx="4.5"
                    ry="2.4"
                />
            </>
        );
    }

    return (
        <>
            <ellipse className="halloween-decor__ghost-eye" cx="30" cy="42" rx="3.6" ry="5" />
            <ellipse className="halloween-decor__ghost-eye" cx="50" cy="42" rx="3.6" ry="5" />
            <path
                className="halloween-decor__ghost-mouth"
                d="M31 56c3.2 4.2 6.8 6 9 6s5.8-1.8 9-6"
                strokeWidth="2.4"
                strokeLinecap="round"
            />
            <ellipse className="halloween-decor__ghost-blush" cx="23" cy="51" rx="4" ry="2.2" />
            <ellipse className="halloween-decor__ghost-blush" cx="57" cy="51" rx="4" ry="2.2" />
        </>
    );
};

const GhostSvg = ({ mood }: { mood: GhostMood }) => {
    return (
        <svg viewBox="0 0 80 96" fill="none">
            {/* Тело: мягкие «волны» снизу, чтобы привидение не выглядело мешком */}
            <path
                className="halloween-decor__ghost-body"
                d="M12 84V40C12 21.2 24.5 8 40 8s28 13.2 28 32v44l-7-7-6 7-6-7-6 7-6-7-6 7-7-7-5 7Z"
                strokeWidth="1.4"
            />
            <GhostFace mood={mood} />
        </svg>
    );
};

/**
 * Светящееся привидение внизу экрана. Клик меняет эмоцию и цвет: злость,
 * радость или грусть. С очень маленьким шансом выпадает редкая пасхалка.
 * Если зажечь все тыквы, срабатывает отдельный секрет. Живёт у нижней кромки
 * и гуляет влево-вправо.
 */
export const Ghost = ({ staticMode = false }: { staticMode?: boolean }) => {
    const [spooked, setSpooked] = useState(false);
    const [message, setMessage] = useState<GhostMessage | null>(null);
    const [mood, setMood] = useState<GhostMood>("calm");
    const spookTimeoutRef = useRef<number | null>(null);
    const messageTimeoutRef = useRef<number | null>(null);
    const lastLegendRef = useRef(-1);
    const moodRef = useRef<GhostMood>("calm");

    const showMessage = useCallback((next: GhostMessage) => {
        setSpooked(false);
        if (spookTimeoutRef.current !== null) {
            window.clearTimeout(spookTimeoutRef.current);
        }
        // Перезапуск анимации: снимаем и возвращаем класс в следующем кадре.
        window.requestAnimationFrame(() => setSpooked(true));
        spookTimeoutRef.current = window.setTimeout(() => setSpooked(false), BOO_TIMEOUT_MS);

        setMessage(next);
        if (messageTimeoutRef.current !== null) {
            window.clearTimeout(messageTimeoutRef.current);
        }
        messageTimeoutRef.current = window.setTimeout(() => setMessage(null), MESSAGE_TIMEOUT_MS);
    }, []);

    useEffect(() => {
        return () => {
            if (spookTimeoutRef.current !== null) {
                window.clearTimeout(spookTimeoutRef.current);
            }
            if (messageTimeoutRef.current !== null) {
                window.clearTimeout(messageTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleEasterEgg = (event: Event) => {
            const rare = (event as CustomEvent<EasterEggEventDetail>).detail?.rare === true;
            moodRef.current = "secret";
            setMood("secret");
            showMessage({
                title: MOOD_TITLES.secret,
                text: rare ? RARE_EASTER_EGG_LEGEND : EASTER_EGG_LEGEND,
                secret: true,
            });
        };
        window.addEventListener(HALLOWEEN_EASTER_EGG_EVENT, handleEasterEgg);
        return () => window.removeEventListener(HALLOWEEN_EASTER_EGG_EVENT, handleEasterEgg);
    }, [showMessage]);

    const handleClick = () => {
        // Редкая пасхалка: событие разбудит и стаю мышей, и само привидение.
        if (Math.random() < RARE_EASTER_EGG_CHANCE) {
            window.dispatchEvent(
                new CustomEvent(HALLOWEEN_EASTER_EGG_EVENT, { detail: { rare: true } }),
            );
            return;
        }

        const nextMoods = CLICK_MOODS.filter((candidate) => candidate !== moodRef.current);
        const nextMood = nextMoods[Math.floor(Math.random() * nextMoods.length)];
        moodRef.current = nextMood;
        setMood(nextMood);

        let index = Math.floor(Math.random() * STUDENT_LEGENDS.length);
        if (index === lastLegendRef.current && STUDENT_LEGENDS.length > 1) {
            index = (index + 1) % STUDENT_LEGENDS.length;
        }
        lastLegendRef.current = index;
        showMessage({ title: MOOD_TITLES[nextMood], text: STUDENT_LEGENDS[index] });
    };

    return (
        <span
            className={[
                "halloween-decor__ghost",
                staticMode ? "halloween-decor__ghost--static" : "",
                spooked ? "halloween-decor__ghost--spooked" : "",
                mood !== "calm" ? `halloween-decor__ghost--${mood}` : "",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={handleClick}
            title="Привидение"
        >
            {message ? (
                <span
                    className={[
                        "halloween-decor__ghost-boo",
                        message.secret
                            ? "halloween-decor__ghost-boo--secret"
                            : mood !== "calm"
                              ? `halloween-decor__ghost-boo--${mood}`
                              : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    <span className="halloween-decor__ghost-boo-title">{message.title}</span>
                    <span className="halloween-decor__ghost-boo-text">{message.text}</span>
                </span>
            ) : null}
            <GhostSvg mood={mood} />
        </span>
    );
};
