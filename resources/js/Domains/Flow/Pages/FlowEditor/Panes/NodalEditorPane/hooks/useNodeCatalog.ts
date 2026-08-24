import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSnippetSuggestions } from '@/Shared/CodeEditor/hooks/useSnippetSuggestions';
import { HIDDEN_TOOLBOX_ENTRY_NAMES, isHelpCategoryPick } from '@/Domains/Flow/Pages/FlowEditor/categories';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { FALLBACK_CATEGORY, NODE_CATEGORIES, NODE_RUN_OUTPUT_KEY } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import {
    formatLocalFunctionCallLabel,
    formatToolboxNodeLabel,
    getSignatureArgs,
    getNodeCategoryKey,
    sortEntries,
    uniqueEntriesByName,
    VISUAL_HELP_ENTRIES,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import { getFunctionArgumentNames } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/functionArguments';
import {
    NATIVE_HELPER_REFERENCES,
    getInitialNodeValues,
    snippetSuggestionToEntry,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/nodeDefaults';

interface UseNodeCatalogOptions {
    nodes: CanvasNode[];
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
}

const getSearchRank = (entry: HelpEntryDef, query: string) => {
    const title = formatToolboxNodeLabel(entry).toLowerCase();
    const rawName = entry.name.toLowerCase().replace(/^\$\$?/, '');
    const signature = entry.signature.toLowerCase();
    const description = (entry.nodalDesc ?? entry.desc).toLowerCase();
    const category = entry.category.toLowerCase();
    const aliases = entry.aliases?.map(alias => alias.toLowerCase()) ?? [];

    if (title.startsWith(query) || rawName.startsWith(query)) return 0;
    if (title.includes(query) || rawName.includes(query)) return 1;
    if (aliases.some(alias => alias === query)) return 2;
    if (aliases.some(alias => alias.startsWith(query))) return 3;
    if (aliases.some(alias => alias.includes(query))) return 4;
    if (signature.includes(query)) return 5;
    if (description.includes(query)) return 6;
    if (category.includes(query)) return 7;

    return Number.POSITIVE_INFINITY;
};

// Filters and groups available node entries while managing the catalog picker.
export function useNodeCatalog({ nodes, setNodes }: UseNodeCatalogOptions) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const pickerWasOpen = useRef(false);
    const [snippetRefreshKey, setSnippetRefreshKey] = useState(0);
    const [search, setSearch] = useState('');
    const [activeCategoryKey, setActiveCategoryKey] = useState(NODE_CATEGORIES[0].key);
    const snippetEntries = useSnippetSuggestions({
        mapSuggestion: snippetSuggestionToEntry,
        refreshKey: snippetRefreshKey,
    });
    const localFunctionEntries = useMemo<HelpEntryDef[]>(() => nodes
        .filter(node => node.system === 'function' && node.scopeId)
        .flatMap(node => {
            const functionName = normalizeScalarParameterValue(node.values.name).value.trim();
            const args = getFunctionArgumentNames(node.values.arguments);
            if (!functionName) return [];
            return [{
                name: functionName,
                signature: `${functionName}(${args.join(', ')})`,
                desc: `Call the private ${functionName} function.`,
                category: 'Functions',
                localFunctionId: node.id,
            }];
        }), [nodes]);

    useEffect(() => {
        if (pickerOpen && !pickerWasOpen.current) {
            setSnippetRefreshKey(current => current + 1);
        }
        pickerWasOpen.current = pickerOpen;
    }, [pickerOpen]);

    const activeCategory = NODE_CATEGORIES.find(category => category.key === activeCategoryKey) ?? FALLBACK_CATEGORY;

    const allVisualHelpEntries = useMemo(() => uniqueEntriesByName([
        ...VISUAL_HELP_ENTRIES,
        ...localFunctionEntries,
        ...snippetEntries.filter(entry => !NATIVE_HELPER_REFERENCES.has(entry.name.replace(/^\$\$/, ''))),
    ]).filter(entry => !HIDDEN_TOOLBOX_ENTRY_NAMES.has(entry.name)), [localFunctionEntries, snippetEntries]);

    useEffect(() => {
        if (snippetEntries.length === 0) return;
        const snippetsByName = new Map(snippetEntries.map(entry => [entry.name, entry]));

        setNodes(current => current.map(node => {
            const snippetEntry = snippetsByName.get(node.entry.name);
            if (!snippetEntry) return node;
            const callArguments = getSignatureArgs(snippetEntry.signature);
            const defaults = getInitialNodeValues(snippetEntry);
            const values = Object.fromEntries(callArguments.map(argument => [
                argument,
                node.values[argument] ?? defaults[argument] ?? { mode: 'expression', value: `{{ $input.${argument} }}` },
            ]));
            if (node.values[NODE_RUN_OUTPUT_KEY]) values[NODE_RUN_OUTPUT_KEY] = node.values[NODE_RUN_OUTPUT_KEY];

            return { ...node, entry: snippetEntry, callArguments, values };
        }));
    }, [setNodes, snippetEntries]);

    useEffect(() => {
        const functionsById = new Map(localFunctionEntries
            .filter(entry => entry.localFunctionId)
            .map(entry => [entry.localFunctionId!, entry]));

        setNodes(current => {
            let changed = false;
            const nextNodes = current.map(node => {
                if (node.system === 'function' && node.scopeId) {
                    const functionEntry = functionsById.get(node.id);
                    if (!functionEntry) return node;
                    const callArguments = getSignatureArgs(functionEntry.signature);
                    if (
                        node.label === functionEntry.name
                        && JSON.stringify(node.callArguments) === JSON.stringify(callArguments)
                    ) return node;
                    changed = true;
                    return { ...node, label: functionEntry.name, callArguments };
                }
                if (!node.localFunctionId) return node;
                const functionEntry = functionsById.get(node.localFunctionId);
                if (!functionEntry) return node;
                const callArguments = getSignatureArgs(functionEntry.signature);
                const callLabel = formatLocalFunctionCallLabel(functionEntry.name);
                const values = Object.fromEntries(callArguments.map(argument => [
                    argument,
                    node.values[argument] ?? { mode: 'expression', value: `{{ $input.${argument} }}` },
                ]));
                if (node.values[NODE_RUN_OUTPUT_KEY]) values[NODE_RUN_OUTPUT_KEY] = node.values[NODE_RUN_OUTPUT_KEY];
                if (
                    node.entry.signature === functionEntry.signature
                    && node.entry.name === functionEntry.name
                    && node.label === callLabel
                    && JSON.stringify(node.callArguments) === JSON.stringify(callArguments)
                    && JSON.stringify(node.values) === JSON.stringify(values)
                ) return node;
                changed = true;
                return {
                    ...node,
                    entry: functionEntry,
                    label: callLabel,
                    callArguments,
                    values,
                };
            });
            return changed ? nextNodes : current;
        });
    }, [localFunctionEntries, setNodes]);

    const categoryEntries = useMemo(() => {
        const matched = allVisualHelpEntries
            .filter(entry => isHelpCategoryPick(activeCategory) ? activeCategory.match(entry) : getNodeCategoryKey(entry) === activeCategory.key);
        return sortEntries(matched, activeCategory.priority);
    }, [activeCategory, allVisualHelpEntries]);

    const visibleEntries = useMemo(() => {
        if (!search.trim()) return categoryEntries;
        const q = search.toLowerCase();

        return allVisualHelpEntries
            .map((entry, index) => ({ entry, index, rank: getSearchRank(entry, q) }))
            .filter(item => Number.isFinite(item.rank))
            .sort((a, b) => {
                if (a.rank !== b.rank) return a.rank - b.rank;
                return a.index - b.index;
            })
            .map(item => item.entry);
    }, [allVisualHelpEntries, categoryEntries, search]);

    return {
        activeCategoryKey,
        pickerOpen,
        search,
        setActiveCategoryKey,
        setPickerOpen,
        setSearch,
        visibleEntries,
    };
}
