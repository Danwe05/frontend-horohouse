/**
 * Formats a timestamp or relative-time string into a compact display form.
 * Examples: "just now", "5m ago", "2h ago", "3d ago", "Jan 4"
 */
export function formatTimeAgo(time: string): string {
  if (!time) return "";

  const tryParseDate = (input: string): number | null => {
    const parsed = Date.parse(input);
    return isNaN(parsed) ? null : parsed;
  };

  const parsed = tryParseDate(time);
  if (parsed !== null) {
    const diffMs = Date.now() - parsed;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d ago`;
    try {
      return new Date(parsed).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return new Date(parsed).toDateString();
    }
  }

  // Already a relative string like "2 hours ago"
  const lower = time.toLowerCase();
  if (lower.includes("ago") || lower.includes("just now")) {
    if (lower.includes("just")) return "just now";
    const m = lower.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
    if (m) {
      const n = m[1];
      const unit = m[2];
      const short =
        unit.startsWith("second") ? "s"
        : unit.startsWith("minute") ? "m"
        : unit.startsWith("hour") ? "h"
        : unit.startsWith("day") ? "d"
        : unit.startsWith("week") ? "w"
        : unit.startsWith("month") ? "mo"
        : "y";
      return `${n}${short} ago`;
    }
    return time;
  }

  return time;
}

/**
 * Returns true if the given timestamp is less than 24 hours old.
 */
export function isNew(time: string): boolean {
  if (!time) return false;
  const parsed = Date.parse(time);
  if (isNaN(parsed)) return false;
  return Date.now() - parsed < 24 * 60 * 60 * 1000;
}

/**
 * Formats a raw numeric price string to a locale-aware currency string.
 * Strips non-numeric characters before formatting.
 */
export function formatPrice(price: string, currency = "XAF"): string {
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(numeric)) return price;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    // Fallback if currency code unsupported by locale
    return `${numeric.toLocaleString()} ${currency}`;
  }
}