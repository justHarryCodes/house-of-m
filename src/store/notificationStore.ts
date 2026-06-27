import { create } from "zustand";
import type { AppNotification } from "@/types";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;

  setNotifications: (items: AppNotification[]) => void;
  addNotification: (item: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setLoading: (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount: items.filter((n) => !n.read).length,
    }),

  addNotification: (item) => {
    const current = get().notifications;
    const updated = [item, ...current];
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markRead: (id) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
