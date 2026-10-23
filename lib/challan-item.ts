export function getItemPieces(item: { total_pieces?: number | null }): number {
  return Number(item.total_pieces ?? 1);
}

export function getItemQuantityDisplay(item: {
  quantity_display?: string | null;
  meter?: number | null;
  quantity?: number | null;
  unit?: string | null;
}): string {
  if (item.quantity_display?.trim()) {
    return item.quantity_display.trim();
  }

  if (item.unit?.trim() && /\d/.test(item.unit)) {
    return item.unit.trim();
  }

  const num = item.meter ?? item.quantity;
  if (num != null && item.unit?.trim()) {
    return `${num} ${item.unit}`.trim();
  }
  if (num != null) {
    return String(num);
  }

  return item.unit?.trim() ?? '';
}

/** Parse leading number for amount calculation only. */
export function parseQuantityNumeric(value?: string | null): number {
  if (!value?.trim()) return 0;
  const match = value.trim().match(/^[\d,]+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0].replace(/,/g, '')) : 0;
}

/**
 * True when a delivery-challan taka row has no data at all (no taka number,
 * zero meters and zero weight). Such rows are created by the "Enter adds a
 * row" shortcut and must not be counted as pieces or deducted from stock.
 */
export function isBlankTakaRow(item: {
  taka_no?: string | null;
  meters?: number | string | null;
  weight?: number | string | null;
}): boolean {
  return !item.taka_no?.toString().trim() && !(Number(item.meters) > 0) && !(Number(item.weight) > 0);
}
