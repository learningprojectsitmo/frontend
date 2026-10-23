import { usePublicAppSettings } from "@/lib/app-settings";

import { Bats } from "./bats";
import { Cobwebs } from "./cobwebs";
import { Ghost } from "./ghost";
import { Pumpkins } from "./pumpkins";
import { useDecorationsAllowed } from "./use-decorations-allowed";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

import "./halloween.css";

/**
 * Хэллоуинская декорация поверх всего приложения. Включается глобальным
 * флагом `halloween_decorations_enabled` из админ-панели; по умолчанию выключено.
 *
 * Пользователь может отключить её у себя на странице настроек
 * (`show_decorations`): декор не показывается, если админ выключил его глобально
 * или пользователь снял галочку.
 *
 * Как и новогодний декор, общий для всех страниц (лендинг, авторизация, /app,
 * публичная вики), поэтому монтируется в провайдере.
 */
export const HalloweenDecor = () => {
    const { data } = usePublicAppSettings();
    const prefersReducedMotion = usePrefersReducedMotion();

    const adminEnabled = data?.halloween_decorations_enabled === true;
    const allowed = useDecorationsAllowed(adminEnabled);

    // Пока флаг не приехал — не рисуем ничего: иначе декор моргал бы на
    // каждой загрузке страницы в течение первых ~100 мс.
    if (!adminEnabled || !allowed) {
        return null;
    }

    return (
        <div className="halloween-decor" aria-hidden="true">
            <Cobwebs />
            <Bats staticMode={prefersReducedMotion} />
            <Pumpkins />
            <Ghost staticMode={prefersReducedMotion} />
        </div>
    );
};
