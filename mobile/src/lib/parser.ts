import type { Category, Direction } from './model';

export interface ParsedSms {
  merchant: string;
  amountPaise: number;
  direction: Direction;
  category: Category;
  accountLast4: string | null;
  reference: string | null;
  confidence: number;
}

const amountPattern = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
const contextualAmountPatterns = [
  /\b(?:debited by|credited by|spent|paid|received)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:has been|was|is)?\s*(?:debited|credited|spent|paid|received)\b/i,
];
const debitPattern = /\b(debit(?:ed)?|spent|paid|purchase|withdrawn)\b/i;
const creditPattern = /\b(credit(?:ed)?|received|refund|deposited)\b/i;
const otpPattern = /\b(otp|one.time.password|verification code|login code|do not share|valid for \d+ min)\b/i;
const promoPattern = /\b(cashback offer|discount|coupon|apply now|limited time|shop now|sale ends|pre.approved loan)\b/i;
const referencePattern = /(?:UPI\s*Ref|Ref\s*(?:no|number)?|RRN|UTR)\s*[:#.-]?\s*([A-Z0-9]{8,})/i;
const accountPattern = /(?:A\/c|Acct|Account|Card)\s*(?:no\.?\s*)?(?:[Xx*·-]+)?\s*(\d{3,4})\b/i;
const merchantPatterns = [
  /\b(?:to\s+VPA|trf\s+to|paid\s+to)\s+([A-Z0-9._@ -]+?)(?=\s*\(|\s+Ref|\s+on\s+\d|[.;]|$)/i,
  /\b(?:at|from)\s+([A-Z][A-Z0-9&._@ -]+?)(?=\s+via\s+(?:UPI|IMPS|NEFT|RTGS|card)\b|\s+on\s+\d|\s*\(|[.;]|$)/i,
  /\bNEFT\s+from\s+([A-Z0-9 &._-]+?)(?=[.;]|$)/i,
];

function titleCase(input: string): string {
  return input.trim().replace(/\s+/g, ' ').replace(/\b\p{L}/gu, c => c.toUpperCase())
    .replace(/([\p{L}])([\p{L}]+)/gu, (_, first: string, rest: string) => first + rest.toLowerCase());
}

export function categoryFor(merchant: string, body = ''): Category {
  const text = `${merchant} ${body}`.toLowerCase();
  if (/swiggy|zomato|restaurant|cafe|coffee|domino|food/.test(text)) return 'Food & dining';
  if (/blinkit|zepto|bigbasket|grocer|supermarket|dmart/.test(text)) return 'Groceries';
  if (/uber|ola\b|metro|irctc|flight|bus|travel|petrol|fuel/.test(text)) return 'Travel';
  if (/electric|airtel|jio|water bill|rent|broadband|utility/.test(text)) return 'Bills';
  if (/amazon|flipkart|myntra|shopping|store|book\s*(?:mart|shop)/.test(text)) return 'Shopping';
  if (/pharm|apollo|hospital|clinic|doctor|medicine|health/.test(text)) return 'Health';
  if (/netflix|spotify|movie|cinema|prime video/.test(text)) return 'Entertainment';
  return 'Transfers';
}

function transactionDirection(body: string): Direction | null {
  const debit = debitPattern.test(body);
  const credit = creditPattern.test(body);
  if (debit === credit) return null;
  return debit ? 'debit' : 'credit';
}

function isTransactionMessage(body: string): boolean {
  return Boolean(body) && body.length <= 4000 && !otpPattern.test(body) && !promoPattern.test(body);
}

function transactionAmount(body: string): { amountPaise: number; contextual: boolean } | null {
  const contextualMatch = contextualAmountPatterns.map(pattern => body.match(pattern)).find(Boolean);
  const numeric = (contextualMatch?.[1] ?? body.match(amountPattern)?.[1] ?? '').replaceAll(',', '');
  const amount = Number(numeric);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return null;
  return { amountPaise: Math.round(amount * 100), contextual: Boolean(contextualMatch) };
}

function transactionMerchant(body: string): string {
  for (const pattern of merchantPatterns) {
    const merchant = body.match(pattern)?.[1]?.trim() ?? '';
    if (merchant) return merchant.replace(/\s+(?:Ref|UPI|via)$/i, '').trim();
  }
  return '';
}

function transactionConfidence(merchant: string, accountLast4: string | null, reference: string | null, contextual: boolean): number {
  let base = 0.45;
  if (merchant && accountLast4 && reference) base = 0.95;
  else if (merchant && accountLast4) base = 0.84;
  else if (merchant) base = 0.68;
  return contextual ? base : Math.min(base, 0.68);
}

export function parseBankSms(body: string): ParsedSms | null {
  if (!isTransactionMessage(body)) return null;
  const direction = transactionDirection(body);
  if (!direction) return null;
  const amount = transactionAmount(body);
  if (!amount) return null;
  const merchant = transactionMerchant(body);
  const accountLast4 = body.match(accountPattern)?.[1] ?? null;
  const reference = body.match(referencePattern)?.[1] ?? null;
  return {
    merchant: merchant ? titleCase(merchant) : 'Unknown merchant',
    amountPaise: amount.amountPaise,
    direction,
    category: categoryFor(merchant, body),
    accountLast4,
    reference,
    confidence: transactionConfidence(merchant, accountLast4, reference, amount.contextual),
  };
}
