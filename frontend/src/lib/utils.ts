import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GemListing } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Some pre-existing listings in Firestore predate the simplified schema and
// only have a legacy `name` field instead of `title`.
export function getListingTitle(listing: GemListing): string {
  return listing.title || (listing as any).name || 'Untitled Gem';
}

export function formatCurrency(amount: number, currency: string = 'LKR') {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    const symbol = currency === 'LKR' ? 'Rs.' : currency;
    return `${symbol} ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
