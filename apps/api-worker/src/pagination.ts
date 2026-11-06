/// <reference lib="dom" />
// Shared list pagination + search contract for edge APIs.
// Query: ?page=1-based (default 1) & ?page_size=1..100 (default 50).
// Every paged response carries { page, page_size, total_count, total_pages, has_next }.

import { check } from './security.ts';

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
}

export function parsePagination(url: URL): PageRequest {
  const rawPage = url.searchParams.get('page');
  const rawSize = url.searchParams.get('page_size');
  const page = rawPage === null || rawPage === '' ? 1 : Number(rawPage);
  const pageSize = rawSize === null || rawSize === '' ? DEFAULT_PAGE_SIZE : Number(rawSize);
  check(Number.isSafeInteger(page) && page >= 1, 400, 'INVALID_PAGINATION', 'page는 1 이상의 정수여야 합니다.');
  check(
    Number.isSafeInteger(pageSize) && pageSize >= 1 && pageSize <= MAX_PAGE_SIZE,
    400,
    'INVALID_PAGINATION',
    `page_size는 1~${MAX_PAGE_SIZE} 범위의 정수여야 합니다.`
  );
  return { page, pageSize };
}

export function paginate<T>(all: T[], req: PageRequest): Page<T> {
  const total_count = all.length;
  const total_pages = Math.max(1, Math.ceil(total_count / req.pageSize));
  const start = (req.page - 1) * req.pageSize;
  const items = start >= total_count ? [] : all.slice(start, start + req.pageSize);
  return {
    items,
    page: req.page,
    page_size: req.pageSize,
    total_count,
    total_pages,
    has_next: req.page < total_pages,
  };
}

export function matchesQuery(haystacks: Array<string | null | undefined>, q: string | null): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  return haystacks.some(h => (h || '').toLowerCase().includes(needle));
}
