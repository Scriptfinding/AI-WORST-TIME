import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { LibraryCollection, LibraryStats, LibraryStoreItem, LibraryUseFormData } from './types';
import type { LibraryPendingUse } from './useLibraryStoreSelection';
import { requestLibraryJson } from './utils';

interface MutationOptions {
    pendingUse: LibraryPendingUse | null;
    setPendingUse: Dispatch<SetStateAction<LibraryPendingUse | null>>;
    setItems: Dispatch<SetStateAction<LibraryStoreItem[]>>;
    setError: Dispatch<SetStateAction<string | null>>;
    loadItems: (signal?: AbortSignal, refresh?: boolean) => Promise<void>;
}

interface ImportPayload {
    url?: string;
}

interface UpvotePayload {
    stats?: LibraryStats;
    upvoted?: boolean;
}

function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

// Performs library refresh, import, and upvote mutations while updating modal state.
export function useLibraryStoreMutations({
    pendingUse,
    setPendingUse,
    setItems,
    setError,
    loadItems,
}: MutationOptions) {
    const [refreshing, setRefreshing] = useState(false);
    const [busyKey, setBusyKey] = useState<string | null>(null);

    const incrementLocalUsage = useCallback((
        item: LibraryStoreItem,
        collection: LibraryCollection,
        reference: string,
    ) => {
        setItems(current => current.map(currentItem => {
            if (currentItem.key !== item.key) return currentItem;

            const nextCollection = currentItem[collection].map(child => child.reference === reference
                ? {
                    ...child,
                    used_count: (child.used_count || 0) + 1,
                    is_installed: true,
                }
                : child,
            );

            return {
                ...currentItem,
                [collection]: nextCollection,
                used_count: (currentItem.used_count || 0) + 1,
                used_flows_count: collection === 'flows' ? (currentItem.used_flows_count || 0) + 1 : currentItem.used_flows_count,
                used_snippets_count: collection === 'snippets' ? (currentItem.used_snippets_count || 0) + 1 : currentItem.used_snippets_count,
                stats: {
                    ...currentItem.stats,
                    downloads_count: currentItem.stats.downloads_count + 1,
                },
                is_installed: true,
            };
        }));
    }, [setItems]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        setError(null);

        try {
            await loadItems(undefined, true);
        } catch (error) {
            setError(errorMessage(error, 'Unable to refresh the library.'));
        } finally {
            setRefreshing(false);
        }
    }, [loadItems, setError]);

    const submitUse = useCallback(async (data: LibraryUseFormData) => {
        if (!pendingUse) return;

        const { item, collection, child } = pendingUse;
        const selection = {
            flows: collection === 'flows' ? [child.reference] : [],
            snippets: collection === 'snippets' ? [child.reference] : [],
        };
        const currentBusyKey = `${item.key}:${collection}:${child.reference}`;

        setBusyKey(currentBusyKey);
        setError(null);
        const targetWindow = window.open('about:blank', '_blank');
        if (targetWindow) {
            targetWindow.opener = null;
        }

        try {
            const payload = await requestLibraryJson<ImportPayload>(
                `/library/blueprints/${encodeURIComponent(item.key)}/import`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        ...selection,
                        overrides: collection === 'flows'
                            ? {
                                name: data.name,
                                description: data.description,
                                visibility: data.scope,
                                team_id: data.scope === 'team' ? data.team_id : null,
                                owner_id: data.owner_id,
                            }
                            : {
                                label: data.label,
                                description: data.description,
                                group: data.group,
                                scope: data.scope,
                                team_id: data.scope === 'team' ? data.team_id : null,
                                owner_id: data.owner_id,
                            },
                    }),
                },
            );
            incrementLocalUsage(item, collection, child.reference);
            setPendingUse(null);
            if (payload.url) {
                if (targetWindow) {
                    targetWindow.location.href = payload.url;
                } else {
                    window.open(payload.url, '_blank', 'noopener,noreferrer');
                }
            } else {
                targetWindow?.close();
            }
        } catch (error) {
            targetWindow?.close();
            setError(errorMessage(error, 'Import failed.'));
        } finally {
            setBusyKey(null);
        }
    }, [incrementLocalUsage, pendingUse, setError, setPendingUse]);

    const upvote = useCallback(async (item: LibraryStoreItem) => {
        setBusyKey(item.key);
        setError(null);
        try {
            const payload = await requestLibraryJson<UpvotePayload>(
                `/library/blueprints/${encodeURIComponent(item.key)}/upvote`,
                { method: 'POST', body: JSON.stringify({}) },
            );
            setItems(current => current.map(currentItem => currentItem.key === item.key
                ? { ...currentItem, stats: { ...(payload.stats || currentItem.stats), upvoted: payload.upvoted ?? true } }
                : currentItem,
            ));
        } catch (error) {
            setError(errorMessage(error, 'Unable to like this item.'));
        } finally {
            setBusyKey(null);
        }
    }, [setError, setItems]);

    return {
        refreshing,
        busyKey,
        refresh,
        submitUse,
        upvote,
    };
}
