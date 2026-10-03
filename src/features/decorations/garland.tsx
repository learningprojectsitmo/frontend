import type { CSSProperties } from "react";

const BULB_COUNT = 26;
const TWINKLE_STEP_S = 0.09;

const BULB_COLORS = ["#e5484d", "#3fb950", "#f5c542", "#4a9eff", "#d6409f", "#ff8a3d"] as const;

/** Гирлянда с мигающими лампочками по верхнему краю экрана. */
export const Garland = () => {
    return (
        <div className="holiday-decor__garland" aria-hidden="true">
            <div className="holiday-decor__garland-cord" />
            {Array.from({ length: BULB_COUNT }, (_, index) => {
                const color = BULB_COLORS[index % BULB_COLORS.length];

                return (
                    <span
                        key={index}
                        className="holiday-decor__garland-bulb"
                        style={
                            {
                                background: color,
                                boxShadow: `0 0 6px 1px ${color}`,
                                // Каскад по индексу — соседние лампочки гаснут
                                // вразнобой, а не синхронно.
                                "--holiday-delay": `${(index * TWINKLE_STEP_S).toFixed(2)}s`,
                            } as CSSProperties
                        }
                    />
                );
            })}
        </div>
    );
};
