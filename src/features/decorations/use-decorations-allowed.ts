import { useUser } from "@/lib/auth";

/**
 * Разрешает ли текущий пользователь показывать праздничный декор.
 *
 * Декор включается админом глобально, но пользователь может спрятать его у
 * себя (`show_decorations`). Для анонимного посетителя или пока данные не
 * пришли считаем разрешённым — в этом случае решает только админский флаг.
 *
 * `useUser` дёргается лишь когда декор уже включён админом: иначе на каждой
 * странице с выключенным декором был бы лишний поход в `/auth/me`.
 */
export const useDecorationsAllowed = (adminEnabled: boolean): boolean => {
    const { data: user } = useUser({ enabled: adminEnabled });

    return user?.show_decorations !== false;
};
