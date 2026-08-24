import { useCallback, useEffect, useRef, useState } from 'react';
import type { LibraryStoreItem, SortKey } from './types';
import { requestLibraryJson } from './utils';

const DEFAULT_PER_PAGE = 20;

interface LibraryItemsPayload {
    items?: LibraryStoreItem[];
    categories?: string[];
    category_counts?: Record<string, number>;
    total_count?: number;
}

// Loads and filters the paginated item collection displayed by LibraryStoreModal.
export function useLibraryStoreItems(isOpen: boolean) {
    const [items, setItems] = useState<LibraryStoreItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState<SortKey>('popular');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasLoadedRef = useRef(false);

    const loadItems = useCallback(async (signal?: AbortSignal, refresh = false) => {
        const params = new URLSearchParams({ sort });
        if (search.trim()) params.set('search', search.trim());
        if (category) params.set('category', category);
        if (refresh) params.set('refresh', '1');

        const payload = await requestLibraryJson<LibraryItemsPayload>(
            `/library/items?${params}`,
            signal ? { signal } : undefined,
        );
        setItems(payload.items || []);
        setCategories(payload.categories || []);
        setCategoryCounts(payload.category_counts || {});
        setTotalCount(payload.total_count || 0);
    }, [category, search, sort]);

    useEffect(() => {
        if (!isOpen) return;

        const controller = new AbortController();
        let active = true;
        const showBlockingLoader = !hasLoadedRef.current;
        if (showBlockingLoader) {
            setLoading(true);
        }
        setError(null);

        const timer = window.setTimeout(() => {
            loadItems(controller.signal)
                .then(() => {
                    if (active) {
                        hasLoadedRef.current = true;
                    }
                })
                .catch((loadError) => {
                    if (loadError instanceof Error && loadError.name !== 'AbortError') {
                        setError(loadError.message || 'Unable to load the library.');
                    }
                })
                .finally(() => {
                    if (active && showBlockingLoader) {
                        setLoading(false);
                    }
                });
        }, 180);

        return () => {
            active = false;
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [isOpen, loadItems]);

    useEffect(() => {
        if (category && !categories.includes(category)) {
            setCategory('');
        }
    }, [categories, category]);

    useEffect(() => {
        const pageCount = Math.max(1, Math.ceil(items.length / perPage));
        if (page > pageCount) setPage(pageCount);
    }, [items.length, page, perPage]);

    const changeSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const changeCategory = useCallback((value: string) => {
        setCategory(value);
        setPage(1);
    }, []);

    const changeSort = useCallback((value: SortKey) => {
        setSort(value);
        setPage(1);
    }, []);

    const changePerPage = useCallback((value: number) => {
        setPerPage(value);
        setPage(1);
    }, []);

    return {
        items,
        setItems,
        categories,
        categoryCounts,
        totalCount,
        search,
        category,
        sort,
        page,
        perPage,
        loading,
        error,
        setError,
        loadItems,
        changeSearch,
        changeCategory,
        changeSort,
        setPage,
        changePerPage,
    };
}
