import {
    useEffect,
    useMemo,
    useState,
    type DragEvent,
} from 'react';
import { fetchChannelSuggestions, type ChannelSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { fetchMailboxWatcherSuggestions, type WatcherSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import { fetchVariableSuggestions, type VariableSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import type { ScalarNodeParameterValue } from '../types';
import { evaluateExpressionPreview } from '../utils/expression';
import type { NodalAutocompleteContext } from '../utils/staticAnalysis';
import type { ExpressionInputType } from './FixedInputRenderer';
import { hasOpenEditorAutocomplete, insertPathExpression } from './utils';
import {
    useNodeValidationResourceRevision,
    useRefreshNodeValidationResources,
} from '../contexts/NodeValidationContext';

interface UseExpressionInputOrchestrationOptions {
    autocompleteContext: NodalAutocompleteContext;
    flowId?: Id;
    inputType: ExpressionInputType;
    outputData: unknown;
    value: ScalarNodeParameterValue;
    refreshInlineExpressionCompletions: () => void;
    updateExpression: (value: string) => void;
}

interface UseAsyncResourceOptions<TResource, TActive> {
    active: TActive | false | null | undefined;
    loader: (active: TActive, force: boolean) => Promise<TResource>;
    fallback: TResource;
    revision?: number;
}

// Loads an autocomplete resource only while its matching input mode is active.
function useAsyncResource<TResource, TActive>({
    active,
    loader,
    fallback,
    revision = 0,
}: UseAsyncResourceOptions<TResource, TActive>) {
    const [resource, setResource] = useState<TResource>(() => fallback);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!active) return;

        let stale = false;
        setLoading(true);
        loader(active, revision > 0)
            .then(value => {
                if (!stale) setResource(value);
            })
            .finally(() => {
                if (!stale) setLoading(false);
            });
        return () => {
            stale = true;
        };
    }, [active, loader, revision]);

    return { loading, resource };
}

function fetchExpressionVariableSuggestions(_expression: string) {
    return fetchVariableSuggestions();
}

function fetchChannelSuggestionResource(_active: true, force: boolean) {
    return fetchChannelSuggestions(force);
}

// Coordinates expression mode, suggestions, previews, and expanded-editor visibility.
export function useExpressionInputOrchestration({
    autocompleteContext,
    flowId,
    inputType,
    outputData,
    value,
    refreshInlineExpressionCompletions,
    updateExpression,
}: UseExpressionInputOrchestrationOptions) {
    const [expanded, setExpanded] = useState(false);
    const [renderVisible, setRenderVisible] = useState(false);
    const resourceRevision = useNodeValidationResourceRevision();
    const refreshResources = useRefreshNodeValidationResources();
    const channelResource = useAsyncResource<ChannelSuggestion[], true>({
        active: inputType === 'channel',
        loader: fetchChannelSuggestionResource,
        fallback: [],
        revision: resourceRevision,
    });
    const watcherResource = useAsyncResource<WatcherSuggestion[], Id>({
        active: inputType === 'mailbox-watcher' ? flowId : undefined,
        loader: fetchMailboxWatcherSuggestions,
        fallback: [],
        revision: resourceRevision,
    });
    const variableResource = useAsyncResource<VariableSuggestion[], string>({
        active: value.value.includes('$vars(') ? value.value : false,
        loader: fetchExpressionVariableSuggestions,
        fallback: [],
        revision: resourceRevision,
    });
    const channelSuggestions = channelResource.resource;
    const watcherSuggestions = watcherResource.resource;
    const variableSuggestions = variableResource.resource;
    const renderedExpression = useMemo(() => {
        const variableData = Object.fromEntries(
            variableSuggestions
                .filter(variable => Object.prototype.hasOwnProperty.call(variable, 'preview_value'))
                .map(variable => [variable.id, variable.preview_value]),
        );
        return evaluateExpressionPreview(value.value, {
            inputData: autocompleteContext.inputData,
            pageData: autocompleteContext.pageData,
            outputData,
            nodeData: autocompleteContext.nodeData,
            runData: autocompleteContext.runData,
            contextData: autocompleteContext.contextData,
            variableData,
        });
    }, [
        autocompleteContext.contextData,
        autocompleteContext.inputData,
        autocompleteContext.nodeData,
        autocompleteContext.pageData,
        autocompleteContext.runData,
        outputData,
        value.value,
        variableSuggestions,
    ]);

    useEffect(() => {
        if (!expanded) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;

            const overlays = document.querySelectorAll<HTMLElement>('[data-modal-overlay]');
            const topOverlay = overlays[overlays.length - 1];
            if (topOverlay?.dataset.modalKind !== 'expression-fullscreen') return;
            if (hasOpenEditorAutocomplete()) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            setExpanded(false);
        };

        window.addEventListener('keydown', handleEscape, true);
        return () => window.removeEventListener('keydown', handleEscape, true);
    }, [expanded]);

    const insertDraggedPath = (path: string) => {
        if (!path) return;
        updateExpression(insertPathExpression(value.mode === 'expression' ? value.value : '', path));
    };

    return {
        channelSuggestions,
        channelSuggestionsLoading: channelResource.loading,
        expanded,
        insertDraggedPath,
        onBlur: () => setRenderVisible(false),
        onClose: () => setExpanded(false),
        onDragOver: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            insertDraggedPath(event.dataTransfer.getData('text/plain'));
        },
        onExpand: () => setExpanded(true),
        onFocus: () => {
            setRenderVisible(true);
            refreshInlineExpressionCompletions();
        },
        renderedExpression,
        refreshSuggestions: refreshResources,
        renderVisible,
        watcherSuggestions,
        watcherSuggestionsLoading: watcherResource.loading,
    };
}
