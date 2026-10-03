import { useEffect, useRef } from "react";

type Flake = {
    x: number;
    y: number;
    radius: number;
    fallSpeed: number;
    driftSpeed: number;
    driftPhase: number;
    opacity: number;
};

/** Плотность снега: одна снежинка примерно на 12 000 CSS-пикселей площади. */
const PIXELS_PER_FLAKE = 12000;
const MIN_FLAKES = 30;
const MAX_FLAKES = 140;
/** Высота экрана, ниже которой снег рисуется совсем мелким. */
const MIN_DIMENSION = 320;

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

const createFlake = (width: number, height: number, staticMode: boolean): Flake => ({
    x: randomBetween(0, width),
    // В статичном режиме снежинки распределены по всей высоте и не падают.
    y: randomBetween(0, height),
    radius: randomBetween(1, 2.6),
    fallSpeed: randomBetween(18, 62),
    driftSpeed: randomBetween(6, 20),
    driftPhase: randomBetween(0, Math.PI * 2),
    opacity: randomBetween(0.45, 0.95),
    ...(staticMode ? { fallSpeed: 0, driftSpeed: 0 } : {}),
});

/**
 * Падающий снег на canvas.
 *
 * Canvas, а не DOM-элементы: при 140 частицах это 140 слоёв композитинга на
 * каждом кадре, что заметно бьёт по прокрутке длинных страниц (список проектов,
 * вики, канбан).
 */
export const Snow = ({ staticMode = false }: { staticMode?: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext("2d");
        if (!context) {
            return;
        }

        let width = 0;
        let height = 0;
        let flakes: Flake[] = [];
        let frameId = 0;
        let lastTimestamp: number | null = null;

        const measure = () => {
            const parent = canvas.parentElement;
            const rect = parent?.getBoundingClientRect();
            width = Math.max(Math.round(rect?.width ?? window.innerWidth), MIN_DIMENSION);
            height = Math.max(Math.round(rect?.height ?? window.innerHeight), MIN_DIMENSION);

            // Снег должен быть той же физической толщины на Retina: растянем
            // backing store и верстаем в CSS-пикселях через setTransform.
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            const count = Math.min(
                MAX_FLAKES,
                Math.max(MIN_FLAKES, Math.round((width * height) / PIXELS_PER_FLAKE)),
            );
            flakes = Array.from({ length: count }, () => createFlake(width, height, staticMode));
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            context.fillStyle = "#ffffff";

            for (const flake of flakes) {
                context.globalAlpha = flake.opacity;
                context.beginPath();
                context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                context.fill();
            }
            context.globalAlpha = 1;
        };

        const step = (timestamp: number) => {
            // Первый кадр не имеет предыдущей отметки: пропускаем дельту,
            // иначе весь снег сдвинется на «всё время с загрузки».
            const delta = lastTimestamp === null ? 0 : (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            for (const flake of flakes) {
                flake.y += flake.fallSpeed * delta;
                flake.driftPhase += flake.driftSpeed * delta;
                flake.x += Math.sin(flake.driftPhase) * 10 * delta;

                if (flake.y - flake.radius > height) {
                    flake.y = -flake.radius;
                    flake.x = randomBetween(0, width);
                }
                if (flake.x < -flake.radius) {
                    flake.x = width + flake.radius;
                } else if (flake.x > width + flake.radius) {
                    flake.x = -flake.radius;
                }
            }

            draw();
            frameId = window.requestAnimationFrame(step);
        };

        measure();
        draw();

        if (staticMode) {
            const handleResize = () => {
                measure();
                draw();
            };
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }

        const handleVisibility = () => {
            // В фоновой вкладке браузер и так режет частоту кадров, но rAF
            // всё равно будит main thread на каждом кадре. Ставим цикл на паузу.
            if (document.hidden) {
                window.cancelAnimationFrame(frameId);
                frameId = 0;
                return;
            }
            if (frameId === 0) {
                lastTimestamp = null;
                frameId = window.requestAnimationFrame(step);
            }
        };

        frameId = window.requestAnimationFrame(step);
        window.addEventListener("resize", measure);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener("resize", measure);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [staticMode]);

    return <canvas ref={canvasRef} className="holiday-decor__snow" aria-hidden="true" />;
};
