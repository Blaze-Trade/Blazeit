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
