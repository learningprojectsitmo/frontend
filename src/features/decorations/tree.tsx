import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/** Сколько поздравление висит над ёлкой. */
const GREETING_TIMEOUT_MS = 4500;

const BULB_COLORS = ["#e5484d", "#f5c542", "#4a9eff", "#d6409f"] as const;

/**
 * Точки гирлянды: вершины зигзага, по которым идёт шнур. Координаты подобраны
 * под ярусы из viewBox ниже — лампочки висят на ветках, а не на кромке и не в
 * воздухе (проверено по отрисовке).
 */
const BULBS = [
    { x: 46, y: 54 },
    { x: 70, y: 60 },
    { x: 40, y: 86 },
    { x: 60, y: 90 },
    { x: 82, y: 93 },
    { x: 28, y: 130 },
    { x: 60, y: 133 },
    { x: 94, y: 136 },
] as const;

const CORD = "M46 54 70 60 40 86 60 90 82 93 28 130 60 133 94 136";

const ORNAMENTS = [
    { x: 56, y: 44, r: 3, color: "#e5484d" },
    { x: 64, y: 50, r: 2.6, color: "#f5c542" },
    { x: 50, y: 76, r: 3, color: "#4a9eff" },
    { x: 70, y: 84, r: 3.2, color: "#e5484d" },
    { x: 40, y: 118, r: 3.2, color: "#f5c542" },
    { x: 60, y: 112, r: 3, color: "#d6409f" },
    { x: 80, y: 122, r: 3.2, color: "#4a9eff" },
    { x: 50, y: 132, r: 2.8, color: "#e5484d" },
] as const;

/**
 * Разлёт снежной волны по клику. Позиции считаются формулой, а не случайно:
 * иначе частицы прыгали бы при каждом ре-рендере, а тест не мог бы проверить
 * разметку стабильно.
 */
const PARTICLES = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * (index + 0.5)) / 10;

    return {
        dx: Math.round(Math.cos(angle) * 46),
        dy: -Math.round(Math.sin(angle) * 34),
        delay: index * 18,
    };
});

/**
 * Фразы из ресурсов i18n. `returnObjects` — единственный способ получить
 * массив из i18next; при отсутствии перевода он вернёт строку с ключом,
 * поэтому результат проверяется и просто не показывается.
 */
const getGreetings = (t: TFunction): string[] => {
    const value = t("decorations.newYear.greetings", { returnObjects: true });

    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
};

type TreeProps = {
    /** Системная настройка «уменьшить движение»: без покачивания и вспышек. */
    staticMode?: boolean;
    /** Баннер cookie накрыл бы ёлку — на это время не рисуем её вовсе. */
    hidden?: boolean;
};

/**
 * Новогодняя ёлочка в углу экрана.
 *
 * Клик/тап включает гирлянду, выбрасывает снежную волну и показывает
 * поздравление над ёлкой; повторный клик листает фразы по кругу. Сама ёлка —
 * настоящая кнопка: без этого пасхалка была бы недоступна с клавиатуры, а
 * контейнер декора целиком помечен `aria-hidden` (см. holiday-decor.tsx).
 */
