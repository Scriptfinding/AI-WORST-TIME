import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { SnippetSuggestion } from '@/Shared/CodeEditor/hooks/useSnippetSuggestions';
import type { NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    CODE_NODE_NAME,
    CODE_NODE_VALUE_KEY,
    FILTER_NODE_NAME,
    IF_ELSE_NODE_NAME,
    LIMIT_NODE_NAME,
    LOOP_NODE_NAME,
    SET_NODE_NAME,
    SET_OUTPUT_NODE_NAME,
} from './constants';
import { getParameterMeta, getSignatureArgs, VISUAL_HELP_ENTRIES } from './catalog';
import { createEmptyFieldValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/objectParameters';

export const NATIVE_HELPER_REFERENCES = new Set(VISUAL_HELP_ENTRIES.map(entry => entry.name.replace(/^\$/, '')));

export const snippetSuggestionToEntry = (snippet: SnippetSuggestion): HelpEntryDef => ({
    name: `$$${snippet.id}`,
    signature: `$$${snippet.id}(${snippet.args})`,
    // No fallback to the label: it is already shown as the entry title.
    desc: snippet.description || '',
    displayLabel: snippet.label,
    category: 'Snippets',
    editUrl: snippet.edit_url,
});

export const getInitialNodeValues = (entry: HelpEntryDef): Record<string, NodeParameterValue> => {
    if (entry.name === CODE_NODE_NAME) {
        return {
            [CODE_NODE_VALUE_KEY]: {
                mode: 'fixed' as const,
                value: '// Write JavaScript for this step here.\n// Available: $page, $input, $nodes, $run, $output, $context and $vars(...).\n// Store variables for following nodes with $run, for example:\n// $run.my_var = 32\n',
            },
        };
    }

    if (entry.name === IF_ELSE_NODE_NAME) {
        return {
            condition: {
                mode: 'if-condition' as const,
                combinator: 'and' as const,
                rules: [{
                    id: 'condition-1',
                    category: 'boolean' as const,
                    operator: 'isTrue',
                    left: { mode: 'expression' as const, value: '{{ true }}' },
                    right: { mode: 'fixed' as const, value: '' },
                }],
            },
        };
    }

    if (entry.name === LOOP_NODE_NAME) {
        return {
            mode: { mode: 'fixed' as const, value: 'items' },
            items: { mode: 'expression' as const, value: '{{ $input.items || [] }}' },
            iterations: { mode: 'fixed' as const, value: '3' },
            condition: { mode: 'expression' as const, value: '{{ false }}' },
            maxIterations: { mode: 'fixed' as const, value: '100' },
        };
    }

    if (entry.name === '$gotoUrl' || entry.name === '$gotoTab') {
        return {
            tabName: { mode: 'fixed' as const, value: 'Default' },
        };
    }

    if (entry.name === '$sleep') {
        return {
            milliseconds: { mode: 'fixed' as const, value: '1000' },
        };
    }

    if (entry.name === FILTER_NODE_NAME) {
        return {
            array: { mode: 'expression' as const, value: '{{ $input.items || [] }}' },
            predicate: { mode: 'expression' as const, value: '{{ true }}' },
        };
    }

    if (entry.name === LIMIT_NODE_NAME) {
        return {
            array: { mode: 'expression' as const, value: '{{ $input.items || [] }}' },
            count: { mode: 'fixed' as const, value: '10' },
            offset: { mode: 'fixed' as const, value: '0' },
        };
    }

    if (entry.name === SET_NODE_NAME || entry.name === SET_OUTPUT_NODE_NAME) {
        return {
            variables: {
                mode: 'object' as const,
                inputMode: 'form' as const,
                jsonMode: 'fixed' as const,
                value: '{}',
                fields: [],
            },
        };
    }

    if (entry.name === '$mapElement' || entry.name === '$mapManyElements') {
        const inputKey = entry.name === '$mapElement' ? 'handle' : 'handles';
        return {
            [inputKey]: { mode: 'expression' as const, value: '{{ $nodes.last }}' },
            getters: {
                mode: 'object' as const,
                inputMode: 'form' as const,
                jsonMode: 'fixed' as const,
                value: '{"textContent":"textContent"}',
                fields: [{
                    id: 'getter-text-content',
                    key: 'textContent',
                    valueType: 'string' as const,
                    value: { mode: 'fixed' as const, value: 'textContent' },
                }],
            },
        };
    }

    if (entry.category === 'Data Tables') {
        return Object.fromEntries(getSignatureArgs(entry.signature).map(arg => {
            const key = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
            const valueType = getParameterMeta(entry, key).valueType;
            if (valueType === 'data-table-values' || valueType === 'object') {
                return [key, {
                    mode: 'object' as const,
                    inputMode: 'form' as const,
                    jsonMode: 'fixed' as const,
                    value: '{}',
                    fields: [],
                }];
            }
            if (valueType === 'data-table-filters' || valueType === 'data-table-columns') {
                return [key, { mode: 'fixed' as const, value: '[]' }];
            }

            return [key, { mode: 'fixed' as const, value: '' }];
        }));
    }

    if (entry.category === 'Snippets' || entry.localFunctionId) {
        return Object.fromEntries(getSignatureArgs(entry.signature).map(arg => [
            arg,
            { mode: 'expression' as const, value: `{{ $input.${arg} }}` },
        ]));
    }

    return Object.fromEntries(
        getSignatureArgs(entry.signature).flatMap(arg => {
            const key = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
            const meta = getParameterMeta(entry, key);
            const hasRequiredObjectFields = Object.values(meta.objectFields ?? {})
                .some(fieldMeta => fieldMeta.required)
                || (meta.requiredOneOf?.length ?? 0) > 0;

            return hasRequiredObjectFields ? [[key, createEmptyFieldValue(meta)]] : [];
        }),
    );
};
