import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Aptos amount conversion helpers
export const APT_DECIMALS = 8;

export const convertAmountFromHumanReadableToOnChain = (
  amount: number,
  decimals: number
): string => {
  const multiplier = Math.pow(10, decimals);
  const onChainAmount = Math.floor(amount * multiplier);
  return onChainAmount.toString();
};

export const convertAmountFromOnChainToHumanReadable = (
  amount: string | number,
  decimals: number
): number => {
  const divisor = Math.pow(10, decimals);
  return Number(amount) / divisor;
};

/**
 * Format duration in minutes to human-readable string
 * - Less than 60 minutes: "X Minute(s)"
 * - Less than 24 hours: "Xh Ym" or "X Hour(s)"
 * - 24 hours or more: "Xd Yh" or "X Day(s)"
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 Minutes";

  // Less than 60 minutes - show in minutes
  if (minutes < 60) {
    return `${Math.round(minutes)} Minute${Math.round(minutes) !== 1 ? "s" : ""}`;
  }

  // Less than 24 hours - show in hours (and minutes if not exact)
  if (minutes < 1440) { // 1440 = 24 * 60
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (remainingMinutes === 0) {
      return `${hours} Hour${hours !== 1 ? "s" : ""}`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }

  // 24 hours or more - show in days (and hours if not exact)
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.round((minutes % 1440) / 60);

  if (remainingHours === 0) {
    return `${days} Day${days !== 1 ? "s" : ""}`;
  }
  return `${days}d ${remainingHours}h`;
}

/**
 * Format duration in minutes to short format (for compact display)
 * @param minutes - Duration in minutes
 * @returns Short formatted string like "30m", "2h", "3d"
 */
export function formatDurationShort(minutes: number): string {
  if (minutes <= 0) return "0m";

  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  }

  const days = Math.round(minutes / 1440);
  return `${days}d`;
}
