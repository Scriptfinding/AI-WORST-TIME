export const RUN_STATUSES = ['pending', 'running', 'success', 'error', 'cancelled'] as const;

export const RUN_META_OPERATORS = [
    'contains',
    'equals',
    'not_equals',
    'starts_with',
    'ends_with',
    'gt',
    'gte',
    'lt',
    'lte',
    'exists',
] as const;

export const RUN_PER_PAGE_OPTIONS = [20, 50, 100] as const;

export type RunPaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

export function getRunPaginationItems(
    currentPage: number,
    lastPage: number,
    maxPages: number,
): RunPaginationItem[] {
    if (lastPage <= maxPages) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const middleSlots = maxPages - 2;
    let start = currentPage - Math.floor(middleSlots / 2);
    let end = start + middleSlots - 1;

    if (start < 2) {
        start = 2;
        end = start + middleSlots - 1;
    }

    if (end > lastPage - 1) {
        end = lastPage - 1;
        start = end - middleSlots + 1;
    }

    const pages: RunPaginationItem[] = [1];
    if (start > 2) pages.push('ellipsis-start');
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < lastPage - 1) pages.push('ellipsis-end');
    pages.push(lastPage);
    return pages;
}
