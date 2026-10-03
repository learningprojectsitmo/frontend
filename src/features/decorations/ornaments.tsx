import type { CSSProperties } from "react";

type Ornament = {
    x: string;
    y: string;
    size: string;
    delay: string;
    background: string;
};

/**
 * Позиции подобраны у краёв экрана и в верхней зоне: шары не перекрывают
 * контент и не цепляют элементы, по которым кликают. Внедрять их в карточки
 * и панели не будем — это означало бы правки в десятках компонентов и риск
 * сдвига лэйаута.
 */
const ORNAMENTS: Ornament[] = [
    { x: "2%", y: "18%", size: "14px", delay: "0s", background: "#e5484d" },
    { x: "7%", y: "62%", size: "10px", delay: "-1.4s", background: "#3fb950" },
    { x: "95%", y: "26%", size: "16px", delay: "-2.6s", background: "#f5c542" },
    { x: "90%", y: "72%", size: "11px", delay: "-0.7s", background: "#4a9eff" },
    { x: "34%", y: "6%", size: "12px", delay: "-3.2s", background: "#d6409f" },
    { x: "70%", y: "5%", size: "9px", delay: "-1.9s", background: "#ff8a3d" },
];

export const Ornaments = () => {
    return (
        <>
            {ORNAMENTS.map((ornament, index) => (
                <span
                    key={index}
                    className="holiday-decor__ornament"
                    style={
                        {
                            background: `radial-gradient(circle at 30% 28%, rgb(255 255 255 / 85%), ${ornament.background} 62%)`,
                            boxShadow: `0 2px 8px rgb(0 0 0 / 12%)`,
                            "--holiday-x": ornament.x,
                            "--holiday-y": ornament.y,
                            "--holiday-size": ornament.size,
                            "--holiday-delay": ornament.delay,
                        } as CSSProperties
                    }
                />
            ))}
        </>
    );
};
