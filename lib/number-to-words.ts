const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
  "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** 0–99 → words. */
function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 > 0 ? " " + ONES[n % 10] : "");
}

/** Non-negative integer → words in the Indian system (Crore / Lakh / Thousand / Hundred). */
function integerToWords(value: number): string {
  let n = Math.floor(value);
  if (n === 0) return "";

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  n %= 100;

  // Crore can exceed 99 (₹100 crore+); convert it recursively instead of
  // indexing past the TENS table.
  if (crore > 0) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh > 0) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred > 0) parts.push(`${ONES[hundred]} Hundred`);
  if (n > 0) parts.push(twoDigits(n));

  return parts.join(" ");
}

/**
 * Amount in words for invoices/salary slips, e.g. 1051.05 →
 * "Rupees One Thousand Fifty One and Five Paise Only".
 * Fractional amounts used to produce "undefined" (array indexed by a float).
 */
export function numberToWords(num: number): string {
  if (!Number.isFinite(num)) return "";
  const totalPaise = Math.round(Math.abs(num) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  if (rupees === 0 && paise === 0) return "Zero";

  const sign = num < 0 ? "Minus " : "";
  const rupeeWords = rupees > 0 ? integerToWords(rupees) : "Zero";
  const paiseWords = paise > 0 ? ` and ${twoDigits(paise)} Paise` : "";

  return `Rupees ${sign}${rupeeWords}${paiseWords} Only`;
}
