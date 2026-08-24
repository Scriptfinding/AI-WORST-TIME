import { MAX_PAGINATION_PAGES } from './config';
import { getRunPaginationItems, type RunPaginationItem } from '@/Domains/Flow/Pages/runHistory';

export type PaginationItem = RunPaginationItem;

export function msToSecondsInput(value: string | number | null): string {
    if (value == null || value === '') return '';
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '';
    return String(numberValue / 1000);
}

export function secondsToMs(value: string): number | undefined {
    if (value.trim() === '') return undefined;
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return undefined;
    return Math.max(0, Math.round(numberValue * 1000));
}

export function getPaginationItems(currentPage: number, lastPage: number): PaginationItem[] {
    return getRunPaginationItems(currentPage, lastPage, MAX_PAGINATION_PAGES);
}

export function buildPageUrl(pageName: string, page: number): string {
    const params = new URLSearchParams(window.location.search);
    params.set(pageName, String(page));
    return `${window.location.pathname}?${params.toString()}`;
}

export function hasOpenModal(): boolean {
    return document.querySelector('[data-modal-overlay]') !== null;
}
