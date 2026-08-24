import { useMemo } from 'react';
import { useCollapsedGroups } from '@/Shared/UI/TableFilters/useCollapsedGroups';
import type { Snippet } from '@/Domains/Snippet/types';

export interface SnippetGroupHeader {
    label: string;
    depth: number;
    key: string;
    count: number;
}

export interface SnippetGroupSection {
    headers: SnippetGroupHeader[];
    items: Snippet[];
    groupKey: string;
}

// Builds hierarchical snippet sections and per-group ownership summaries.
export function useSnippetGroups(snippets: Snippet[], currentUserId: Id) {
    const grouping = useMemo(() => {
        const grouped = snippets.filter(snippet => snippet.group);
        const ungrouped = snippets.filter(snippet => !snippet.group);
        const snippetsByGroup: Record<string, Snippet[]> = {};

        for (const snippet of grouped) {
            (snippetsByGroup[snippet.group!] ??= []).push(snippet);
        }

        const groupNames = Object.keys(snippetsByGroup).sort();
        const groupCounts: Record<string, number> = {};
        for (const group of groupNames) {
            const count = snippetsByGroup[group].length;
            const parts = group.split('/');
            for (let index = 0; index < parts.length; index++) {
                const key = parts.slice(0, index + 1).join('/');
                groupCounts[key] = (groupCounts[key] ?? 0) + count;
            }
        }

        const rendered = new Set<string>();
        const sections = groupNames.map(group => {
            const parts = group.split('/');
            const headers: SnippetGroupHeader[] = [];
            for (let index = 0; index < parts.length; index++) {
                const key = parts.slice(0, index + 1).join('/');
                if (!rendered.has(key)) {
                    rendered.add(key);
                    headers.push({
                        label: parts[index],
                        depth: index,
                        key,
                        count: groupCounts[key] ?? 0,
                    });
                }
            }
            return { headers, items: snippetsByGroup[group], groupKey: group };
        });

        return { hasGroups: grouped.length > 0, sections, ungrouped };
    }, [snippets]);
    const collapse = useCollapsedGroups(`snippet-collapsed-groups:${currentUserId}`);

    return { ...grouping, ...collapse };
}
