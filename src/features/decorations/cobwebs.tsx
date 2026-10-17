/**
 * Паутина в верхних углах экрана — статичный «каркас» хэллоуинского декора,
 * по роли как гирлянда у новогоднего: задаёт рамку и не двигается.
 *
 * Обе паутины — один и тот же SVG: правый угол получается зеркалированием
 * через `transform: scaleX(-1)` в CSS, отдельный путь рисовать не нужно.
 */
const Cobweb = () => {
    return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.4">
            {/* Лучи из угла (origin 0,0): 0°, 22.5°, 45°, 67.5°, 90° */}
            <path d="M0 0 H120" />
            <path d="M0 0 L111 46" />
            <path d="M0 0 L85 85" />
            <path d="M0 0 L46 111" />
            <path d="M0 0 V120" />

            {/* Концентрические дуги между лучами */}
            <path d="M30 0 A30 30 0 0 1 0 30" />
            <path d="M55 0 A55 55 0 0 1 0 55" />
            <path d="M80 0 A80 80 0 0 1 0 80" />
            <path d="M105 0 A105 105 0 0 1 0 105" />
        </svg>
    );
};

export const Cobwebs = () => {
    return (
        <>
            <span className="halloween-decor__cobweb halloween-decor__cobweb--tl">
                <Cobweb />
            </span>
            <span className="halloween-decor__cobweb halloween-decor__cobweb--tr">
                <Cobweb />
            </span>
        </>
    );
};
