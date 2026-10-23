/**
 * Under row level security a forbidden UPDATE or DELETE is not an error: it
 * simply matches no rows, so the app showed "saved" / "deleted" while nothing
 * changed. Request the affected ids (`.select('id')`) and call this.
 */
export function assertAffected(rows: unknown[] | null | undefined, action: string): void {
  if (!rows || rows.length === 0) {
    throw new Error(`You do not have permission to ${action}, or it no longer exists.`);
  }
}
