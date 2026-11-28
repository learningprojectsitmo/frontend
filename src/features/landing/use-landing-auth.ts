import { useUser } from "@/lib/auth";

/** Один источник состояния «пользователь уже вошёл» для шапки и CTA лендинга. */
export const useLandingAuth = (): boolean => {
    const { data: user, isLoading } = useUser();
    return !isLoading && Boolean(user);
};
