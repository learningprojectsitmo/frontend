import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import {
    ANGRY_LEGENDS,
    EASTER_EGG_LEGEND,
    FED_UP_LEGENDS,
    HALLOWEEN_EASTER_EGG_EVENT,
    RARE_EASTER_EGG_LEGEND,
} from "./legends";

const BOO_TIMEOUT_MS = 1200;
const MESSAGE_TIMEOUT_MS = 4000;
const RARE_EASTER_EGG_CHANCE = 0.008;
const PROVOKE_THRESHOLD = 6;
const FED_UP_COOLDOWN_MS = 4000;
const INACTIVITY_RESET_MS = 4000;
const MAX_ANGRY_LEVEL = PROVOKE_THRESHOLD;
const HIDE_PEEK_INTERVAL_MS = 1500;
const SUMMON_CHANCE = 0.2;

type GhostMood = "calm" | "angry" | "happy" | "sad" | "secret";
type SummonKind = "dracula" | "priest";

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

type FleeOffset = {
    x: number;
    y: number;
};

type FedUpMode = "flee" | "hide";

const neutralFace = () => (
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

const happyFace = () => (
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
        <ellipse className="halloween-decor__ghost-blush" cx="22" cy="52" rx="4.5" ry="2.4" />
        <ellipse className="halloween-decor__ghost-blush" cx="58" cy="52" rx="4.5" ry="2.4" />
    </>
);

// Выглядывая из-за нижнего края, привидение улыбается и показывает язык.
const peekFace = () => (
    <>
        {happyFace()}
        <path className="halloween-decor__ghost-tongue" d="M36 60c0 4.2 1.8 7 4 7s4-2.8 4-7Z" />
    </>
);

// Уровень 2: улыбка сменяется злым оскалом, тело пока остаётся прежним.
const angryFace = () => (
    <>
        <path
            className="halloween-decor__ghost-brow"
            d="M23 36l10 4M57 36l-10 4"
            strokeWidth="2.4"
            strokeLinecap="round"
        />
        <ellipse className="halloween-decor__ghost-eye" cx="30" cy="42" rx="3.6" ry="5" />
        <ellipse className="halloween-decor__ghost-eye" cx="50" cy="42" rx="3.6" ry="5" />
        <path
            className="halloween-decor__ghost-mouth"
            d="M29 58c4 8 18 8 22 0"
            strokeWidth="2.6"
            strokeLinecap="round"
        />
        <path className="halloween-decor__ghost-fang" d="M35 61l2 5 2-5M41 61l2 5 2-5" />
        <ellipse className="halloween-decor__ghost-blush" cx="23" cy="51" rx="4" ry="2.2" />
        <ellipse className="halloween-decor__ghost-blush" cx="57" cy="51" rx="4" ry="2.2" />
    </>
);

const furiousFace = () => (
    <>
        <path
            className="halloween-decor__ghost-brow"
            d="M22 35l12 5M58 35l-12 5"
            strokeWidth="2.8"
            strokeLinecap="round"
        />
        <path className="halloween-decor__ghost-eye" d="M24 45l10-4-1 6Z" />
        <path className="halloween-decor__ghost-eye" d="M56 45l-10-4 1 6Z" />
        <path
            className="halloween-decor__ghost-mouth"
            d="M27 57c4 10 22 10 26 0"
            strokeWidth="2.6"
            strokeLinecap="round"
        />
        <path
            className="halloween-decor__ghost-fang"
            d="M33 61l2 6 2-6M39 63l2 5 2-5M45 61l2 6 2-6"
        />
        <ellipse className="halloween-decor__ghost-blush" cx="21" cy="52" rx="4.5" ry="2.4" />
        <ellipse className="halloween-decor__ghost-blush" cx="59" cy="52" rx="4.5" ry="2.4" />
    </>
);

const GhostFace = ({
    mood,
    angryLevel,
    peeking,
}: {
    mood: GhostMood;
    angryLevel?: number;
    peeking?: boolean;
}) => {
    if (peeking) {
        return peekFace();
    }

    if (mood === "angry") {
        const level = angryLevel ?? 1;
        if (level <= 1) {
            return neutralFace();
        }
        if (level >= 3) {
            return furiousFace();
        }
        return angryFace();
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
        return happyFace();
    }

    return neutralFace();
};

const GhostSvg = ({
    mood,
    angryLevel,
    peeking,
}: {
    mood: GhostMood;
    angryLevel?: number;
    peeking?: boolean;
}) => {
    return (
        <svg viewBox="0 0 80 96" fill="none">
            {/* Тело: мягкие «волны» снизу, чтобы привидение не выглядело мешком */}
            <path
                className="halloween-decor__ghost-body"
                d="M12 84V40C12 21.2 24.5 8 40 8s28 13.2 28 32v44l-7-7-6 7-6-7-6 7-6-7-6 7-7-7-5 7Z"
                strokeWidth="1.4"
            />
            <GhostFace mood={mood} angryLevel={angryLevel} peeking={peeking} />
        </svg>
    );
};

// Дракула в стиле привидения: широкий плащ, высокий воротник, грозный оскал.
const DraculaSvg = () => (
    <svg viewBox="0 0 80 96" fill="none" aria-hidden="true">
        <path
            className="halloween-decor__dracula-cape"
            d="M8 96V58c0-18 14-30 32-30s32 12 32 30v38l-7-9-7 9-8-9-8 9-8-9-8 9-7-9-7 9Z"
        />
        <path className="halloween-decor__dracula-collar" d="M24 54c-3-16 1-28 10-34l4 14-8 22Z" />
        <path className="halloween-decor__dracula-collar" d="M56 54c3-16-1-28-10-34l-4 14 8 22Z" />
        <path className="halloween-decor__dracula-shirt" d="M34 54l6 9 6-9-1 14-5 5-5-5Z" />
        <circle className="halloween-decor__dracula-medal" cx="40" cy="66" r="2.2" />
        <path
            className="halloween-decor__dracula-face"
            d="M40 16c9 0 14 6 14 16 0 9-3 17-9 21-1.5 1.2-3 1.8-5 1.8s-3.5-.6-5-1.8c-6-4-9-12-9-21 0-10 5-16 14-16Z"
        />
        <path
            className="halloween-decor__dracula-hair"
            d="M26 34c-1-12 6-20 14-20s15 8 14 20l-4-7-4 9-6-10-6 10-4-9Z"
        />
        <path className="halloween-decor__dracula-eye" d="M30 39l9-2-1 5Z" />
        <path className="halloween-decor__dracula-eye" d="M50 39l-9-2 1 5Z" />
        <path
            className="halloween-decor__dracula-nose"
            d="M40 43v4"
            strokeWidth="1"
            strokeLinecap="round"
        />
        <path
            className="halloween-decor__dracula-mouth"
            d="M33 50c3 4 11 4 14 0"
            strokeWidth="1.8"
            strokeLinecap="round"
        />
        <path className="halloween-decor__dracula-fang" d="M36 50l1.5 5 1.5-5M41 50l1.5 5 1.5-5" />
    </svg>
);

// Священник-экзорцист в духе «Изгоняющего дьявола»: сутана, воротничок, крест.
// Тоже «призрачный» — появляется рядом с разъярённым привидением и поднимает крест.
const PriestSvg = () => (
    <svg viewBox="0 0 80 96" fill="none" aria-hidden="true">
        {/* Чёрная сутана */}
        <path
            className="halloween-decor__priest-robe"
            d="M16 94V54c0-15 10-24 24-24s24 9 24 24v40l-6-6-6 6-6-6-6 6-6-6-6 6-6-6Z"
        />
        {/* Белый воротничок */}
        <path className="halloween-decor__priest-collar" d="M33 40l7 10 7-10-7 3Z" />
        {/* Бледное лицо */}
        <ellipse className="halloween-decor__priest-face" cx="40" cy="30" rx="12.5" ry="14.5" />
        {/* Тёмные волосы */}
        <path
            className="halloween-decor__priest-hair"
            d="M27.5 27c1-9 7-14 12.5-14s11.5 5 12.5 14c-3-6-7-9-12.5-9s-9.5 3-12.5 9Z"
        />
        {/* Глаза (красные, как у призрака) */}
        <ellipse className="halloween-decor__priest-eye" cx="34.5" cy="30" rx="1.7" ry="2.3" />
        <ellipse className="halloween-decor__priest-eye" cx="45.5" cy="30" rx="1.7" ry="2.3" />
        {/* Строгий рот */}
        <path className="halloween-decor__priest-mouth" d="M34 39c3 1.4 9 1.4 12 0" />
        {/* Крест, поднятый в руке */}
        <path className="halloween-decor__priest-cross" d="M66 36v22M58 44h16" />
    </svg>
);

/**
 * Светящееся привидение внизу экрана. Клик злит его всё сильнее: после
 * нескольких тычков краснеют глаза, затем тело, затем меняется оскал. Когда
 * терпение кончается, привидение просит прекратить и начинает уворачиваться
 * от курсора. Через несколько секунд оно успокаивается. С очень маленьким
 * шансом выпадает редкая пасхалка, а если зажечь все тыквы — отдельный секрет.
 *
 * На пике ярости (6-й клик подряд) рядом с призраком является случайный
 * «призыватель»: либо Дракула, либо священник-экзорцист.
 */
export const Ghost = ({ staticMode = false }: { staticMode?: boolean }) => {
    const [spooked, setSpooked] = useState(false);
    const [message, setMessage] = useState<GhostMessage | null>(null);
    const [mood, setMood] = useState<GhostMood>("calm");
    const [angryLevel, setAngryLevel] = useState(0);
    const [isFedUp, setIsFedUp] = useState(false);
    const [fedUpMode, setFedUpMode] = useState<FedUpMode | null>(null);
    const [hidePeeking, setHidePeeking] = useState(false);
    const [hideOffsetX, setHideOffsetX] = useState(0);
    const [fleeOffset, setFleeOffset] = useState<FleeOffset>({ x: 0, y: 0 });
    const [angerRatio, setAngerRatio] = useState(0);
    const [summon, setSummon] = useState<SummonKind | null>(null);

    const isHiding = isFedUp && fedUpMode === "hide" && !staticMode;

    const spookTimeoutRef = useRef<number | null>(null);
    const messageTimeoutRef = useRef<number | null>(null);
    const fedUpTimeoutRef = useRef<number | null>(null);
    const resetTimeoutRef = useRef<number | null>(null);
    const lastLegendRef = useRef(-1);
    const moodRef = useRef<GhostMood>("calm");
    const provokeCountRef = useRef(0);
    const pointerInsideRef = useRef(false);
    const hidePeekingRef = useRef(false);
    const hideRelocateRef = useRef<number | null>(null);

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

    const pickLegend = useCallback((legends: readonly string[]) => {
        let index = Math.floor(Math.random() * legends.length);
        if (index === lastLegendRef.current && legends.length > 1) {
            index = (index + 1) % legends.length;
        }
        lastLegendRef.current = index;
        return legends[index] ?? "";
    }, []);

    const calmDown = useCallback(() => {
        provokeCountRef.current = 0;
        moodRef.current = "calm";
        setMood("calm");
        setAngryLevel(0);
        setIsFedUp(false);
        setFedUpMode(null);
        hidePeekingRef.current = false;
        setHidePeeking(false);
        setHideOffsetX(0);
        setSummon(null);
        if (hideRelocateRef.current !== null) {
            window.clearTimeout(hideRelocateRef.current);
            hideRelocateRef.current = null;
        }
        setFleeOffset({ x: 0, y: 0 });
        setAngerRatio(0);
        if (fedUpTimeoutRef.current !== null) {
            window.clearTimeout(fedUpTimeoutRef.current);
            fedUpTimeoutRef.current = null;
        }
        if (resetTimeoutRef.current !== null) {
            window.clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
    }, []);

    const moveAway = useCallback(() => {
        setFleeOffset({
            x: (Math.random() - 0.5) * 180,
            y: -Math.random() * 90,
        });
    }, []);

    const pickHideOffset = useCallback(() => {
        const limit = Math.max(80, window.innerWidth / 2 - 110);
        return (Math.random() * 2 - 1) * limit;
    }, []);

    const relocateHidden = useCallback(() => {
        if (hideRelocateRef.current !== null) {
            window.clearTimeout(hideRelocateRef.current);
        }
        // Меняем позицию, когда привидение уже полностью скрылось за краем.
        hideRelocateRef.current = window.setTimeout(() => {
            hideRelocateRef.current = null;
            setHideOffsetX(pickHideOffset());
        }, 600);
    }, [pickHideOffset]);

    // Ныряет за нижний край, а всплывает уже в другом месте.
    const duck = useCallback(() => {
        hidePeekingRef.current = false;
        setHidePeeking(false);
        relocateHidden();
    }, [relocateHidden]);

    const hideBehindEdge = useCallback(() => {
        hidePeekingRef.current = true;
        setHidePeeking(true);
        setHideOffsetX(pickHideOffset());
        setFleeOffset({ x: 0, y: 0 });
    }, [pickHideOffset]);

    const scheduleCalmDown = useCallback(
        (delay: number) => {
            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
            }
            resetTimeoutRef.current = window.setTimeout(calmDown, delay);
        },
        [calmDown],
    );

    // Пока курсор рядом и привидение прячется, в дефолт не сбрасываем:
    // таймер перезапустится, когда курсор уйдёт.
    const scheduleFedUpCalmDown = useCallback(() => {
        if (fedUpTimeoutRef.current !== null) {
            window.clearTimeout(fedUpTimeoutRef.current);
        }
        fedUpTimeoutRef.current = window.setTimeout(() => {
            fedUpTimeoutRef.current = null;
            if (!pointerInsideRef.current) {
                calmDown();
            }
        }, FED_UP_COOLDOWN_MS);
    }, [calmDown]);

    useEffect(() => {
        return () => {
            if (spookTimeoutRef.current !== null) {
                window.clearTimeout(spookTimeoutRef.current);
            }
            if (messageTimeoutRef.current !== null) {
                window.clearTimeout(messageTimeoutRef.current);
            }
            if (fedUpTimeoutRef.current !== null) {
                window.clearTimeout(fedUpTimeoutRef.current);
            }
            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
            }
        };
    }, []);

    // Пока привидение прячется за краем, оно периодически выглядывает и ныряет.
    useEffect(() => {
        if (!isHiding) {
            return;
        }
        hidePeekingRef.current = true;
        setHidePeeking(true);
        const id = window.setInterval(() => {
            if (hidePeekingRef.current) {
                duck();
            } else {
                hidePeekingRef.current = true;
                setHidePeeking(true);
            }
        }, HIDE_PEEK_INTERVAL_MS);
        return () => {
            window.clearInterval(id);
            if (hideRelocateRef.current !== null) {
                window.clearTimeout(hideRelocateRef.current);
                hideRelocateRef.current = null;
            }
        };
    }, [isHiding, duck]);

    useEffect(() => {
        const handleEasterEgg = (event: Event) => {
            const rare = (event as CustomEvent<EasterEggEventDetail>).detail?.rare === true;
            calmDown();
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
    }, [calmDown, showMessage]);

    const handleClick = () => {
        // Привидение уже устало: продолжаем уворачиваться, но не злим дальше.
        // Сброс откладываем, пока его трогают.
        if (isFedUp) {
            if (!staticMode) {
                if (fedUpMode === "hide") {
                    duck();
                } else {
                    moveAway();
                }
            }
            scheduleFedUpCalmDown();
            return;
        }

        // Редкая пасхалка: событие разбудит и стаю мышей, и само привидение.
        if (Math.random() < RARE_EASTER_EGG_CHANCE) {
            window.dispatchEvent(
                new CustomEvent(HALLOWEEN_EASTER_EGG_EVENT, { detail: { rare: true } }),
            );
            return;
        }

        provokeCountRef.current += 1;
        const provoked = provokeCountRef.current;

        if (provoked > PROVOKE_THRESHOLD) {
            const mode: FedUpMode = Math.random() < 0.5 ? "flee" : "hide";
            moodRef.current = "sad";
            setMood("sad");
            setAngryLevel(0);
            setAngerRatio(0);
            setSummon(null);
            setIsFedUp(true);
            setFedUpMode(mode);
            if (!staticMode) {
                if (mode === "hide") {
                    hideBehindEdge();
                } else {
                    moveAway();
                }
            }
            showMessage({ title: MOOD_TITLES.sad, text: pickLegend(FED_UP_LEGENDS) });

            if (resetTimeoutRef.current !== null) {
                window.clearTimeout(resetTimeoutRef.current);
                resetTimeoutRef.current = null;
            }
            scheduleFedUpCalmDown();
            return;
        }

        // Первые три клика подряд меняют облик, дальше злость растёт плавно:
        // свечение и размер привидения усиливаются с каждым тычком.
        const nextLevel = Math.min(MAX_ANGRY_LEVEL, provoked);
        moodRef.current = "angry";
        setMood("angry");
        setAngryLevel(nextLevel);
        setAngerRatio(Math.min(1, provoked / PROVOKE_THRESHOLD));

        // Пик ярости: очень редко рядом является «призыватель» — Дракула
        // или священник-экзорцист.
        if (nextLevel === MAX_ANGRY_LEVEL && Math.random() < SUMMON_CHANCE) {
            setSummon(Math.random() < 0.5 ? "dracula" : "priest");
        }

        showMessage({ title: MOOD_TITLES.angry, text: pickLegend(ANGRY_LEGENDS) });
        scheduleCalmDown(INACTIVITY_RESET_MS);
    };

    const angryClass =
        mood === "angry" && angryLevel >= 2
            ? `halloween-decor__ghost--angry-level-${angryLevel}`
            : "";
    const ghostStyle = {
        transform: isHiding
            ? hidePeeking
                ? `translate3d(calc(-50% + ${hideOffsetX}px), 0, 0)`
                : `translate3d(calc(-50% + ${hideOffsetX}px), calc(100% + 86px), 0)`
            : `translate3d(calc(-50% + ${fleeOffset.x}px), ${fleeOffset.y}px, 0)`,
        transition: "transform 0.45s ease",
        "--ghost-anger": angerRatio,
    } as CSSProperties;

    return (
        <span
            className={[
                "halloween-decor__ghost",
                staticMode ? "halloween-decor__ghost--static" : "",
                spooked ? "halloween-decor__ghost--spooked" : "",
                mood !== "calm" ? `halloween-decor__ghost--${mood}` : "",
                angryClass,
                isFedUp && !isHiding ? "halloween-decor__ghost--fleeing" : "",
                isHiding ? "halloween-decor__ghost--hiding" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={handleClick}
            title="Привидение"
            style={ghostStyle}
            onMouseEnter={() => {
                if (!isFedUp) {
                    return;
                }
                pointerInsideRef.current = true;
                if (fedUpTimeoutRef.current !== null) {
                    window.clearTimeout(fedUpTimeoutRef.current);
                    fedUpTimeoutRef.current = null;
                }
                if (staticMode) {
                    return;
                }
                if (fedUpMode === "hide") {
                    duck();
                } else {
                    moveAway();
                }
            }}
            onMouseLeave={() => {
                if (isFedUp) {
                    pointerInsideRef.current = false;
                    scheduleFedUpCalmDown();
                }
            }}
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
            <GhostSvg mood={mood} angryLevel={angryLevel} peeking={isHiding && hidePeeking} />
            {summon === "dracula" ? (
                <span className="halloween-decor__dracula">
                    <span className="halloween-decor__summon-boo">Кусь!</span>
                    <DraculaSvg />
                </span>
            ) : summon === "priest" ? (
                <span className="halloween-decor__priest">
                    <span className="halloween-decor__summon-boo">Не ну ты видел, видел?</span>
                    <PriestSvg />
                </span>
            ) : null}
        </span>
    );
};
