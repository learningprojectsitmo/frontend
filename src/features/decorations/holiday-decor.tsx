import { useCookieConsent } from "@/features/privacy/cookie-consent-provider";
import { usePublicAppSettings } from "@/lib/app-settings";

import { Garland } from "./garland";
import { Ornaments } from "./ornaments";
import { Snow } from "./snow";
import { Tree } from "./tree";
import { useDecorationsAllowed } from "./use-decorations-allowed";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

import "./decor.css";

/**
 * Новогодняя декорация поверх всего приложения. У снега с гирляндой и у ёлки
 * отдельные глобальные флаги админ-панели — `new_year_decorations_enabled` и
 * `new_year_tree_enabled`; оба по умолчанию выключены.
 *
 * Пользователь может отключить весь декор у себя на странице настроек
 * (`show_decorations`): он не показывается, если админ выключил оба флага
 * глобально или если пользователь снял галочку.
 *
 * Декор общий для всех страниц (лендинг, авторизация, /app, публичная вики),
 * поэтому его нужно монтировать в провайдере — единственном месте, которое
 * обёрнуто всеми маршрутами.
 */
export const HolidayDecor = () => {
    const { data } = usePublicAppSettings();
    const { consent } = useCookieConsent();
    const prefersReducedMotion = usePrefersReducedMotion();

    const ornamentsEnabled = data?.new_year_decorations_enabled === true;
    const treeEnabled = data?.new_year_tree_enabled === true;
    const adminEnabled = ornamentsEnabled || treeEnabled;
    const allowed = useDecorationsAllowed(adminEnabled);

    // Пока флаги не приехали — не рисуем ничего: иначе декор моргал бы на
    // каждой загрузке страницы в течение первых ~100 мс.
    if (!adminEnabled || !allowed) {
        return null;
    }

    return (
        <>
            {ornamentsEnabled && (
                <div className="holiday-decor" aria-hidden="true">
                    <Snow staticMode={prefersReducedMotion} />
                    <Garland />
                    <Ornaments />
                </div>
            )}
            {/*
             * Ёлка стоит вне `aria-hidden`-контейнера: это кнопка с подсказкой,
             * и внутри скрытого поддерева она была бы недоступна скринридерам.
             * Пока показан баннер cookie (z-index выше), ёлку не рисуем — он
             * всё равно накрыл бы её снизу.
             */}
            {treeEnabled && <Tree staticMode={prefersReducedMotion} hidden={consent === null} />}
        </>
    );
};
