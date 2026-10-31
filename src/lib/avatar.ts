import { useMutation, useQueryClient } from "@tanstack/react-query";

import { env } from "@/config/env";
import { api } from "./api-client";
import { queryKeys } from "./query-keys";

export type AvatarUploadResponse = { avatar_url: string };

const ABSOLUTE_URL_RE = /^(https?:|data:|blob:)/i;
const HTTP_URL_RE = /^https?:\/\//i;

/**
 * Приводит URL аватара из API к абсолютному.
 *
 * Бэкенд отдаёт относительный путь (`/media/1/avatar?v=...`): он не знает
 * своего публичного домена, а `API_URL` известен фронтенду. В проде база
 * относительная (`/v1`) — тогда склеиваем от текущего origin.
 */
export const resolveAvatarUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (ABSOLUTE_URL_RE.test(url)) return url;

    const base = env.API_URL.replace(/\/+$/, "");
    const path = url.startsWith("/") ? url : `/${url}`;
    if (HTTP_URL_RE.test(base)) return `${base}${path}`;

    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return `${origin}${base}${path}`;
};

/** Загрузить уже обрезанный квадрат (см. avatar-editor). */
export const uploadAvatar = async (blob: Blob): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    // Имя и content-type важны: FastAPI читает multipart как UploadFile.
    formData.append("file", blob, "avatar.webp");
    // Content-Type вручную не выставляем — axios добавит boundary сам.
    return await api.post<AvatarUploadResponse>("/profile/avatar", formData);
};

export const deleteAvatar = async (): Promise<void> => {
    await api.delete("/profile/avatar");
};

/**
 * После смены фото меняется не только профиль, но и списки участников/проектов:
 * они кэшируют `avatar_url` в DTO. Инвалидация по корневым ключам — один раз
 * на действие пользователя, это дешевле, чем рассинхрон аватарок.
 */
const useAvatarInvalidation = () => {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.user() });
        void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        void queryClient.invalidateQueries({ queryKey: ["projects"] });
    };
};

export const useUploadAvatar = () => {
    const invalidate = useAvatarInvalidation();
    return useMutation({
        mutationFn: uploadAvatar,
        onSuccess: invalidate,
    });
};

export const useDeleteAvatar = () => {
    const invalidate = useAvatarInvalidation();
    return useMutation({
        mutationFn: deleteAvatar,
        onSuccess: invalidate,
    });
};
