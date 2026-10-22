export const DEFAULT_TABLE_PAGE_SIZE = 50;

export const TABLE_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export type TablePageSize = (typeof TABLE_PAGE_SIZE_OPTIONS)[number];

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export function paginatedRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export function ilikePattern(value: string): string {
  return `%${value.trim()}%`;
}

/**
 * Builds a quoted `%value%` operand for use inside PostgREST `.or()` filter strings.
 * Unquoted values break the filter (HTTP 400) when the search text contains
 * reserved characters such as `,` `.` `:` `(` `)`, and let input inject extra
 * filter clauses. Double quotes and backslashes are escaped per PostgREST rules.
 */
export function orIlikeValue(value: string): string {
  const escaped = value.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"%${escaped}%"`;
}