export const Tree = ({ staticMode = false, hidden = false }: TreeProps) => {
    const { t } = useTranslation();
    const [greeting, setGreeting] = useState<string | null>(null);
    const [clickCount, setClickCount] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cursorRef = useRef(0);

    const clearTimer = useCallback(() => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => clearTimer, [clearTimer]);

    const handleClick = () => {
        // Вспышка гирлянды и волна — всегда, даже если перевода фраз нет.
        setClickCount((count) => count + 1);

        const greetings = getGreetings(t);
        if (greetings.length === 0) {
            return;
        }

        // Курсор в ref, а не в state: фразы должны листаться и после того,
        // как подсказка погасла по таймеру, — иначе каждый клик начинал бы
        // с первой.
        const next = greetings[cursorRef.current % greetings.length];
        cursorRef.current = (cursorRef.current + 1) % greetings.length;

        setGreeting(next);
        clearTimer();
        timeoutRef.current = setTimeout(() => setGreeting(null), GREETING_TIMEOUT_MS);
    };

    if (hidden) {
        return null;
    }

    return (
        <div
            className={cn(
                "holiday-decor__tree-slot",
                staticMode && "holiday-decor__tree-slot--static",
            )}
        >
            <button
                type="button"
                className="holiday-decor__tree"
                aria-label={t("decorations.newYear.treeLabel")}
                onClick={handleClick}
            >
                <svg
                    className="holiday-decor__tree-svg"
                    viewBox="0 0 120 164"
                    aria-hidden="true"
                    focusable="false"
                >
                    <defs>
                        <linearGradient id="holiday-tree-green" x1="0" y1="0" x2="0" y2="1">
                            <stop className="holiday-decor__tree-stop-top" offset="0%" />
                            <stop className="holiday-decor__tree-stop-bottom" offset="100%" />
                        </linearGradient>
                        <clipPath id="holiday-tree-tier-top">
                            <path d="M60 12 80 58 40 58Z" />
                        </clipPath>
                        <clipPath id="holiday-tree-tier-mid">
                            <path d="M60 34 92 96 28 96Z" />
                        </clipPath>
                        <clipPath id="holiday-tree-tier-low">
                            <path d="M60 66 104 140 16 140Z" />
                        </clipPath>
                    </defs>

                    <ellipse
                        className="holiday-decor__tree-drift"
                        cx="60"
                        cy="155"
                        rx="50"
                        ry="8"
                    />
                    <rect
                        className="holiday-decor__tree-trunk"
                        x="54"
                        y="132"
                        width="12"
                        height="24"
                        rx="4"
                    />

                    <path
                        className="holiday-decor__tree-tier"
                        fill="url(#holiday-tree-green)"
                        d="M60 12 80 58 40 58Z"
                    />
                    <path
                        className="holiday-decor__tree-tier"
                        fill="url(#holiday-tree-green)"
                        d="M60 34 92 96 28 96Z"
                    />
                    <path
                        className="holiday-decor__tree-tier"
                        fill="url(#holiday-tree-green)"
                        d="M60 66 104 140 16 140Z"
                    />

                    {/* Снег на кромках ярусов: волнистая полоса, обрезанная по ярусу. */}
                    <g clipPath="url(#holiday-tree-tier-top)">
                        <path
                            className="holiday-decor__tree-snow"
                            d="M26 48q12 9 24 3t24 0t24 0t24 0L140 72 0 72Z"
                        />
                    </g>
                    <g clipPath="url(#holiday-tree-tier-mid)">
                        <path
                            className="holiday-decor__tree-snow"
                            d="M16 84q14 9 28 3t28 0t28 0t28 0L150 108 0 108Z"
                        />
                    </g>
                    <g clipPath="url(#holiday-tree-tier-low)">
                        <path
                            className="holiday-decor__tree-snow"
                            d="M4 126q15 10 30 3t30 0t30 0t30 0L150 154 0 154Z"
                        />
                    </g>

                    <path className="holiday-decor__tree-cord" d={CORD} fill="none" />

                    {/* `key` перезапускает вспышку при каждом клике: без него
                        CSS-анимация осталась бы уже проигранной. */}
                    <g
                        key={clickCount}
                        className={cn(
                            "holiday-decor__tree-bulbs",
                            clickCount > 0 && "holiday-decor__tree-bulbs--flash",
                        )}
                    >
                        {BULBS.map((bulb, index) => (
                            <circle
                                key={index}
                                className="holiday-decor__tree-bulb"
                                cx={bulb.x}
                                cy={bulb.y}
                                r={2.4}
                                fill="currentColor"
                                style={
                                    {
                                        color: BULB_COLORS[index % BULB_COLORS.length],
                                        "--holiday-delay": `${(index * 0.17).toFixed(2)}s`,
                                    } as CSSProperties
                                }
                            />
                        ))}
                    </g>

                    {ORNAMENTS.map((ornament, index) => (
                        <circle
                            key={index}
                            className="holiday-decor__tree-ornament"
                            cx={ornament.x}
                            cy={ornament.y}
                            r={ornament.r}
                            fill="currentColor"
                            style={{ color: ornament.color }}
                        />
                    ))}

                    <path
                        className="holiday-decor__tree-star"
                        d="M60 1.5 62.7 7 68.7 7.9 64.3 12.1 65.4 18 60 15.1 54.6 18 55.7 12.1 51.3 7.9 57.3 7Z"
                    />
                </svg>

                {!staticMode && clickCount > 0 ? (
                    <span
                        key={clickCount}
                        className="holiday-decor__tree-particles"
                        aria-hidden="true"
                    >
                        {PARTICLES.map((particle, index) => (
                            <i
                                key={index}
                                className="holiday-decor__tree-particle"
                                style={
                                    {
                                        "--holiday-dx": `${particle.dx}px`,
                                        "--holiday-dy": `${particle.dy}px`,
                                        "--holiday-delay": `${particle.delay}ms`,
                                    } as CSSProperties
                                }
                            />
                        ))}
                    </span>
                ) : null}
            </button>

            {greeting ? (
                <p className="holiday-decor__tree-greeting" role="status">
                    {greeting}
                </p>
            ) : null}
        </div>
    );
};
