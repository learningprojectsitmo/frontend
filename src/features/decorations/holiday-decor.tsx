import { usePublicAppSettings } from "@/lib/app-settings";

import { useCookieConsent } from "@/features/privacy/cookie-consent-provider";

import { Garland } from "./garland";
import { Ornaments } from "./ornaments";
import { Snow } from "./snow";
import { Tree } from "./tree";
import { useDecorationsAllowed } from "./use-decorations-allowed";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

import "./decor.css";

/**
 * Новогодняя декорация поверх всего приложения. Включается глобальным флагом
 * `new_year_decorations_enabled` из админ-панели; по умолчанию выключено.
 *
 * Пользователь может отключить её у себя на странице настроек
 * (`show_decorations`): декор не показывается, если админ выключил его глобально
 * или пользователь снял галочку.
 *
 * Декор общий для всех страниц (лендинг, авторизация, /app, публичная вики),
 * поэтому его нужно монтировать в провайдере — единственном месте, которое
 * обёрнуто всеми маршрутами.
 */
export const HolidayDecor = () => {
    const { data } = usePublicAppSettings();
    const { consent } = useCookieConsent();
    const prefersReducedMotion = usePrefersReducedMotion();

    const adminEnabled = data?.new_year_decorations_enabled === true;
    const allowed = useDecorationsAllowed(adminEnabled);

    // Пока флаг не приехал — не рисуем ничего: иначе декор моргал бы на
    // каждой загрузке страницы в течение первых ~100 мс.
    if (!adminEnabled || !allowed) {
        return null;
    }

    return (
        <>
            <div className="holiday-decor" aria-hidden="true">
                <Snow staticMode={prefersReducedMotion} />
                <Garland />
                <Ornaments />
            </div>
            {/*
             * Ёлка стоит вне `aria-hidden`-контейнера: это кнопка с подсказкой,
             * и внутри скрытого поддерева она была бы недоступна скринридерам.
             * Пока показан баннер cookie (z-index выше), ёлку не рисуем — он
             * всё равно накрыл бы её снизу.
             */}
            <Tree staticMode={prefersReducedMotion} hidden={consent === null} />
        </>
    );
};
