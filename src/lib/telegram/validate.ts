import { createHmac } from "crypto";
import type { TelegramUser } from "@/types";

// Server-side Telegram init data validation per official spec
export function validateTelegramInitData(initData: string): TelegramUser | null {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not set");

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    params.delete("hash");

    // Sort keys and build check string
    const sortedPairs = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    // HMAC-SHA256 with secret = HMAC-SHA256("WebAppData", botToken)
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = createHmac("sha256", secretKey)
      .update(sortedPairs)
      .digest("hex");

    if (calculatedHash !== hash) return null;

    // Check expiry (24h)
    const authDate = parseInt(params.get("auth_date") ?? "0", 10);
    if (Date.now() / 1000 - authDate > 86400) return null;

    const userParam = params.get("user");
    if (!userParam) return null;

    return JSON.parse(userParam) as TelegramUser;
  } catch {
    return null;
  }
}
