/**
 * Supabase / PostgREST returns at most `max_rows` rows per request (1,000 in
 * supabase/config.toml). Reports, the year-end report and dashboard totals used
 * single requests, so once a company passed 1,000 rows their totals were silently
 * wrong. fetchAllRows() pages through the result until it is exhausted.
 *
 * Pass a factory that builds the query WITHOUT `.range()`; give it a unique
 * ordering (for example `.order('id')` as the last order) so pages never overlap
 * or skip rows. Pages are separate requests, so rows written while a report is
 * loading may or may not be included (the same as reloading the report).
 */
export const FETCH_ALL_PAGE_SIZE = 1000;

type RangeableQuery<T> = {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: unknown }>;
};

export type FetchAllResult<T> = { data: T[]; error: null } | { data: null; error: unknown };

export async function fetchAllRows<T>(
  buildQuery: () => RangeableQuery<T>,
  pageSize: number = FETCH_ALL_PAGE_SIZE
): Promise<FetchAllResult<T>> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    // Stop only on an empty page: a short page can also mean the project's
    // "max rows" setting is below pageSize, not that the data has ended.
    if (page.length === 0) return { data: rows, error: null };
    rows.push(...page);
    from += page.length;
  }
}
