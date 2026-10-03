import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Системная настройка ОС «уменьшить движение». Нужна декорации, чтобы не
 * гонять canvas-цикл и CSS-анимации у тех, кто их отключил.
 *
 * Подписка на change обязательна: переключить настройку можно прямо во время
 * сессии, а не только до загрузки страницы.
 */
export const usePrefersReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return false;
        }
        return window.matchMedia(QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }

        const mediaQuery = window.matchMedia(QUERY);
        const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

        setPrefersReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);

        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return prefersReducedMotion;
};
