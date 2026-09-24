import type { Settings } from "@/types/database";

export function isStoreOpenNow(settings: Pick<Settings, "store_open" | "opening_time" | "closing_time" | "timezone">): boolean {
  if (!settings.store_open) return false;
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: settings.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const nowMinutes = hh * 60 + mm;
  const [oh, om] = settings.opening_time.split(":").map(Number);
  const [ch, cm] = settings.closing_time.split(":").map(Number);
  return nowMinutes >= oh * 60 + om && nowMinutes < ch * 60 + cm;
}
