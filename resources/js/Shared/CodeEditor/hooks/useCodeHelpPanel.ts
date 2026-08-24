import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    HELP_CATEGORY_PAGES,
    HIDDEN_TOOLBOX_ENTRY_NAMES,
    isHelpCategoryPick,
    type HelpCategoryPage,
} from '@/Domains/Flow/Pages/FlowEditor/categories';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { HELP_ENTRIES, runHelpEval } from '@/Domains/Flow/Pages/FlowEditor/utils/helpCatalog';
import { NATIVE_HELPER_REFERENCES, getHelpCategoryKey, searchHelpEntries, sortHelpEntries, uniqueHelpEntriesByName } from '@/Domains/Flow/Pages/FlowEditor/utils/helpToolbox';
import { useSnippetSuggestions } from './useSnippetSuggestions';

export interface CodeHelpEvaluation {
    entry: HelpEntryDef;
    result: unknown;
    error?: string;
}

interface UseCodeHelpPanelOptions {
    readOnly: boolean;
    insertEntry: (entry: HelpEntryDef) => boolean;
    categories?: HelpCategoryPage[];
    baseEntries?: HelpEntryDef[];
    hiddenEntryNames?: ReadonlySet<string>;
    nativeHelperReferences?: ReadonlySet<string>;
}

// Drives the code editor help panel, including search, navigation, insertion, and evaluation.
export function useCodeHelpPanel({
    readOnly,
    insertEntry,
    categories = HELP_CATEGORY_PAGES,
    baseEntries = HELP_ENTRIES,
    hiddenEntryNames = HIDDEN_TOOLBOX_ENTRY_NAMES,
    nativeHelperReferences = NATIVE_HELPER_REFERENCES,
}: UseCodeHelpPanelOptions) {
    const [showHelp, setShowHelp] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeCategoryKey, setActiveCategoryKey] = useState(categories[0].key);
    const [evaluation, setEvaluation] = useState<CodeHelpEvaluation | null>(null);
    const [requestedEntryName, setRequestedEntryName] = useState<string | null>(null);
    const entryRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const snippetEntries = useSnippetSuggestions({ enabled: showHelp });

    const allEntries = useMemo(() => uniqueHelpEntriesByName([
        ...baseEntries,
        ...snippetEntries.filter(entry => !nativeHelperReferences.has(entry.name.replace(/^\$\$/, ''))),
    ]).filter(entry => !hiddenEntryNames.has(entry.name)), [
        baseEntries,
        hiddenEntryNames,
        nativeHelperReferences,
        snippetEntries,
    ]);

    const activeCategory = categories.find(
        category => category.key === activeCategoryKey,
    ) ?? categories[0];

    const entries = useMemo(() => {
        if (search.trim()) {
            return searchHelpEntries(allEntries, search);
        }

        const matchingEntries = isHelpCategoryPick(activeCategory)
            ? allEntries.filter(entry => activeCategory.match(entry))
            : allEntries.filter(entry => getHelpCategoryKey(entry) === activeCategory.key);
        return sortHelpEntries(matchingEntries, activeCategory.priority);
    }, [activeCategory, allEntries, search]);

    useEffect(() => {
        setActiveIndex(0);
    }, [entries, search]);

    useEffect(() => {
        entryRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    useEffect(() => {
        if (!requestedEntryName) return;

        const entryIndex = entries.findIndex(entry => entry.name === requestedEntryName);
        if (entryIndex === -1) return;

        setActiveIndex(entryIndex);
        entryRefs.current[entryIndex]?.focus();
        setRequestedEntryName(null);
    }, [entries, requestedEntryName]);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (evaluation) {
                setEvaluation(null);
            } else if (showHelp) {
                setShowHelp(false);
            }
        };

        window.addEventListener('keydown', handleEscape, true);
        return () => window.removeEventListener('keydown', handleEscape, true);
    }, [evaluation, showHelp]);

    useEffect(() => {
        if (!showHelp) return;

        const closeOnOutsidePointerDown = (event: PointerEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest('[data-code-help-panel], [data-code-help-trigger]')) return;
            setShowHelp(false);
        };

        window.addEventListener('pointerdown', closeOnOutsidePointerDown, true);
        return () => window.removeEventListener('pointerdown', closeOnOutsidePointerDown, true);
    }, [showHelp]);

    const evaluate = useCallback((entry: HelpEntryDef) => {
        if (!entry.evalExpr) return;

        const output = runHelpEval(entry.evalExpr);
        setEvaluation('error' in output && output.error
            ? { entry, result: undefined, error: output.error }
            : { entry, result: output.result });
    }, []);

    const insert = useCallback((entry: HelpEntryDef) => {
        if (readOnly) return;
        if (insertEntry(entry)) setShowHelp(false);
    }, [insertEntry, readOnly]);

    const focusEntry = useCallback((name: string) => {
        setShowHelp(true);
        setSearch(name);
        setRequestedEntryName(name);
    }, []);

    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (entries.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(current => Math.min(entries.length - 1, current + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(current => Math.max(0, current - 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            insert(entries[activeIndex] ?? entries[0]);
        }
    }, [activeIndex, entries, insert]);

    return {
        activeCategoryKey,
        activeIndex,
        entries,
        entryRefs,
        evaluation,
        search,
        showHelp,
        closeEvaluation: () => setEvaluation(null),
        closeHelp: () => setShowHelp(false),
        evaluate,
        focusEntry,
        handleSearchKeyDown,
        insert,
        openHelp: () => setShowHelp(true),
        setActiveCategoryKey,
        setActiveIndex,
        setSearch,
    };
}
