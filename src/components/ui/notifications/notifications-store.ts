import { nanoid } from "nanoid";
import { create } from "zustand";

export type Notification = {
    id: string;
    type: "info" | "warning" | "success" | "error";
    title: string;
    message?: string;
};

type NotificationsStore = {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, "id">) => void;
    dismissNotification: (id: string) => void;
};

export const useNotifications = create<NotificationsStore>((set) => ({
    notifications: [],
    addNotification: (notification) =>
        set((state) => ({
            notifications: [...state.notifications, { id: nanoid(), ...notification }],
        })),
    dismissNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((notification) => notification.id !== id),
        })),
}));

const notify = (type: Notification["type"], title: string, message?: string) => {
    useNotifications.getState().addNotification({ type, title, message });
};

export const notifyError = (title: string, message?: string) => notify("error", title, message);
export const notifySuccess = (title: string, message?: string) => notify("success", title, message);
export const notifyInfo = (title: string, message?: string) => notify("info", title, message);
