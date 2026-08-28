import type { VariableSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import { collectNamedTabsFromCode, DEFAULT_TAB_NAME } from '@/Domains/Flow/Pages/FlowEditor/utils/tabNameSuggestions';
import { createPagePreviewData } from '@/Domains/Flow/Pages/FlowEditor/utils/pageAutocomplete';
import { createNodalOutputPreview } from '@/Domains/Flow/Pages/FlowEditor/utils/outputPreview';
import type { NodalGraph, NodeParameterValue, ObjectFieldValueType, RawNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { evaluateExpressionPreview } from './expression';
import {
    coerceJsonPreviewValue,
    normalizePreviewPath,
    parseFixedPreviewValue,
    parseLiteralPreviewValue,
    setPreviewPathValue,
} from './previewValues';
import { SYSTEM_TERMINATE_POSITION } from './layout';
import { getEntryByName } from './catalog';
import {
    CODE_NODE_NAME,
    CODE_NODE_VALUE_KEY,
    DEFAULT_OUTPUT_PORT,
    LOOP_NODE_NAME,
    META_NODE_NAME,
    NO_OP_NODE_NAME,
    NODE_RUN_OUTPUT_KEY,
    SET_NODE_NAME,
    SET_OUTPUT_NODE_NAME,
} from './constants';
import { getFunctionArgumentNames } from './functionArguments';

export interface NodalAutocompleteContext {
    inputData: Record<string, unknown> | null;
    outputData: Record<string, unknown> | null;
    nodeData: Record<string, unknown> | null;
    runData: Record<string, unknown> | null;
    contextData: Record<string, unknown> | null;
    pageData: Record<string, unknown> | null;
    locals: VariableSuggestion[];
    tabNames: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const edgeSourcePort = (edge: NodalGraph['edges'][number]) => edge.sourcePort ?? DEFAULT_OUTPUT_PORT;

const addPath = (paths: Set<string>, path: string) => {
    const normalized = normalizePreviewPath(path);
    if (!normalized) return;
    paths.add(normalized);
};

const collectObjectPaths = (value: unknown, prefix: string, paths: Set<string>) => {
    if (!isRecord(value)) return;

    Object.entries(value).forEach(([key, item]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        addPath(paths, path);
        collectObjectPaths(item, path, paths);
    });
};

const collectFormFieldPaths = (value: NodeParameterValue, prefix: string, paths: Set<string>) => {
    if (value.mode !== 'object') return;

    value.fields.forEach(field => {
        const key = field.key.trim();
        // Template keys resolve at runtime and cannot become static paths.
        if (!key || key.includes('{{')) return;

        const path = prefix ? `${prefix}.${key}` : key;
        addPath(paths, path);
        collectFormFieldPaths(field.value, path, paths);
    });
};

const collectSetVariablePaths = (value: RawNodeParameterValue | undefined, paths: Set<string>) => {
    if (!value || typeof value === 'string' || value.mode !== 'object') return;

    if (value.inputMode === 'form') {
        collectFormFieldPaths(value, '', paths);
        return;
    }

    try {
        collectObjectPaths(JSON.parse(value.value || '{}'), '', paths);
    } catch {
        // Invalid fixed JSON cannot provide reliable static paths.
    }
};

const isIdentifierStart = (char: string | undefined) => Boolean(char && /[A-Za-z_$]/.test(char));

const isIdentifierChar = (char: string | undefined) => Boolean(char && /[\w$]/.test(char));

const readQuotedString = (source: string, startIndex: number) => {
    const quote = source[startIndex];
    let value = '';
    let index = startIndex + 1;

    while (index < source.length) {
        const char = source[index];
        if (char === '\\') {
            value += source[index + 1] ?? '';
            index += 2;
            continue;
        }

        if (char === quote) return { value, endIndex: index + 1 };
        value += char;
        index += 1;
    }

    return null;
};

const readRunAssignmentPath = (source: string, startIndex: number) => {
    let index = startIndex + '$run'.length;
    const segments: string[] = [];

    while (index < source.length) {
        while (/\s/.test(source[index] ?? '')) index += 1;

        if (source[index] === '.') {
            index += 1;
            while (/\s/.test(source[index] ?? '')) index += 1;
            if (!isIdentifierStart(source[index])) break;

            const segmentStart = index;
            index += 1;
            while (isIdentifierChar(source[index])) index += 1;
            segments.push(source.slice(segmentStart, index));
            continue;
        }

        if (source[index] === '[') {
            index += 1;
            while (/\s/.test(source[index] ?? '')) index += 1;
            if (source[index] !== '"' && source[index] !== "'") break;

            const quoted = readQuotedString(source, index);
            if (!quoted) break;

            index = quoted.endIndex;
            while (/\s/.test(source[index] ?? '')) index += 1;
            if (source[index] !== ']') break;

            segments.push(quoted.value);
            index += 1;
            continue;
        }

        break;
    }

    if (segments.length === 0) return null;

    return {
        path: segments.join('.'),
        endIndex: index,
    };
};

const readAssignmentValue = (source: string, startIndex: number) => {
    let index = startIndex;
    let depth = 0;
    let quote: string | null = null;

    while (index < source.length) {
        const char = source[index];

        if (quote) {
            if (char === '\\') {
                index += 2;
                continue;
            }
            if (char === quote) quote = null;
            index += 1;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            index += 1;
            continue;
        }

        if (char === '(' || char === '[' || char === '{') depth += 1;
        if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
        if ((char === ';' || char === '\n') && depth === 0) break;

        index += 1;
    }

    return {
        value: source.slice(startIndex, index).trim(),
        endIndex: index,
    };
};

const parseCodeAssignmentPreviewValue = (value: string) => {
    const trimmed = value.trim();
    const fixedValue = parseFixedPreviewValue(trimmed);
    if (fixedValue !== trimmed || trimmed === 'undefined') return fixedValue;

    const literalValue = parseLiteralPreviewValue(trimmed);
    return literalValue === undefined ? `[Needs run: ${trimmed}]` : coerceJsonPreviewValue(literalValue);
};

export const collectCodeRunAssignments = (code: string, targetData: Record<string, unknown>) => {
    let index = 0;
    let quote: string | null = null;
    let lineComment = false;
    let blockComment = false;

    while (index < code.length) {
        const char = code[index];

        if (lineComment) {
            if (char === '\n') lineComment = false;
            index += 1;
            continue;
        }

        if (blockComment) {
            if (char === '*' && code[index + 1] === '/') {
                blockComment = false;
                index += 2;
                continue;
            }
            index += 1;
            continue;
        }

        if (quote) {
            if (char === '\\') {
                index += 2;
                continue;
            }
            if (char === quote) quote = null;
            index += 1;
            continue;
        }

        if (char === '/' && code[index + 1] === '/') {
            lineComment = true;
            index += 2;
            continue;
        }

        if (char === '/' && code[index + 1] === '*') {
            blockComment = true;
            index += 2;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            index += 1;
            continue;
        }

        if (code.slice(index, index + '$run'.length) !== '$run') {
            index += 1;
            continue;
        }

        const previousChar = code[index - 1];
        const nextChar = code[index + '$run'.length];
        if (isIdentifierChar(previousChar) || isIdentifierChar(nextChar)) {
            index += '$run'.length;
            continue;
        }

        const assignmentPath = readRunAssignmentPath(code, index);
        if (!assignmentPath) {
            index += '$run'.length;
            continue;
        }

        let operatorIndex = assignmentPath.endIndex;
        while (/\s/.test(code[operatorIndex] ?? '')) operatorIndex += 1;

        if (
            code[operatorIndex] !== '='
            || code[operatorIndex + 1] === '='
            || code[operatorIndex + 1] === '>'
        ) {
            index = assignmentPath.endIndex;
            continue;
        }

        const assignmentValue = readAssignmentValue(code, operatorIndex + 1);
        setPreviewPathValue(targetData, assignmentPath.path, parseCodeAssignmentPreviewValue(assignmentValue.value));
        index = assignmentValue.endIndex;
    }
};

const previewNodeValue = (
    value: RawNodeParameterValue,
    scope: { inputData: Record<string, unknown> | null; outputData?: Record<string, unknown> | null; nodeData?: Record<string, unknown> | null; runData?: Record<string, unknown> | null; contextData?: Record<string, unknown> | null },
): unknown => {
    if (typeof value === 'string') return value;

    if (value.mode === 'fixed') return parseFixedPreviewValue(value.value);

    if (value.mode === 'expression') {
        const rendered = evaluateExpressionPreview(value.value, {
            inputData: scope.inputData,
            outputData: scope.outputData ?? null,
            nodeData: scope.nodeData ?? null,
            runData: scope.runData ?? null,
            contextData: scope.contextData ?? null,
        });

        return rendered.ok ? rendered.value : undefined;
    }

    if (value.mode !== 'object') return undefined;

    if (value.inputMode === 'json') {
        if (value.jsonMode === 'expression') {
            const rendered = evaluateExpressionPreview(value.value, {
                inputData: scope.inputData,
                outputData: scope.outputData ?? null,
                nodeData: scope.nodeData ?? null,
                runData: scope.runData ?? null,
                contextData: scope.contextData ?? null,
            });

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
            .map(field => [previewNodeFieldKey(field.key.trim(), scope), field.value, field.valueType] as const)
            .filter(([key]) => Boolean(key))
            .map(([key, fieldValue, valueType]) => [key, previewTypedFieldValue(previewNodeValue(fieldValue, scope), valueType)]),
    );
};

// Field names may hold {{ }} templates; render them like expression values.
const previewNodeFieldKey = (
    key: string,
    scope: { inputData: Record<string, unknown> | null; outputData?: Record<string, unknown> | null; nodeData?: Record<string, unknown> | null; runData?: Record<string, unknown> | null; contextData?: Record<string, unknown> | null },
): string => {
    if (!key.includes('{{')) return key;

    const rendered = evaluateExpressionPreview(key, {
        inputData: scope.inputData,
        outputData: scope.outputData ?? null,
        nodeData: scope.nodeData ?? null,
        runData: scope.runData ?? null,
        contextData: scope.contextData ?? null,
    });

    return rendered.ok && rendered.value !== null && rendered.value !== undefined
        ? String(rendered.value)
        : '';
};

const previewTypedFieldValue = (value: unknown, valueType: ObjectFieldValueType | undefined) => {
    switch (valueType) {
        case 'number':
            return Number(value);
        case 'boolean':
            return value === true || value === 'true' || value === 1 || value === '1';
        case 'array':
            return Array.isArray(value)
                ? value
                : typeof value === 'string' && Array.isArray(parseLiteralPreviewValue(value))
                    ? parseLiteralPreviewValue(value)
                    : [];
        case 'object':
            return isRecord(value)
                ? value
                : typeof value === 'string' && isRecord(parseLiteralPreviewValue(value))
                    ? parseLiteralPreviewValue(value)
                    : {};
        case 'string':
            return String(value ?? '');
        case 'dateTime':
        default:
            return value;
    }
};

const collectSetVariableContext = (
    value: RawNodeParameterValue | undefined,
    paths: Set<string>,
    targetData: Record<string, unknown> | null,
    scopeInputData: Record<string, unknown> | null,
    scopeOutputData: Record<string, unknown> | null = null,
    scopeRunData: Record<string, unknown> | null = null,
    scopeContextData: Record<string, unknown> | null = null,
) => {
    if (!value || typeof value === 'string' || value.mode !== 'object') return;

    collectSetVariablePaths(value, paths);

    const previewValue = previewNodeValue(value, {
        inputData: scopeInputData,
        outputData: scopeOutputData,
        runData: scopeRunData,
        contextData: scopeContextData,
    });
    if (!isRecord(previewValue)) return;

    collectObjectPaths(previewValue, '', paths);
    Object.entries(previewValue).forEach(([key, item]) => {
        if (!targetData) return;
        setPreviewPathValue(targetData, key, item);
    });
};

const collectMetaContext = (
    values: Record<string, RawNodeParameterValue> | undefined,
    targetData: Record<string, unknown>,
    scopeInputData: Record<string, unknown> | null,
    scopeOutputData: Record<string, unknown> | null = null,
    scopeRunData: Record<string, unknown> | null = null,
    scopeContextData: Record<string, unknown> | null = null,
) => {
    if (!values) return;

    const metaValue = values.metadata;
    const previewValue = metaValue && typeof metaValue !== 'string'
        ? previewNodeValue(metaValue, {
            inputData: scopeInputData,
            outputData: scopeOutputData,
            runData: scopeRunData,
            contextData: scopeContextData,
        })
        : undefined;

    if (isRecord(previewValue)) {
        targetData.meta = {
            ...(isRecord(targetData.meta) ? targetData.meta : {}),
            ...previewValue,
        };
        return;
    }

    const metadataKey = readFixedScalar(values.metadataKey);
    if (!metadataKey) return;

    const metadataValue = values.metadataValue && typeof values.metadataValue !== 'string'
        ? previewNodeValue(values.metadataValue, {
            inputData: scopeInputData,
            outputData: scopeOutputData,
            runData: scopeRunData,
            contextData: scopeContextData,
        })
        : undefined;

    targetData.meta = {
        ...(isRecord(targetData.meta) ? targetData.meta : {}),
        [metadataKey]: metadataValue,
    };
};

const readFixedScalar = (value: RawNodeParameterValue | undefined) => {
    if (!value || typeof value === 'string' || value.mode !== 'fixed') return '';
    return value.value.trim();
};

export function collectDeclaredNamedTabsFromGraph(graph: NodalGraph): string[] {
    const tabNames = new Set([DEFAULT_TAB_NAME]);

    graph.nodes.forEach(node => {
        if (node.system || node.deactivated) return;
        if (node.name === '$gotoUrl') {
            const tabName = readFixedScalar(node.values?.tabName).trim();
            if (tabName) tabNames.add(tabName);
        }
        if (node.name === CODE_NODE_NAME) {
            collectNamedTabsFromCode(readFixedScalar(node.values?.[CODE_NODE_VALUE_KEY]))
                .forEach(tabName => tabNames.add(tabName));
        }
    });

    return [...tabNames];
}

const isInternalNodeOutputKey = (key: string, nodeId: string) => {
    if (!key) return false;
    if (key === nodeId) return true;

    return /^\$?[A-Za-z_$][\w$]*-\d{10,}-\d+$/.test(key);
};

const materializePaths = (paths: Set<string>) => {
    const root: Record<string, unknown> = {};

    [...paths].sort().forEach(path => {
        const segments = path.split('.').filter(Boolean);
        if (segments.length === 0) return;

        let target = root;
        segments.forEach((segment, index) => {
            if (index === segments.length - 1) {
                if (!(segment in target)) target[segment] = undefined;
                return;
            }

            if (!isRecord(target[segment])) target[segment] = {};
            target = target[segment] as Record<string, unknown>;
        });
    });

    return root;
};

const reachableFrom = (
    startId: string | null | undefined,
    outgoing: Map<string, NodalGraph['edges']>,
    stopAtNodeId?: string | null,
) => {
    const seen = new Set<string>();
    const stack = startId ? [startId] : [];

    while (stack.length > 0) {
        const nodeId = stack.pop();
        if (!nodeId || nodeId === stopAtNodeId || seen.has(nodeId)) continue;

        seen.add(nodeId);
        (outgoing.get(nodeId) ?? []).forEach(edge => stack.push(edge.targetNodeId));
    }

    return seen;
};

const reachableInRunOrder = (
    startId: string | null | undefined,
    outgoing: Map<string, NodalGraph['edges']>,
) => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const visit = (nodeId: string | null | undefined) => {
        if (!nodeId || seen.has(nodeId)) return;

        seen.add(nodeId);
        ordered.push(nodeId);
        (outgoing.get(nodeId) ?? []).forEach(edge => visit(edge.targetNodeId));
    };

    visit(startId);
    return ordered;
};

const upstreamInDependencyOrder = (
    targetNodeId: string,
    incoming: Map<string, NodalGraph['edges']>,
) => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    const visit = (nodeId: string) => {
        (incoming.get(nodeId) ?? []).forEach(edge => {
            if (seen.has(edge.sourceNodeId)) return;

            seen.add(edge.sourceNodeId);
            visit(edge.sourceNodeId);
            ordered.push(edge.sourceNodeId);
        });
    };

    visit(targetNodeId);
    return ordered;
};

const unresolvedNodeResultPreview = (node: NodalGraph['nodes'][number]) => {
    const label = node.label?.trim() || node.name || node.id;
    const entry = getEntryByName(node.name);
    if (entry.name === '$mapElement' || entry.name === '$mapManyElements') {
        const getters = node.values?.getters;
        let keys: string[] = [];
        if (getters && typeof getters === 'object' && getters.mode === 'object') {
            if (getters.inputMode === 'form') {
                keys = getters.fields.map(field => field.key.trim()).filter(Boolean);
            } else if (getters.jsonMode !== 'expression') {
                try {
                    const parsed = JSON.parse(getters.value || '{}');
                    if (isRecord(parsed)) keys = Object.keys(parsed);
                } catch {
                    keys = [];
                }
            }
        }
        if (keys.length > 0) {
            const objectPreview = Object.fromEntries(keys.map(key => [key, `[Needs run: ${label}]`]));
            return entry.name === '$mapManyElements' ? [objectPreview] : objectPreview;
        }
    }
    return createNodalOutputPreview(entry, label);
};

const splitDefaultInputs = (defaultInputs: Record<string, unknown> | null) => {
    const source = defaultInputs ?? {};
    const { $context: rawContext, ...inputData } = source;

    return {
        inputData,
        contextData: isRecord(rawContext) ? rawContext : {},
    };
};

export function analyzeNodalAutocompleteContext(
    graph: NodalGraph,
    targetNodeId: string,
    defaultInputs: Record<string, unknown> | null,
): NodalAutocompleteContext {
    const nodesById = new Map(graph.nodes.map(node => [node.id, node]));
    const outgoing = new Map<string, NodalGraph['edges']>();
    const incoming = new Map<string, NodalGraph['edges']>();

    graph.edges.forEach(edge => {
        outgoing.set(edge.sourceNodeId, [...(outgoing.get(edge.sourceNodeId) ?? []), edge]);
        incoming.set(edge.targetNodeId, [...(incoming.get(edge.targetNodeId) ?? []), edge]);
    });

    const targetNode = nodesById.get(targetNodeId);
    const targetScopeId = targetNode?.scopeId;
    const runNodeId = targetScopeId
        ?? graph.nodes.find(node => node.system === 'run' || (node.system === 'function' && !node.scopeId))?.id
        ?? '__system_run';
    const terminateNode = graph.nodes.find(node => node.system === 'terminate');
    const terminateNodeId = terminateNode?.id ?? '__system_terminate';
    const terminateY = terminateNode?.y ?? SYSTEM_TERMINATE_POSITION.y;
    const finallyNodeIds = new Set(terminateNode
        ? graph.nodes
            .filter(node => !node.system && node.y >= terminateY)
            .map(node => node.id)
        : [],
    );
    const finallyQueue = (outgoing.get(terminateNodeId) ?? []).map(edge => edge.targetNodeId);

    while (finallyQueue.length > 0) {
        const nodeId = finallyQueue.shift();
        const node = nodeId ? nodesById.get(nodeId) : null;
        if (!nodeId || !node || node.system || finallyNodeIds.has(nodeId)) continue;

        finallyNodeIds.add(nodeId);
        (outgoing.get(nodeId) ?? []).forEach(edge => finallyQueue.push(edge.targetNodeId));
    }

    const targetIsFinally = !targetScopeId && finallyNodeIds.has(targetNodeId);
    const upstream = new Set<string>();
    const stack = [targetNodeId];

    while (stack.length > 0) {
        const nodeId = stack.pop();
        if (!nodeId) continue;

        (incoming.get(nodeId) ?? []).forEach(edge => {
            if (edge.sourceNodeId === targetNodeId || upstream.has(edge.sourceNodeId)) return;

            upstream.add(edge.sourceNodeId);
            stack.push(edge.sourceNodeId);
        });
    }

    const inputPaths = new Set<string>();
    const outputPaths = new Set<string>();
    const defaults = splitDefaultInputs(defaultInputs);
    const inputData: Record<string, unknown> = { ...defaults.inputData };
    if (targetScopeId) {
        const functionRoot = nodesById.get(targetScopeId);
        getFunctionArgumentNames(functionRoot?.values?.arguments)
            .forEach(argument => {
                if (!(argument in inputData)) inputData[argument] = undefined;
            });
    }
    const outputData: Record<string, unknown> = {};
    const nodeData: Record<string, unknown> = {};
    const runData: Record<string, unknown> = {};
    const contextData: Record<string, unknown> = {
        ...defaults.contextData,
    };
    const tabNames = new Set(collectDeclaredNamedTabsFromGraph(graph));
    const runScopeNodeIds = targetIsFinally
        ? reachableInRunOrder(runNodeId, outgoing).filter(nodeId => !finallyNodeIds.has(nodeId))
        : [];
    const orderedUpstream = [
        ...runScopeNodeIds,
        ...reachableInRunOrder(runNodeId, outgoing).filter(nodeId => upstream.has(nodeId)),
        ...upstreamInDependencyOrder(targetNodeId, incoming).filter(nodeId => upstream.has(nodeId)),
    ].filter((nodeId, index, all) => all.indexOf(nodeId) === index);
    orderedUpstream.forEach(nodeId => {
        const node = nodesById.get(nodeId);
        if (!node || node.system || node.deactivated) return;

        if (node.name === '$keyboardSpeed') {
            const speedValue = node.values?.keyboardSpeedValue
                ? previewNodeValue(node.values.keyboardSpeedValue, {
                    inputData,
                    outputData,
                    runData,
                    contextData,
                    nodeData,
                })
                : undefined;
            const speed = Number(speedValue);
            if (Number.isFinite(speed) && speed >= 0) inputData.$keyboardSpeed = speed;
        }

        if (node.name === '$setViewport') {
            const scope = {
                inputData,
                outputData,
                runData,
                contextData,
                nodeData,
            };
            const widthValue = node.values?.width
                ? previewNodeValue(node.values.width, scope)
                : inputData.$viewportWidth;
            const heightValue = node.values?.height
                ? previewNodeValue(node.values.height, scope)
                : inputData.$viewportHeight;
            const width = Number(widthValue);
            const height = Number(heightValue);
            if (Number.isFinite(width) && width > 0) inputData.$viewportWidth = width;
            if (Number.isFinite(height) && height > 0) inputData.$viewportHeight = height;
        }

        if (node.name === SET_NODE_NAME) {
            const variableValue = node.values?.variables;
            const value = variableValue && typeof variableValue !== 'string' ? previewNodeValue(variableValue, {
                inputData,
                outputData,
                runData,
                contextData,
                nodeData,
            }) : undefined;
            nodeData[node.id] = value;
            nodeData.last = value;
            collectSetVariableContext(node.values?.variables, new Set<string>(), runData, inputData, outputData, runData, contextData);
            return;
        }

        if (node.name === SET_OUTPUT_NODE_NAME) {
            const variableValue = node.values?.variables;
            const value = variableValue && typeof variableValue !== 'string' ? previewNodeValue(variableValue, {
                inputData,
                outputData,
                runData,
                contextData,
                nodeData,
            }) : undefined;
            nodeData[node.id] = value;
            nodeData.last = value;
            collectSetVariableContext(node.values?.variables, outputPaths, outputData, inputData, outputData, runData, contextData);
            return;
        }

        if (node.name === META_NODE_NAME) {
            collectMetaContext(node.values, contextData, inputData, outputData, runData, contextData);
            return;
        }

        if (node.name === CODE_NODE_NAME) {
            const previewValue = unresolvedNodeResultPreview(node);
            nodeData[node.id] = previewValue;
            nodeData.last = previewValue;
            collectCodeRunAssignments(readFixedScalar(node.values?.[CODE_NODE_VALUE_KEY]), runData);
            return;
        }

        if (node.name === NO_OP_NODE_NAME) return;

        nodeData[node.id] = unresolvedNodeResultPreview(node);
        nodeData.last = nodeData[node.id];
        const rawOutputPath = readFixedScalar(node.values?.[NODE_RUN_OUTPUT_KEY]);
        const outputPath = isInternalNodeOutputKey(rawOutputPath, node.id) ? '' : rawOutputPath;
        setPreviewPathValue(runData, outputPath, unresolvedNodeResultPreview(node));
    });

    const locals = new Map<string, VariableSuggestion>();

    graph.nodes.forEach(node => {
        if (node.deactivated || node.name !== LOOP_NODE_NAME || !upstream.has(node.id)) return;

        const bodyStart = outgoing.get(node.id)?.find(edge => edgeSourcePort(edge) === 'loop')?.targetNodeId;
        const doneStart = outgoing.get(node.id)?.find(edge => edgeSourcePort(edge) === 'done')?.targetNodeId;
        if (!reachableFrom(bodyStart, outgoing, doneStart).has(targetNodeId)) return;

        const mode = readFixedScalar(node.values?.mode) || 'items';
        setPreviewPathValue(runData, '$loop.index', 0);

        if (mode === 'items') {
            setPreviewPathValue(runData, '$loop.item', undefined);
        }

        locals.set('$item', { id: '$item', key: '$item', type: 'loop_item' });
        locals.set('$index', { id: '$index', key: '$index', type: 'loop_index' });
    });

    return {
        inputData: {
            ...materializePaths(inputPaths),
            ...inputData,
        },
        outputData: {
            ...materializePaths(outputPaths),
            ...outputData,
        },
        nodeData,
        runData,
        contextData,
        pageData: createPagePreviewData(),
        locals: [...locals.values()],
        tabNames: [...tabNames],
    };
}
