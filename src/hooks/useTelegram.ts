"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import type { TelegramUser } from "@/types";

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback: (ok: boolean) => void) => void;
  showPopup: (params: object, callback?: () => void) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { setTelegramUser, setInitData } = useAuthStore();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      // Development mode: mock user
      if (process.env.NODE_ENV === "development") {
        const mockUser: TelegramUser = {
          id: 123456789,
          first_name: "House",
          last_name: "Member",
          username: "housemember",
          is_premium: true,
        };
        setTelegramUser(mockUser);
        setInitData("mock_init_data");
        setIsReady(true);
      }
      return;
    }

    tg.ready();
    tg.expand();
    setWebApp(tg);

    // Always set initData — auth depends on it regardless of user presence
    setInitData(tg.initData);

    const user = tg.initDataUnsafe?.user;
    if (user) {
      setTelegramUser(user);
    }

    setIsReady(true);
  }, [setTelegramUser, setInitData]);

  const haptic = {
    impact: (style: "light" | "medium" | "heavy" = "light") => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    success: () => webApp?.HapticFeedback?.notificationOccurred("success"),
    error: () => webApp?.HapticFeedback?.notificationOccurred("error"),
    warning: () => webApp?.HapticFeedback?.notificationOccurred("warning"),
    selection: () => webApp?.HapticFeedback?.selectionChanged(),
  };

  return {
    webApp,
    isReady,
    initData: webApp?.initData ?? "",
    telegramUser: webApp?.initDataUnsafe?.user ?? null,
    haptic,
    openLink: (url: string) => webApp?.openLink(url),
    openTelegramLink: (url: string) => webApp?.openTelegramLink(url),
    showAlert: (msg: string, cb?: () => void) => webApp?.showAlert(msg, cb),
    showConfirm: (msg: string, cb: (ok: boolean) => void) => webApp?.showConfirm(msg, cb),
    close: () => webApp?.close(),
  };
}
