import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HouseMember, TelegramUser } from "@/types";

interface AuthState {
  telegramUser: TelegramUser | null;
  member: HouseMember | null;
  initData: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setTelegramUser: (user: TelegramUser) => void;
  setMember: (member: HouseMember | null) => void;
  setInitData: (data: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      telegramUser: null,
      member: null,
      initData: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setTelegramUser: (user) =>
        set({ telegramUser: user }),

      setMember: (member) =>
        set({ member, isAuthenticated: !!member }),

      setInitData: (data) =>
        set({ initData: data }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setError: (error) =>
        set({ error }),

      reset: () =>
        set({
          telegramUser: null,
          member: null,
          initData: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: "hom-auth",
      partialize: (state) => ({
        telegramUser: state.telegramUser,
        initData: state.initData,
      }),
    }
  )
);
