import { SalarySlip } from '@/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthOrder(slip: SalarySlip): number {
  const monthIdx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === slip.salary_month.toLowerCase()
  );
  return Number(slip.salary_year) * 12 + (monthIdx >= 0 ? monthIdx : 0);
}

function formatShortMonthYear(slip: SalarySlip): string {
  const shortMonth = slip.salary_month.slice(0, 3);
  return `${shortMonth} ${slip.salary_year}`;
}

function formatCurrencyAmount(amount: number): string {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
}

/**
 * Dynamically analyzes salary history to generate note bullet points.
 * If salary changes are detected, outputs exact statements like:
 * "1. Basic salary was Rs. 50,000/- for the first 3 months (Mar 2026 – May 2026)."
 * "2. Basic salary was revised to Rs. 65,000/- from Jun 2026 onwards."
 * "3. This is a system generated salary slip."
 */
export function generateSalaryRevisionNotes(
  historySlips: SalarySlip[],
  customNote?: string | null
): string[] {
  if (customNote && customNote.trim()) {
    // If a custom note is provided, preserve it as bullet points or single point
    const customLines = customNote
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (customLines.length > 0) {
      const result = customLines.map((line, idx) => {
        const cleaned = line.replace(/^\d+[\.\)]\s*/, '');
        return `${idx + 1}. ${cleaned}`;
      });
      result.push(`${result.length + 1}. This is a system generated salary slip.`);
      return result;
    }
  }

  if (!historySlips || historySlips.length < 2) {
    return [
      '1. Regular salary disbursed for the specified period.',
      '2. This is a system generated salary slip.',
    ];
  }

  // Sort chronologically
  const sorted = [...historySlips].sort((a, b) => getMonthOrder(a) - getMonthOrder(b));

  // Find salary revisions
  const initialSalary = Number(sorted[0].basic_salary || 0);
  let revisionIndex = -1;

  for (let i = 1; i < sorted.length; i++) {
    if (Number(sorted[i].basic_salary || 0) !== initialSalary) {
      revisionIndex = i;
      break;
    }
  }

  if (revisionIndex === -1) {
    // No revision across the period
    return [
      `1. Basic salary was Rs. ${formatCurrencyAmount(initialSalary)}/- throughout the specified period.`,
      '2. This is a system generated salary slip.',
    ];
  }

  const initialCount = revisionIndex;
  const initialPeriodStart = formatShortMonthYear(sorted[0]);
  const initialPeriodEnd = formatShortMonthYear(sorted[revisionIndex - 1]);
  const revisedSalary = Number(sorted[revisionIndex].basic_salary || 0);
  const revisedFrom = formatShortMonthYear(sorted[revisionIndex]);

  const notes: string[] = [];
  notes.push(
    `1. Basic salary was Rs. ${formatCurrencyAmount(initialSalary)}/- for the first ${initialCount} ${initialCount === 1 ? 'month' : 'months'} (${initialPeriodStart} – ${initialPeriodEnd}).`
  );
  notes.push(
    `2. Basic salary was revised to Rs. ${formatCurrencyAmount(revisedSalary)}/- from ${revisedFrom} onwards.`
  );
  notes.push(`${notes.length + 1}. This is a system generated salary slip.`);

  return notes;
}
