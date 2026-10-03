import type { Direction } from './model';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const dated = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const timed = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export function money(paise: number, showDecimals = false): string {
  const rupees = paise / 100;
  return `₹${showDecimals ? rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : inr.format(rupees)}`;
}

export function signedMoney(paise: number, direction: Direction, showDecimals = false): string {
  return `${direction === 'debit' ? '−' : '+'}${money(paise, showDecimals)}`;
}

export function dateLabel(timestamp: number): string { return dated.format(new Date(timestamp)); }
export function timeLabel(timestamp: number): string { return timed.format(new Date(timestamp)).toLowerCase(); }
export function monthLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(timestamp));
}

export function startOfMonth(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function endOfMonth(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}
