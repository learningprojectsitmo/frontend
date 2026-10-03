import { usePublicAppSettings } from "@/lib/app-settings";

import { Garland } from "./garland";
import { Ornaments } from "./ornaments";
import { Snow } from "./snow";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

import "./decor.css";

/**
 * Новогодняя декорация поверх всего приложения. Включается глобальным флагом
 * `new_year_decorations_enabled` из админ-панели; по умолчанию выключено.
 *
 * Декор общий для всех страниц (лендинг, авторизация, /app, публичная вики),
 * поэтому его нужно монтировать в провайдере — единственном месте, которое
 * обёрнуто всеми маршрутами.
 */
export const HolidayDecor = () => {
    const { data } = usePublicAppSettings();
    const prefersReducedMotion = usePrefersReducedMotion();

    // Пока флаг не приехал — не рисуем ничего: иначе декор моргал бы на
    // каждой загрузке страницы в течение первых ~100 мс.
    if (!data?.new_year_decorations_enabled) {
        return null;
    }

    return (
        <div className="holiday-decor" aria-hidden="true">
            <Snow staticMode={prefersReducedMotion} />
            <Garland />
            <Ornaments />
        </div>
    );
};
