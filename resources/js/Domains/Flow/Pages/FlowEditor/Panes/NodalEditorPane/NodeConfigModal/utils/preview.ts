import type { FlowRun } from '@/Domains/Flow/types';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { CanvasNode, NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import { collectCodeRunAssignments } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import { evaluateExpressionPreview, normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import {
    CODE_NODE_NAME,
    CODE_NODE_VALUE_KEY,
    LOOP_NODE_NAME,
    META_NODE_NAME,
    SET_NODE_NAME,
    SET_OUTPUT_NODE_NAME,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { formatEntryLabel, getEntryByName } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import {
    coerceJsonPreviewValue,
    parseFixedPreviewValue,
    parseLiteralPreviewValue,
    setPreviewPathValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/previewValues';
import { createNodalOutputPreview } from '@/Domains/Flow/Pages/FlowEditor/utils/outputPreview';
import { asRecord, withoutContext } from './values';

export interface PreviewScope {
    inputData: unknown;
    outputData: unknown;
    nodeData: unknown;
    runData: unknown;
    contextData: unknown;
}

const previewTypedFieldValue = (value: unknown, valueType: string | undefined) => {
    switch (valueType) {
        case 'number':
            return Number(value);
        case 'boolean':
            return value === true || value === 'true' || value === 1 || value === '1';
        case 'array': {
            const parsed = typeof value === 'string' ? parseLiteralPreviewValue(value) : value;
            return Array.isArray(parsed) ? parsed : [];
        }
        case 'object': {
            const parsed = typeof value === 'string' ? parseLiteralPreviewValue(value) : value;
            return asRecord(parsed) ?? {};
        }
        case 'string':
            return String(value ?? '');
        default:
            return value;
    }
};

export const previewParameterValue = (
    value: NodeParameterValue | undefined,
    scope: PreviewScope,
): unknown => {
    if (!value) return undefined;
    if (value.mode === 'fixed') return parseFixedPreviewValue(value.value);

    if (value.mode === 'expression') {
        const rendered = evaluateExpressionPreview(value.value, scope);
        return rendered.ok ? rendered.value : undefined;
    }

    if (value.mode !== 'object') return undefined;
    if (value.inputMode === 'json') {
        if (value.jsonMode === 'expression') {
            const rendered = evaluateExpressionPreview(value.value, scope);
            if (!rendered.ok) return undefined;

            try {
                const parsed = typeof rendered.value === 'string'
                    ? JSON.parse(rendered.value || '{}')
                    : rendered.value;
                return coerceJsonPreviewValue(parsed);
            } catch {
                return undefined;
            }
        }

        try {
            return JSON.parse(value.value || '{}');
        } catch {
            return undefined;
        }
    }

    return Object.fromEntries(
        value.fields
            .map(field => [field.key.trim(), field.value, field.valueType] as const)
            .filter(([key]) => Boolean(key))
            .map(([key, fieldValue, valueType]) => [
                key,
                previewTypedFieldValue(previewParameterValue(fieldValue, scope), valueType),
            ]),
    );
};

export const unresolvedNodeResultPreview = (node: CanvasNode) => {
    const label = node.label?.trim() || formatEntryLabel(node.entry);
    const entry = node.system ? null : getEntryByName(node.entry.name);
    if (entry && (entry.name === '$mapElement' || entry.name === '$mapManyElements')) {
        const getters = node.values.getters;
        let keys: string[] = [];
        if (getters?.mode === 'object' && getters.inputMode === 'form') {
            keys = getters.fields.map(field => field.key.trim()).filter(Boolean);
        } else if (getters?.mode === 'object' && getters.inputMode === 'json' && getters.jsonMode !== 'expression') {
            try {
                const parsed = JSON.parse(getters.value || '{}');
                if (asRecord(parsed)) keys = Object.keys(parsed);
            } catch {
                keys = [];
            }
        }
        if (keys.length > 0) {
            const objectPreview = Object.fromEntries(keys.map(key => [key, `[Needs run: ${label}]`]));
            return entry.name === '$mapManyElements' ? [objectPreview] : objectPreview;
        }
    }
    return createNodalOutputPreview(entry, label);
};

const withoutRuntimeInputs = (context: Record<string, unknown> | null) => {
    if (!context) return null;

    const {
        viewportWidth: _viewportWidth,
        viewportHeight: _viewportHeight,
        $viewportWidth: _$viewportWidth,
        $viewportHeight: _$viewportHeight,
        $keyboardSpeed: _$keyboardSpeed,
        ...rest
    } = context;
    return rest;
};

export const mergeOutputContextPreview = (
    latestInputContext: Record<string, unknown> | null,
    autocompleteContext: Record<string, unknown> | null,
    latestOutputContext: Record<string, unknown> | null,
) => ({
    ...(withoutRuntimeInputs(latestInputContext) ?? {}),
    ...(withoutRuntimeInputs(autocompleteContext) ?? {}),
    ...(withoutRuntimeInputs(latestOutputContext) ?? {}),
});

export const mergeOutputInputPreview = (
    latestInput: Record<string, unknown> | null,
    autocompleteInput: Record<string, unknown> | null,
    latestOutputInput: Record<string, unknown> | null,
    nodalPreviewInput: Record<string, unknown> | null,
) => ({
    ...(withoutContext(latestInput) ?? {}),
    ...(withoutContext(autocompleteInput) ?? {}),
    ...(withoutContext(latestOutputInput) ?? {}),
    ...(withoutContext(nodalPreviewInput) ?? {}),
});

export const createExpressionOutputData = (
    latestRun: FlowRun | null,
    staticOutput: Record<string, unknown> | null,
    nodalPreviewOutput: Record<string, unknown> | null,
    isFinallyNode: boolean,
) => {
    const baseOutput = latestRun?.output ?? null;
    const outputRecord = asRecord(baseOutput);

    if (!isFinallyNode) {
        return staticOutput || nodalPreviewOutput
            ? { ...(staticOutput ?? {}), ...(nodalPreviewOutput ?? {}) }
            : outputRecord ? null : baseOutput;
    }

    return {
        ...(staticOutput ?? {}),
        ...(nodalPreviewOutput ?? {}),
        ...(outputRecord ?? {}),
        status: latestRun?.status ?? outputRecord?.status,
    };
};

export const createEffectiveAutocompleteContext = ({
    autocompleteContext,
    latestInput,
    latestOutputInput,
    nodalPreviewInput,
    runPreview,
    outputContextPreview,
    entryName,
    loopMode,
}: {
    autocompleteContext: NodalAutocompleteContext;
    latestInput: Record<string, unknown> | null;
    latestOutputInput: Record<string, unknown> | null;
    nodalPreviewInput: Record<string, unknown> | null;
    runPreview: Record<string, unknown>;
    outputContextPreview: Record<string, unknown>;
    entryName: string;
    loopMode: string | null;
}): NodalAutocompleteContext => ({
    ...autocompleteContext,
    inputData: {
        ...(withoutContext(latestInput) ?? {}),
        ...(withoutContext(autocompleteContext.inputData) ?? {}),
        ...(latestOutputInput ?? {}),
        ...(nodalPreviewInput ?? {}),
    },
    runData: {
        ...runPreview,
        ...(entryName === LOOP_NODE_NAME && loopMode === 'condition'
            ? { $loop: { index: 0 } }
            : {}),
    },
    nodeData: autocompleteContext.nodeData,
    contextData: outputContextPreview,
});

export const createNodeAfterData = ({
    node,
    entry,
    outputVariableValue,
    inputPreview,
    outputPreview,
    runPreview,
    contextPreview,
    nodeData,
}: {
    node: CanvasNode;
    entry: HelpEntryDef;
    outputVariableValue: string;
    inputPreview: Record<string, unknown>;
    outputPreview: unknown;
    runPreview: Record<string, unknown>;
    contextPreview: Record<string, unknown>;
    nodeData: unknown;
}) => {
    const nextInput = { ...inputPreview };
    const nextOutput = { ...(asRecord(outputPreview) ?? {}) };
    const nextRun = { ...runPreview };
    const nextContext = { ...contextPreview };
    const scope: PreviewScope = {
        inputData: inputPreview,
        outputData: outputPreview,
        nodeData,
        runData: runPreview,
        contextData: contextPreview,
    };

    if (outputVariableValue.trim()) {
        setPreviewPathValue(nextRun, outputVariableValue, unresolvedNodeResultPreview(node));
    }

    if (entry.name === '$keyboardSpeed') {
        const speed = Number(previewParameterValue(node.values.keyboardSpeedValue, scope));
        if (Number.isFinite(speed) && speed >= 0) nextInput.$keyboardSpeed = speed;
    } else if (entry.name === '$setViewport') {
        const width = Number(previewParameterValue(node.values.width, scope));
        const height = Number(previewParameterValue(node.values.height, scope));
        if (Number.isFinite(width) && width > 0) nextInput.$viewportWidth = width;
        if (Number.isFinite(height) && height > 0) nextInput.$viewportHeight = height;
    } else if (entry.name === SET_NODE_NAME || entry.name === SET_OUTPUT_NODE_NAME) {
        const variables = asRecord(previewParameterValue(node.values.variables, scope));
        const target = entry.name === SET_NODE_NAME ? nextRun : nextOutput;
        if (variables) {
            Object.entries(variables).forEach(([key, value]) => setPreviewPathValue(target, key, value));
        }
    } else if (entry.name === META_NODE_NAME) {
        const metadata = asRecord(previewParameterValue(node.values.metadata, scope));
        if (metadata) {
            nextContext.meta = { ...(asRecord(nextContext.meta) ?? {}), ...metadata };
        }
    } else if (entry.name === CODE_NODE_NAME) {
        collectCodeRunAssignments(
            normalizeScalarParameterValue(node.values[CODE_NODE_VALUE_KEY]).value,
            nextRun,
        );
    }

    return {
        $input: nextInput,
        $run: nextRun,
        $output: nextOutput,
        $context: nextContext,
    };
};
