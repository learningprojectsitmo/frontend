import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AppSettingsAdminResponse, AppSettingsPublic, AppSettingValue } from "@/types/api";

/**
 * Кэш публичных настроек живёт заметно дольше дефолтного `staleTime`
 * (60 c, см. `lib/react-query.ts`): декорация рисуется на каждой странице,
 * а глобальный `refetchOnWindowFocus: true` иначе дёргал бы эндпоинт при
 * каждом переключении вкладки.
 */
const PUBLIC_SETTINGS_STALE_MS = 5 * 60 * 1000;
const PUBLIC_SETTINGS_GC_MS = 10 * 60 * 1000;

/** Публичная выборка: анонимный посетитель тоже должен её видеть. */
export const getPublicAppSettings = async (): Promise<AppSettingsPublic> => {
    return await api.get<AppSettingsPublic>("/settings/public");
};

export const usePublicAppSettings = () => {
    return useQuery({
        queryKey: queryKeys.appSettings.public(),
        queryFn: getPublicAppSettings,
        staleTime: PUBLIC_SETTINGS_STALE_MS,
        gcTime: PUBLIC_SETTINGS_GC_MS,
    });
};

/** Полный список глобальных настроек для админ-панели. */
export const getAdminAppSettings = async (): Promise<AppSettingsAdminResponse> => {
    return await api.get<AppSettingsAdminResponse>("/admin/settings");
};

export const useAdminAppSettings = () => {
    return useQuery({
        queryKey: queryKeys.appSettings.admin(),
        queryFn: getAdminAppSettings,
    });
};

/**
 * Частичное обновление. Инвалидируем всю ветку `appSettings`, иначе декор
 * на других страницах остался бы в старом состоянии до истечения staleTime.
 */
export const useUpdateAppSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (patch: Record<string, AppSettingValue>) =>
            api.patch<AppSettingsAdminResponse>("/admin/settings", patch),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.appSettings.all() });
        },
    });
};
