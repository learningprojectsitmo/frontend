/**
 * Паутина в нижних углах экрана. Углы выбраны специально: сверху живут хедер,
 * кнопки и меню пользователя, а внизу декор не перекрывает интерактивные
 * элементы. На мобильных паутина поднята над нижней навигацией (см. CSS).
 *
 * Один и тот же SVG поворачивается под нужный угол. Паутинка состоит из
 * радиальных нитей и провисающих дуг — так она выглядит живее, чем набор
 * идеальных окружностей. В центре сидит паучок, который слегка покачивается.
 */
const Cobweb = ({ rotate }: { rotate: number }) => {
    return (
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            <g transform={`rotate(${rotate} 60 60)`}>
                {/* Радиальные нити: каждые 15° */}
                <path d="M0 0h120" />
                <path d="M0 0l115.9 31.1" />
                <path d="M0 0l103.9 60" />
                <path d="M0 0l84.9 84.9" />
                <path d="M0 0l60 103.9" />
                <path d="M0 0l31.1 115.9" />
                <path d="M0 0v120" />

                {/* Дуги, провисающие между нитями */}
                <path d="M30 0A30 30 0 0 1 28.98 7.76A30 30 0 0 1 25.98 15A30 30 0 0 1 21.21 21.21A30 30 0 0 1 15 25.98A30 30 0 0 1 7.76 28.98A30 30 0 0 1 0 30" />
                <path d="M55 0A55 55 0 0 1 53.13 14.24A55 55 0 0 1 47.63 27.5A55 55 0 0 1 38.89 38.89A55 55 0 0 1 27.5 47.63A55 55 0 0 1 14.24 53.13A55 55 0 0 1 0 55" />
                <path d="M80 0A80 80 0 0 1 77.27 20.71A80 80 0 0 1 69.28 40A80 80 0 0 1 56.57 56.57A80 80 0 0 1 40 69.28A80 80 0 0 1 20.71 77.27A80 80 0 0 1 0 80" />
                <path d="M105 0A105 105 0 0 1 101.42 27.18A105 105 0 0 1 90.93 52.5A105 105 0 0 1 74.25 74.25A105 105 0 0 1 52.5 90.93A105 105 0 0 1 27.18 101.42A105 105 0 0 1 0 105" />

                {/* Паучок на паутине */}
                <g transform="translate(50 50)">
                    <g className="halloween-decor__cobweb-spider">
                        <path
                            d="M-4 0-9-3M-4 3-9 6M4 0 9-3M4 3 9 6"
                            stroke="var(--halloween-spider, #2b2340)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                        />
                        <ellipse
                            cx="0"
                            cy="2"
                            rx="4.2"
                            ry="5.2"
                            fill="var(--halloween-spider, #2b2340)"
                            stroke="none"
                        />
                        <circle
                            cx="0"
                            cy="-4"
                            r="2.6"
                            fill="var(--halloween-spider, #2b2340)"
                            stroke="none"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
};

const CORNERS = [
    { modifier: "bl", rotate: -90 },
    { modifier: "br", rotate: 180 },
] as const;

export const Cobwebs = () => {
    return (
        <>
            {CORNERS.map((corner) => (
                <span
                    key={corner.modifier}
                    className={`halloween-decor__cobweb halloween-decor__cobweb--${corner.modifier}`}
                >
                    <Cobweb rotate={corner.rotate} />
                </span>
            ))}
        </>
    );
};
