import { ALL_HELP_ENTRIES } from './utils/helpCatalog';
import type { IfConditionCategory, NodalGraph, NodalGraphContext, RawNodeParameterValue, ScalarNodeParameterValue } from './Panes/NodalEditorPane/types';
import {
    CODE_NODE_NAME,
    CODE_NODE_VALUE_KEY,
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
    FILTER_NODE_NAME,
    IF_ELSE_NODE_NAME,
    LIMIT_NODE_NAME,
    LOOP_NODE_NAME,
    META_NODE_NAME,
    MERGE_NODE_NAME,
    NO_OP_NODE_NAME,
    NODE_RUN_OUTPUT_KEY,
    SET_NODE_NAME,
    SET_OUTPUT_NODE_NAME,
    STICKY_NOTE_NODE_NAME,
} from './Panes/NodalEditorPane/utils/constants';
import { getEntryByName, getParameterMeta } from './Panes/NodalEditorPane/utils/catalog';
import { formatParameterForCompiler, normalizeParameterValue, normalizeScalarParameterValue } from './Panes/NodalEditorPane/utils/expression';
import { SYSTEM_FUNCTION_NODE_ID } from './Panes/NodalEditorPane/utils/functionGraph';
import { getFunctionArgumentNames } from './Panes/NodalEditorPane/utils/functionArguments';
import { getNodeFlowPortDefinitions, isCallbackFlowPort } from './Panes/NodalEditorPane/utils/flowParameters';
import {
    SYSTEM_RUN_POSITION,
    SYSTEM_TERMINATE_POSITION,
} from './Panes/NodalEditorPane/utils/layout';
import { sanitizeNodeValuesForEntry } from './Panes/NodalEditorPane/utils/nodeValues';

export const SYSTEM_RUN_NODE_ID = '__system_run';
export const SYSTEM_TERMINATE_NODE_ID = '__system_terminate';
export { SYSTEM_FUNCTION_NODE_ID };

const normalizeEdges = (edges: Partial<NodalGraph['edges'][number]>[] | undefined): NodalGraph['edges'] => {
    return (Array.isArray(edges) ? edges : [])
        .filter((edge): edge is Partial<NodalGraph['edges'][number]> & object => typeof edge === 'object' && edge !== null)
        .filter(edge => typeof edge.sourceNodeId === 'string' && typeof edge.targetNodeId === 'string')
        .map(edge => ({
            id: edge.id ?? `${edge.sourceNodeId}:${edge.sourcePort ?? DEFAULT_OUTPUT_PORT}->${edge.targetNodeId}:${edge.targetPort ?? DEFAULT_INPUT_PORT}`,
            sourceNodeId: edge.sourceNodeId!,
            targetNodeId: edge.targetNodeId!,
            sourcePort: edge.sourcePort ?? DEFAULT_OUTPUT_PORT,
            targetPort: edge.targetPort ?? DEFAULT_INPUT_PORT,
        }));
};

const isLegacyReturnNode = (node: Partial<NodalGraph['nodes'][number]>) => (
    node.name === 'Return'
    || node.id === '__system_return'
    || (node as { system?: string }).system === 'return'
);

export const normalizeNodalGraph = (graph: Partial<NodalGraph> | null | undefined): NodalGraph => {
    const rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const nodes = rawNodes
        .filter(node => typeof node === 'object' && node !== null && typeof node.id === 'string' && node.id !== '')
        .filter(node => !isLegacyReturnNode(node))
        .map(node => ({ ...node, values: sanitizeNodeValuesForEntry(getEntryByName(node.name), node.values) }));
    const executableNodeIds = new Set(nodes
        .filter(node => node.kind !== 'stickyNote' && node.name !== STICKY_NOTE_NODE_NAME)
        .map(node => node.id));
    executableNodeIds.add(SYSTEM_RUN_NODE_ID);
    executableNodeIds.add(SYSTEM_TERMINATE_NODE_ID);

    return {
        nodes: (() => {
        const hasRun = nodes.some(node => node.system === 'run' || node.id === SYSTEM_RUN_NODE_ID);
        const hasTerminate = nodes.some(node => node.system === 'terminate' || node.id === SYSTEM_TERMINATE_NODE_ID);

        return [
            ...(hasRun ? [] : [{
                id: SYSTEM_RUN_NODE_ID,
                name: 'RUN',
                ...SYSTEM_RUN_POSITION,
                values: {},
                system: 'run' as const,
            }]),
            ...nodes.map(node => {
                if (node.system === 'run' || node.id === SYSTEM_RUN_NODE_ID) {
                    return {
                        ...node,
                        x: SYSTEM_RUN_POSITION.x,
                        y: typeof node.y === 'number' ? node.y : SYSTEM_RUN_POSITION.y,
                        name: 'RUN',
                        system: 'run' as const,
                    };
                }

                if (node.system === 'terminate' || node.id === SYSTEM_TERMINATE_NODE_ID) {
                    return {
                        ...node,
                        x: SYSTEM_TERMINATE_POSITION.x,
                        y: typeof node.y === 'number' ? node.y : SYSTEM_TERMINATE_POSITION.y,
                        name: 'TERMINATE',
                        system: 'terminate' as const,
                    };
                }

                return node;
            }),
            ...(hasTerminate ? [] : [{
                id: SYSTEM_TERMINATE_NODE_ID,
                name: 'TERMINATE',
                ...SYSTEM_TERMINATE_POSITION,
                values: {},
                system: 'terminate' as const,
            }]),
        ];
        })(),
        edges: normalizeEdges(graph?.edges)
            .filter(edge => executableNodeIds.has(edge.sourceNodeId) && executableNodeIds.has(edge.targetNodeId)),
    };
};

export const normalizeNodalFunctionGraph = (graph: Partial<NodalGraph> | null | undefined): NodalGraph => {
    const rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const legacyReturnNodeIds = new Set(rawNodes
        .filter(isLegacyReturnNode)
        .map(node => node.id));
    const sanitizedNodes = rawNodes
        .filter(node => typeof node === 'object' && node !== null && typeof node.id === 'string' && node.id !== '')
        .filter(node => !legacyReturnNodeIds.has(node.id))
        .filter(node => node.system !== 'run' && node.system !== 'terminate' && node.id !== SYSTEM_RUN_NODE_ID && node.id !== SYSTEM_TERMINATE_NODE_ID)
        .map(node => ({ ...node, values: sanitizeNodeValuesForEntry(getEntryByName(node.name), node.values) }));
    const localNodes = sanitizedNodes.filter(node => node.scopeId);
    const mainNodes = sanitizedNodes.filter(node => !node.scopeId);
    const functionNodeIds = new Set(mainNodes
        .filter(node => node.system === 'function' || node.id === SYSTEM_FUNCTION_NODE_ID)
        .map(node => node.id));
    const existingFunction = mainNodes.find(node => functionNodeIds.has(node.id));
    const nodes = mainNodes.filter(node => !functionNodeIds.has(node.id));
    const functionNode: NodalGraph['nodes'][number] = {
        id: SYSTEM_FUNCTION_NODE_ID,
        name: 'FUNCTION',
        x: SYSTEM_RUN_POSITION.x,
        y: typeof existingFunction?.y === 'number' ? existingFunction.y : SYSTEM_RUN_POSITION.y,
        values: {},
        system: 'function',
    };
    const normalizedNodes = [functionNode, ...nodes, ...localNodes];
    const executableNodeIds = new Set([...nodes, ...localNodes]
        .filter(node => node.kind !== 'stickyNote' && node.name !== STICKY_NOTE_NODE_NAME)
        .map(node => node.id));
    executableNodeIds.add(SYSTEM_FUNCTION_NODE_ID);

    const edges = normalizeEdges(graph?.edges)
        .map(edge => ({
            ...edge,
            sourceNodeId: edge.sourceNodeId === SYSTEM_RUN_NODE_ID || functionNodeIds.has(edge.sourceNodeId)
                ? SYSTEM_FUNCTION_NODE_ID
                : edge.sourceNodeId,
            targetNodeId: functionNodeIds.has(edge.targetNodeId)
                ? SYSTEM_FUNCTION_NODE_ID
                : edge.targetNodeId,
        }))
        .filter(edge => executableNodeIds.has(edge.sourceNodeId) && executableNodeIds.has(edge.targetNodeId));

    return {
        nodes: normalizedNodes,
        edges,
    };
};

const getSignatureArgs = (signature: string) => {
    const match = signature.match(/\((.*)\)/);
    if (!match?.[1]?.trim()) return [];

    return match[1]
        .split(',')
        .map(arg => arg.trim().replace(/\?$/, '').replace(/^\.\.\./, ''))
        .filter(Boolean);
};

const indentCodeNodeSource = (source: string | undefined) => {
    const trimmedEnd = (source ?? '').replace(/\s+$/, '');
    if (!trimmedEnd.trim()) return '    // Empty Code node.';

    return trimmedEnd
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n');
};

const rawValue = (
    values: Record<string, RawNodeParameterValue> | undefined,
    key: string,
    fallback = '',
) => normalizeScalarParameterValue(values?.[key]).value || fallback;

const expressionTemplate = (
    values: Record<string, RawNodeParameterValue> | undefined,
    key: string,
    fallback: string,
) => JSON.stringify(rawValue(values, key, fallback));

const numericExpression = (
    values: Record<string, RawNodeParameterValue> | undefined,
    key: string,
    fallback: string,
) => {
    const value = normalizeParameterValue(values?.[key]);
    return value.mode === 'expression'
        ? `await $renderExpression(${JSON.stringify(value.value || fallback)})`
        : formatParameterForCompiler(value, { awaitExpressions: true });
};

const scalarExpressionSource = (value: ScalarNodeParameterValue | undefined, fallback = 'undefined') => {
    const raw = value?.value?.trim() || fallback;

    if (value?.mode === 'expression') {
        const trimmed = value.value?.trim();
        if (!trimmed) return fallback;
        const parts = [...trimmed.matchAll(/\{\{([\s\S]*?)\}\}/g)];
        const pure = parts.length === 1 && trimmed === parts[0][0] ? parts[0] : null;
        if (pure) return `await (${(pure[1] || '').trim() || fallback})`;
        // Without {{ }} delimiters the value is a plain string, not code.
        if (parts.length === 0) return JSON.stringify(trimmed);
        return `await $renderExpression(${JSON.stringify(trimmed)})`;
    }

    if (/^-?\d+(\.\d+)?$/.test(raw)) return raw;
    if (['true', 'false', 'null', 'undefined'].includes(raw)) return raw;
    if (/^[$[{('"`]/.test(raw)) return raw;
    return JSON.stringify(raw);
};

const emptyCheckSource = (source: string) => `((value) => value == null || value === '' || (Array.isArray(value) && value.length === 0) || (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0))(${source})`;

const compareConditionSource = (category: IfConditionCategory, operator: string, left: string, right: string) => {
    const leftValue = `(${left})`;
    const rightValue = `(${right})`;
    const numberLeft = `Number(${leftValue})`;
    const numberRight = `Number(${rightValue})`;
    const dateLeft = `new Date(${leftValue}).getTime()`;
    const dateRight = `new Date(${rightValue}).getTime()`;

    switch (operator) {
        case 'exists': return `${leftValue} !== undefined && ${leftValue} !== null`;
        case 'doesNotExist': return `${leftValue} === undefined || ${leftValue} === null`;
        case 'isEmpty': return emptyCheckSource(leftValue);
        case 'isNotEmpty': return `!${emptyCheckSource(leftValue)}`;
        case 'isTrue': return `${leftValue} === true`;
        case 'isFalse': return `${leftValue} === false`;
        case 'equals': return category === 'number' ? `${numberLeft} === ${numberRight}` : category === 'dateTime' ? `${dateLeft} === ${dateRight}` : `${leftValue} === ${rightValue}`;
        case 'notEquals': return category === 'number' ? `${numberLeft} !== ${numberRight}` : category === 'dateTime' ? `${dateLeft} !== ${dateRight}` : `${leftValue} !== ${rightValue}`;
        case 'contains': return category === 'array' ? `(Array.isArray(${leftValue}) && ${leftValue}.includes(${rightValue}))` : `String(${leftValue} ?? '').includes(String(${rightValue} ?? ''))`;
        case 'notContains': return category === 'array' ? `(!Array.isArray(${leftValue}) || !${leftValue}.includes(${rightValue}))` : `!String(${leftValue} ?? '').includes(String(${rightValue} ?? ''))`;
        case 'startsWith': return `String(${leftValue} ?? '').startsWith(String(${rightValue} ?? ''))`;
        case 'notStartsWith': return `!String(${leftValue} ?? '').startsWith(String(${rightValue} ?? ''))`;
        case 'endsWith': return `String(${leftValue} ?? '').endsWith(String(${rightValue} ?? ''))`;
        case 'notEndsWith': return `!String(${leftValue} ?? '').endsWith(String(${rightValue} ?? ''))`;
        case 'matchesRegex': return `(new RegExp(String(${rightValue} ?? ''))).test(String(${leftValue} ?? ''))`;
        case 'notMatchesRegex': return `!(new RegExp(String(${rightValue} ?? ''))).test(String(${leftValue} ?? ''))`;
        case 'greaterThan': return `${numberLeft} > ${numberRight}`;
        case 'lessThan': return `${numberLeft} < ${numberRight}`;
        case 'greaterThanOrEqual': return `${numberLeft} >= ${numberRight}`;
        case 'lessThanOrEqual': return `${numberLeft} <= ${numberRight}`;
        case 'after': return `${dateLeft} > ${dateRight}`;
        case 'before': return `${dateLeft} < ${dateRight}`;
        case 'afterOrEqual': return `${dateLeft} >= ${dateRight}`;
        case 'beforeOrEqual': return `${dateLeft} <= ${dateRight}`;
        case 'lengthEquals': return `(Array.isArray(${leftValue}) && ${leftValue}.length === ${numberRight})`;
        case 'lengthNotEquals': return `(Array.isArray(${leftValue}) && ${leftValue}.length !== ${numberRight})`;
        case 'lengthGreaterThan': return `(Array.isArray(${leftValue}) && ${leftValue}.length > ${numberRight})`;
        case 'lengthLessThan': return `(Array.isArray(${leftValue}) && ${leftValue}.length < ${numberRight})`;
        case 'lengthGreaterThanOrEqual': return `(Array.isArray(${leftValue}) && ${leftValue}.length >= ${numberRight})`;
        case 'lengthLessThanOrEqual': return `(Array.isArray(${leftValue}) && ${leftValue}.length <= ${numberRight})`;
        default: return 'false';
    }
};

const ifConditionTemplate = (values: Record<string, RawNodeParameterValue> | undefined) => {
    const value = normalizeParameterValue(values?.condition);
    if (value.mode !== 'if-condition') return expressionTemplate(values, 'condition', '{{ true }}');

    const joiner = value.combinator === 'or' ? ' || ' : ' && ';
    const source = value.rules
        .map(rule => compareConditionSource(
            rule.category,
            rule.operator,
            scalarExpressionSource(rule.left),
            scalarExpressionSource(rule.right, 'undefined'),
        ))
        .map(item => `(${item})`)
        .join(joiner) || 'true';

    return JSON.stringify(`{{ ${source} }}`);
};

const isInternalNodeOutputKey = (key: string, nodeId: string) => {
    if (!key) return false;
    if (key === nodeId) return true;

    return /^\$?[A-Za-z_$][\w$]*-\d{10,}-\d+$/.test(key);
};

const runOutputKey = (
    values: Record<string, RawNodeParameterValue> | undefined,
    nodeId: string,
) => {
    const key = rawValue(values, NODE_RUN_OUTPUT_KEY, '').trim();
    return isInternalNodeOutputKey(key, nodeId) ? '' : key;
};

const assignNodeResult = (indent: string, safeNodeId: string, resultName: string, runKey?: string) => [
    `${indent}$nodes[${safeNodeId}] = ${resultName};`,
    `${indent}$nodes.last = ${resultName};`,
    ...(runKey ? [`${indent}$run[${JSON.stringify(runKey)}] = ${resultName};`] : []),
];

const makeIndent = (level: number) => '    '.repeat(level);
const RESERVED_IDENTIFIERS = new Set([
    'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
    'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
    'new', 'null', 'return', 'static', 'super', 'switch', 'this', 'throw',
    'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
]);
const RUNTIME_IDENTIFIERS = new Set([
    '$page', '$input', '$nodes', '$run', '$output', '$context', '$json',
    '$vars', '$userOutput', '$renderExpression', '$keyboardSpeed',
    '$viewportWidth', '$viewportHeight',
]);
const isValidFunctionArgument = (argument: string) => (
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(argument)
    && !RESERVED_IDENTIFIERS.has(argument)
    && !RUNTIME_IDENTIFIERS.has(argument)
    && !argument.startsWith('__pf')
    && !argument.startsWith('nodeResult')
);
const localFunctionSymbol = (functionId: string) => (
    `__pfLocal_${[...functionId]
        .map(character => character.codePointAt(0)?.toString(16) ?? '0')
        .join('_')}`
);

const injectFlowCallbackSource = (baseSource: string, path: string[], callbackSource: string): string => {
    if (path.length === 0) return callbackSource;

    const [key, ...rest] = path;
    const objectSource = `(__pfValue && typeof __pfValue === 'object' && !Array.isArray(__pfValue) ? __pfValue : {})`;
    const nestedBase = `${objectSource}[${JSON.stringify(key)}]`;
    const nestedSource = injectFlowCallbackSource(nestedBase, rest, callbackSource);

    return `((__pfValue) => ({ ...${objectSource}, ${JSON.stringify(key)}: ${nestedSource} }))(${baseSource})`;
};

interface CompileNodalGraphOptions {
    instrumentRunProgress?: boolean;
    context?: NodalGraphContext;
    functionArguments?: string[];
    functionArgumentBindings?: string[];
    includeLocalFunctions?: boolean;
}

export const compileNodalGraphToCode = (graph: NodalGraph, options: CompileNodalGraphOptions = {}): string => {
    const instrumentRunProgress = options.instrumentRunProgress ?? false;
    const context = options.context ?? 'flow';
    const snapshotGraph = context === 'function'
        ? normalizeNodalFunctionGraph(graph)
        : normalizeNodalGraph(graph);
    const localFunctionRoots = options.includeLocalFunctions === false
        ? []
        : graph.nodes.filter(node => node.system === 'function' && node.scopeId);
    const localScopeIds = new Set(localFunctionRoots.map(node => node.scopeId!));
    const mainGraph = localScopeIds.size === 0
        ? graph
        : {
            nodes: graph.nodes.filter(node => !node.scopeId || !localScopeIds.has(node.scopeId)),
            edges: graph.edges.filter(edge => {
                const sourceNode = graph.nodes.find(node => node.id === edge.sourceNodeId);
                const targetNode = graph.nodes.find(node => node.id === edge.targetNodeId);
                return !sourceNode?.scopeId && !targetNode?.scopeId;
            }),
        };
    const normalized = context === 'function' ? normalizeNodalFunctionGraph(mainGraph) : normalizeNodalGraph(mainGraph);
    const nodesById = new Map(normalized.nodes.map(node => [node.id, node]));
    const outgoing = new Map<string, NodalGraph['edges']>();
    const incoming = new Map<string, NodalGraph['edges']>();

    normalized.edges.forEach(edge => {
        outgoing.set(edge.sourceNodeId, [...(outgoing.get(edge.sourceNodeId) ?? []), edge]);
        incoming.set(edge.targetNodeId, [...(incoming.get(edge.targetNodeId) ?? []), edge]);
    });

    const collectExecutableNodeIds = (startId: string, excludedNodeIds = new Set<string>()) => {
        const executableNodeIds = new Set<string>();
        const visitedNodeIds = new Set<string>();
        const queue = [startId];

        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || visitedNodeIds.has(nodeId)) continue;

            visitedNodeIds.add(nodeId);
            (outgoing.get(nodeId) ?? []).forEach(edge => {
                const targetNode = nodesById.get(edge.targetNodeId);
                if (!targetNode || excludedNodeIds.has(edge.targetNodeId)) return;
                if (!targetNode.system) executableNodeIds.add(edge.targetNodeId);
                queue.push(edge.targetNodeId);
            });
        }

        return executableNodeIds;
    };

    const finallyNodeIds = context === 'flow' ? collectExecutableNodeIds(SYSTEM_TERMINATE_NODE_ID) : new Set<string>();
    const entryNodeId = context === 'function' ? SYSTEM_FUNCTION_NODE_ID : SYSTEM_RUN_NODE_ID;
    const runNodeIds = collectExecutableNodeIds(entryNodeId, finallyNodeIds);

    const nextNodeId = (nodeId: string, port = DEFAULT_OUTPUT_PORT) => {
        return outgoing.get(nodeId)?.find(edge => (edge.sourcePort ?? DEFAULT_OUTPUT_PORT) === port)?.targetNodeId ?? null;
    };

    const reachableNodes = (startId: string | null): Set<string> => {
        const seen = new Set<string>();
        const visit = (nodeId: string | null) => {
            if (!nodeId || seen.has(nodeId)) return;
            seen.add(nodeId);
            for (const edge of outgoing.get(nodeId) ?? []) {
                visit(edge.targetNodeId);
            }
        };

        visit(startId);
        return seen;
    };

    const findCommonMerge = (leftStart: string | null, rightStart: string | null) => {
        if (!leftStart || !rightStart) return null;
        if (leftStart === rightStart) return leftStart;
        const rightReachable = reachableNodes(rightStart);
        // BFS from the left branch: the first node also reachable from the right
        // branch is the convergence point, whether or not it is a Merge node.
        // Compiling it after the if/else keeps shared downstream nodes out of
        // a single branch.
        const queue = [leftStart];
        const seen = new Set<string>();
        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || seen.has(nodeId)) continue;
            seen.add(nodeId);
            if (rightReachable.has(nodeId)) return nodeId;
            for (const edge of outgoing.get(nodeId) ?? []) {
                queue.push(edge.targetNodeId);
            }
        }
        return null;
    };

    const compiledCounters = { result: 0, loop: 0 };
    const lineMarker = (indent: string) => `${indent}__nopRunLine(__NOP_LINE__);`;
    const markNodeStart = (indent: string, nodeId: string) => instrumentRunProgress ? [
        `${indent}__nopRunNodeStart(${nodeId});`,
    ] : [];
    const markNodeEnd = (indent: string, nodeId: string) => instrumentRunProgress ? [`${indent}__nopRunNodeEnd(${nodeId});`] : [];
    const shouldMarkCompiledLine = (stripped: string) => {
        const trimmed = stripped.trim();
        if (!trimmed || trimmed.startsWith('*')) return false;
        if (trimmed.startsWith('__nopRun')) return false;
        if (/^(?:\}|\{|\)|\]|else\b|catch\b|finally\b|case\b|default\b)/.test(trimmed)) return false;

        return /^(await|return|const|let|var|if|for|while|throw|try|switch|break|continue|delete|void)\b/.test(trimmed)
            || /^[\w$.[\]]+\s*(?:=(?!=)|\+=|-=|\*=|\/=|\?\?=|\|\|=|&&=|\+\+|--)/.test(trimmed)
            || /^(?:await\s+)?[\w$.[\]]+\s*\(/.test(trimmed);
    };
    const startsNestedFunctionBlock = (stripped: string): boolean => {
        if (!stripped.includes('{')) return false;
        if (/\b(?:async\s+)?function\b/.test(stripped)) return true;
        return /=>\s*\{/.test(stripped);
    };
    const isContinuationLine = (stripped: string): boolean => {
        const trimmed = stripped.trim();
        if (!trimmed) return false;
        return /^(?:\.|\?|:|&&|\|\||[+\-*/%]=?\s|=>|,|\)|\])/.test(trimmed);
    };
    const endsWithOperator = (stripped: string): boolean => {
        const trimmed = stripped.trimEnd();
        if (!trimmed) return false;
        return /(?:&&|\|\||\?\?|[+\-*/%^&|]|={1,3}|!==?|<=?|>=?|=>|\?|:|\.|,|\bin\b|\bof\b|\binstanceof\b|\btypeof\b|\bnew\b|\breturn\b|\bawait\b)$/.test(trimmed);
    };
    const endsWithBracelessControlHeader = (stripped: string): boolean => {
        const trimmed = stripped.trimEnd();
        if (!trimmed || trimmed.endsWith('{') || trimmed.endsWith(';') || trimmed.endsWith('}')) return false;
        if (/\b(?:if|for|while)\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*$/.test(trimmed)) return true;
        return /(?:^|\W)(?:else|do)\s*$/.test(trimmed);
    };
    // Marker injection mirrors app/Services/Flow/RunProgressInstrumenter.php:
    // a scanner blanks string/template/comment contents so brace and paren
    // counting stays accurate, and markers are never inserted inside
    // multi-line expressions or brace-less control-flow bodies.
    const markCompiledLines = (compiledLines: string[]) => {
        if (!instrumentRunProgress) return compiledLines;

        const output: string[] = [];
        let braceDepth = 0;
        let exprDepth = 0;
        let nestedFunctionDepth: number | null = null;
        let pendingControlHeader = false;
        let openExprIsControlHeader = false;
        let prevEndsWithOperator = false;
        let inBlockComment = false;
        const templateStack: ('template' | 'interp')[] = [];

        const stripNonCode = (line: string): string => {
            let result = '';
            let i = 0;
            let inLineComment = false;
            let stringDelimiter: string | null = null;

            while (i < line.length) {
                const char = line[i];
                const next = i + 1 < line.length ? line[i + 1] : '';

                if (inLineComment) {
                    result += ' ';
                    i++;
                    continue;
                }
                if (inBlockComment) {
                    if (char === '*' && next === '/') {
                        inBlockComment = false;
                        result += '  ';
                        i += 2;
                        continue;
                    }
                    result += ' ';
                    i++;
                    continue;
                }
                if (stringDelimiter != null) {
                    if (char === '\\') {
                        result += '  ';
                        i += 2;
                        continue;
                    }
                    if (char === stringDelimiter) stringDelimiter = null;
                    result += ' ';
                    i++;
                    continue;
                }
                if (templateStack[templateStack.length - 1] === 'template') {
                    if (char === '\\') {
                        result += '  ';
                        i += 2;
                        continue;
                    }
                    if (char === '`') {
                        templateStack.pop();
                        result += ' ';
                        i++;
                        continue;
                    }
                    if (char === '$' && next === '{') {
                        templateStack.push('interp');
                        result += '  ';
                        i += 2;
                        continue;
                    }
                    result += ' ';
                    i++;
                    continue;
                }
                if (char === '/' && next === '/') {
                    inLineComment = true;
                    result += '  ';
                    i += 2;
                    continue;
                }
                if (char === '/' && next === '*') {
                    inBlockComment = true;
                    result += '  ';
                    i += 2;
                    continue;
                }
                if (char === "'" || char === '"') {
                    stringDelimiter = char;
                    result += ' ';
                    i++;
                    continue;
                }
                if (char === '`') {
                    templateStack.push('template');
                    result += ' ';
                    i++;
                    continue;
                }
                if (char === '}' && templateStack[templateStack.length - 1] === 'interp') {
                    templateStack.pop();
                    result += ' ';
                    i++;
                    continue;
                }
                result += char;
                i++;
            }

            return result;
        };

        const count = (text: string, char: string) => text.split(char).length - 1;

        compiledLines.flatMap(lineBlock => lineBlock.split('\n')).forEach(line => {
            const startedInsideNonCode = inBlockComment || templateStack.length > 0;
            const stripped = stripNonCode(line);

            const opens = count(stripped, '{');
            const closes = count(stripped, '}');
            const parenDelta = count(stripped, '(') - count(stripped, ')') + count(stripped, '[') - count(stripped, ']');
            const exprDepthAfter = Math.max(0, exprDepth + parenDelta);
            const startsNestedFunction = startsNestedFunctionBlock(stripped);
            const insideNestedFunction = nestedFunctionDepth != null && braceDepth >= nestedFunctionDepth;

            const markLine = exprDepth === 0
                && !startedInsideNonCode
                && !insideNestedFunction
                && !pendingControlHeader
                && !prevEndsWithOperator
                && !isContinuationLine(stripped)
                && shouldMarkCompiledLine(stripped);

            if (markLine) {
                const indent = line.match(/^\s*/)?.[0] ?? '';
                output.push(lineMarker(indent));
            }
            output.push(line);

            if (stripped.trim()) {
                prevEndsWithOperator = endsWithOperator(stripped);
            }

            if (!startedInsideNonCode && stripped.trim()) {
                if (exprDepth === 0 && exprDepthAfter > 0) {
                    openExprIsControlHeader = /\b(?:if|for|while)\s*\(/.test(stripped);
                } else if (exprDepth > 0 && exprDepthAfter === 0) {
                    pendingControlHeader = openExprIsControlHeader && !stripped.trimEnd().endsWith('{');
                    openExprIsControlHeader = false;
                } else if (exprDepthAfter === 0) {
                    pendingControlHeader = endsWithBracelessControlHeader(stripped);
                }
            }

            if (startsNestedFunction) {
                const functionDepth = braceDepth + opens - closes;
                if (functionDepth > braceDepth) nestedFunctionDepth = functionDepth;
            }
            exprDepth = exprDepthAfter;
            braceDepth += opens - closes;
            if (nestedFunctionDepth != null && braceDepth < nestedFunctionDepth) {
                nestedFunctionDepth = null;
            }
        });

        return output;
    };
    const nextResultName = () => `nodeResult${++compiledCounters.result}`;

    const compileFrom = (
        nodeId: string | null,
        indentLevel: number,
        visited: Set<string>,
        stopAtNodeId: string | null = null,
        allowedNodeIds: Set<string> | null = null,
    ): string[] => {
        if (!nodeId || nodeId === stopAtNodeId) return [];
        const node = nodesById.get(nodeId);
        if (!node || node.system === 'terminate') return [];
        if (allowedNodeIds && !allowedNodeIds.has(nodeId)) return [];
        if (!allowedNodeIds && finallyNodeIds.has(nodeId)) return [];
        const indent = makeIndent(indentLevel);
        const safeNodeId = JSON.stringify(node.id);

        if (visited.has(nodeId)) {
            return [`${indent}// Skipping already compiled node ${node.id}.`];
        }

        const nextVisited = new Set(visited);
        nextVisited.add(nodeId);

        if (node.deactivated) {
            const continuationNodeId = node.name === LOOP_NODE_NAME
                ? nextNodeId(node.id, 'done')
                : node.name === IF_ELSE_NODE_NAME
                    ? nextNodeId(node.id, 'true')
                    : nextNodeId(node.id);
            return [
                `${indent}// Deactivated node: ${node.id}`,
                ...compileFrom(continuationNodeId, indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === CODE_NODE_NAME) {
            const code = normalizeScalarParameterValue(node.values?.[CODE_NODE_VALUE_KEY]).value;
            return [
                `${indent}// Code node: ${node.id}`,
                ...markNodeStart(indent, safeNodeId),
                indentCodeNodeSource(code).split('\n').map(line => `${indent}${line.trimStart()}`).join('\n'),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === NO_OP_NODE_NAME) {
            return [
                `${indent}// No-op node: ${node.id}`,
                ...markNodeStart(indent, safeNodeId),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === IF_ELSE_NODE_NAME) {
            const trueStart = nextNodeId(node.id, 'true');
            const falseStart = nextNodeId(node.id, 'false');
            const mergeNodeId = findCommonMerge(trueStart, falseStart);
            const lines = [
                `${indent}if (await $renderExpression(${ifConditionTemplate(node.values)})) {`,
                ...compileFrom(trueStart, indentLevel + 1, nextVisited, mergeNodeId, allowedNodeIds),
                `${indent}} else {`,
                ...compileFrom(falseStart, indentLevel + 1, nextVisited, mergeNodeId, allowedNodeIds),
                `${indent}}`,
            ];

            return [
                ...markNodeStart(indent, safeNodeId),
                ...lines,
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(mergeNodeId, indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === LOOP_NODE_NAME) {
            const mode = rawValue(node.values, 'mode', 'items');
            const bodyStart = nextNodeId(node.id, 'loop');
            const doneStart = nextNodeId(node.id, 'done');
            const maxIterations = numericExpression(node.values, 'maxIterations', '100');
            const loopIndex = ++compiledCounters.loop;
            const previousLoopName = `previousLoop${loopIndex}`;
            const loopLines: string[] = [];

            if (mode === 'iterations') {
                loopLines.push(
                    `${indent}const ${previousLoopName} = $run.$loop;`,
                    `${indent}for (let loopIndex${loopIndex} = 0, maxLoop${loopIndex} = Number(${numericExpression(node.values, 'iterations', '1')}) || 0; loopIndex${loopIndex} < maxLoop${loopIndex}; loopIndex${loopIndex} += 1) {`,
                    `${indent}    const $item = loopIndex${loopIndex};`,
                    `${indent}    const $index = loopIndex${loopIndex};`,
                    `${indent}    $run.$loop = { index: $index };`,
                    ...compileFrom(bodyStart, indentLevel + 1, nextVisited, doneStart, allowedNodeIds),
                    `${indent}}`,
                    `${indent}if (${previousLoopName} === undefined) delete $run.$loop; else $run.$loop = ${previousLoopName};`,
                );
            } else if (mode === 'condition') {
                loopLines.push(
                    `${indent}const ${previousLoopName} = $run.$loop;`,
                    `${indent}for (let loopIndex${loopIndex} = 0, maxLoop${loopIndex} = Number(${maxIterations}) || 100; loopIndex${loopIndex} < maxLoop${loopIndex}; loopIndex${loopIndex} += 1) {`,
                    `${indent}    const $item = loopIndex${loopIndex};`,
                    `${indent}    const $index = loopIndex${loopIndex};`,
                    `${indent}    $run.$loop = { index: $index };`,
                    `${indent}    if (await $renderExpression(${expressionTemplate(node.values, 'condition', '{{ false }}')})) break;`,
                    ...compileFrom(bodyStart, indentLevel + 1, nextVisited, doneStart, allowedNodeIds),
                    `${indent}}`,
                    `${indent}if (${previousLoopName} === undefined) delete $run.$loop; else $run.$loop = ${previousLoopName};`,
                );
            } else {
                loopLines.push(
                    `${indent}const loopItems${loopIndex} = await $renderExpression(${expressionTemplate(node.values, 'items', '{{ [] }}')});`,
                    `${indent}const ${previousLoopName} = $run.$loop;`,
                    `${indent}for (const [$index, $item] of (Array.isArray(loopItems${loopIndex}) ? loopItems${loopIndex} : []).entries()) {`,
                    `${indent}    $run.$loop = { index: $index, item: $item };`,
                    ...compileFrom(bodyStart, indentLevel + 1, nextVisited, doneStart, allowedNodeIds),
                    `${indent}}`,
                    `${indent}if (${previousLoopName} === undefined) delete $run.$loop; else $run.$loop = ${previousLoopName};`,
                );
            }

            return [
                ...markNodeStart(indent, safeNodeId),
                ...loopLines,
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(doneStart, indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === FILTER_NODE_NAME) {
            const resultName = nextResultName();
            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName}Source = await $renderExpression(${expressionTemplate(node.values, 'array', '{{ [] }}')});`,
                `${indent}const ${resultName} = [];`,
                `${indent}for (const [$index, $item] of (Array.isArray(${resultName}Source) ? ${resultName}Source : []).entries()) {`,
                `${indent}    if (await $renderExpression(${expressionTemplate(node.values, 'predicate', '{{ true }}')}, { $item, $index })) ${resultName}.push($item);`,
                `${indent}}`,
                ...assignNodeResult(indent, safeNodeId, resultName, runOutputKey(node.values, node.id)),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === LIMIT_NODE_NAME) {
            const resultName = nextResultName();
            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName}Source = await $renderExpression(${expressionTemplate(node.values, 'array', '{{ [] }}')});`,
                `${indent}const ${resultName}Offset = Number(${numericExpression(node.values, 'offset', '0')}) || 0;`,
                `${indent}const ${resultName}Count = Number(${numericExpression(node.values, 'count', '10')}) || 10;`,
                `${indent}const ${resultName} = (Array.isArray(${resultName}Source) ? ${resultName}Source : []).slice(${resultName}Offset, ${resultName}Offset + ${resultName}Count);`,
                ...assignNodeResult(indent, safeNodeId, resultName, runOutputKey(node.values, node.id)),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === SET_NODE_NAME) {
            const resultName = nextResultName();
            const legacyKey = rawValue(node.values, 'key', '').trim();
            const variablesSource = node.values?.variables
                ? formatParameterForCompiler(node.values.variables, { awaitExpressions: true })
                : `{ ${JSON.stringify(legacyKey || 'variableName')}: ${formatParameterForCompiler(node.values?.value, { awaitExpressions: true })} }`;
            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName} = ${variablesSource};`,
                `${indent}Object.entries(${resultName} && typeof ${resultName} === 'object' && !Array.isArray(${resultName}) ? ${resultName} : {}).forEach(([key, value]) => { $run[key] = value; });`,
                ...assignNodeResult(indent, safeNodeId, resultName),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === SET_OUTPUT_NODE_NAME) {
            const resultName = nextResultName();
            const legacyKey = rawValue(node.values, 'keyOrObject', '').trim();
            const variablesSource = node.values?.variables
                ? formatParameterForCompiler(node.values.variables, { awaitExpressions: true })
                : `{ ${JSON.stringify(legacyKey || 'outputName')}: ${formatParameterForCompiler(node.values?.value, { awaitExpressions: true })} }`;

            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName} = ${variablesSource};`,
                `${indent}if (${resultName} && typeof ${resultName} === 'object' && !Array.isArray(${resultName})) {`,
                `${indent}    Object.entries(${resultName}).forEach(([key, value]) => { $output[key] = value; });`,
                `${indent}    Object.entries(${resultName}).forEach(([key, value]) => { $userOutput[key] = value; });`,
                `${indent}    $setOutput(${resultName});`,
                `${indent}}`,
                ...assignNodeResult(indent, safeNodeId, resultName),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === META_NODE_NAME) {
            const resultName = nextResultName();
            const legacyKey = rawValue(node.values, 'metadataKey', '').trim();
            const metadataSource = node.values?.metadata
                ? formatParameterForCompiler(node.values.metadata, { awaitExpressions: true })
                : `{ ${JSON.stringify(legacyKey || 'metadataKey')}: ${formatParameterForCompiler(node.values?.metadataValue, { awaitExpressions: true })} }`;

            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName} = ${metadataSource};`,
                `${indent}if (${resultName} && typeof ${resultName} === 'object' && !Array.isArray(${resultName})) {`,
                `${indent}    $meta(${resultName});`,
                `${indent}}`,
                ...assignNodeResult(indent, safeNodeId, resultName, runOutputKey(node.values, node.id)),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.name === MERGE_NODE_NAME) {
            const resultName = nextResultName();
            const sources = (incoming.get(node.id) ?? []).map(edge => `$nodes[${JSON.stringify(edge.sourceNodeId)}]`);
            const strategy = rawValue(node.values, 'strategy', 'append');
            const mergedSource = strategy === 'objectAssign'
                ? `Object.assign({}, ...[${sources.join(', ')}].filter(item => item && typeof item === 'object' && !Array.isArray(item)))`
                : strategy === 'firstNonEmpty'
                    ? `[${sources.join(', ')}].find(item => Array.isArray(item) ? item.length > 0 : item != null)`
                    : `[${sources.join(', ')}].flatMap(item => Array.isArray(item) ? item : item == null ? [] : [item])`;

            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName} = ${mergedSource};`,
                ...assignNodeResult(indent, safeNodeId, resultName, runOutputKey(node.values, node.id)),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (node.localFunctionId) {
            const args = node.callArguments ?? Object.keys(node.values ?? {})
                .filter(key => key !== NODE_RUN_OUTPUT_KEY);
            const callArgs = args
                .map(arg => formatParameterForCompiler(node.values?.[arg], { awaitExpressions: true }))
                .join(', ');
            const resultName = nextResultName();
            return [
                ...markNodeStart(indent, safeNodeId),
                `${indent}const ${resultName} = await ${localFunctionSymbol(node.localFunctionId)}($page${callArgs ? `, ${callArgs}` : ''});`,
                ...assignNodeResult(indent, safeNodeId, resultName, runOutputKey(node.values, node.id)),
                ...markNodeEnd(indent, safeNodeId),
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        if (!/^[A-Za-z_$][\w$]*$/.test(node.name)) {
            return [
                `${indent}// Skipping node ${node.id}: invalid helper name.`,
                ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
            ];
        }

        const entry = ALL_HELP_ENTRIES.find(item => item.name === node.name);
        const args = node.name.startsWith('$$') && !entry
            ? node.callArguments?.length
                ? node.callArguments
                : Object.keys(node.values ?? {}).filter(key => key !== NODE_RUN_OUTPUT_KEY)
            : getSignatureArgs(entry?.signature ?? `${node.name}()`);
        const callbackPorts = getNodeFlowPortDefinitions(entry).filter(isCallbackFlowPort);
        const continueStart = nextNodeId(node.id);
        const callArgs = args
            .map(arg => arg.replace(/\?$/, '').replace(/^\.\.\./, ''))
            .map(arg => {
                let source = formatParameterForCompiler(node.values?.[arg], {
                    awaitExpressions: true,
                    valueType: entry ? getParameterMeta(entry, arg).valueType : undefined,
                });

                for (const callbackPort of callbackPorts.filter(candidate => candidate.parameter.argument === arg)) {
                    const { parameter } = callbackPort;
                    const flowStart = nextNodeId(node.id, callbackPort.id);
                    if (!flowStart) continue;

                    const convergenceNodeId = findCommonMerge(flowStart, continueStart);
                    const callbackLines = compileFrom(
                        flowStart,
                        indentLevel + 1,
                        nextVisited,
                        convergenceNodeId,
                        allowedNodeIds,
                    );
                    const callbackSource = `async () => {\n${callbackLines.length
                        ? callbackLines.join('\n')
                        : `${makeIndent(indentLevel + 1)}// Empty ${callbackPort.label} flow.`}\n${indent}}`;
                    source = injectFlowCallbackSource(
                        source,
                        parameter.path.slice(1),
                        callbackSource,
                    );
                }

                return source;
            })
            .join(', ');
        const resultName = nextResultName();

        return [
            ...markNodeStart(indent, safeNodeId),
            `${indent}const ${resultName} = await ${node.name}(${callArgs});`,
            ...assignNodeResult(indent, safeNodeId, resultName, runOutputKey(node.values, node.id)),
            ...markNodeEnd(indent, safeNodeId),
            ...compileFrom(nextNodeId(node.id), indentLevel, nextVisited, stopAtNodeId, allowedNodeIds),
        ];
    };

    const lines = markCompiledLines(compileFrom(nextNodeId(entryNodeId), 1, new Set(), null, runNodeIds));
    const finallyStartNodeIds = [...finallyNodeIds]
        .filter(nodeId => !(incoming.get(nodeId) ?? []).some(edge => finallyNodeIds.has(edge.sourceNodeId)))
        .sort((left, right) => {
            const leftNode = nodesById.get(left);
            const rightNode = nodesById.get(right);
            if (!leftNode || !rightNode) return 0;
            if (leftNode.y !== rightNode.y) return leftNode.y - rightNode.y;
            return leftNode.x - rightNode.x;
        });
    const finallyLines = markCompiledLines(finallyStartNodeIds.flatMap(nodeId => compileFrom(nodeId, 1, new Set(), null, finallyNodeIds)));

    const graphJson = JSON.stringify(snapshotGraph, null, 2)
        .split('\n')
        .map(line => `// ${line}`)
        .join('\n');
    const localFunctionDeclarations: string = localFunctionRoots.map((functionNode): string => {
        const scopeId = functionNode.scopeId!;
        const scopedNodeIds = new Set(graph.nodes
            .filter(node => node.scopeId === scopeId)
            .map(node => node.id));
        const scopedGraph: NodalGraph = {
            nodes: graph.nodes
                .filter(node => scopedNodeIds.has(node.id))
                .map(node => ({ ...node, scopeId: undefined })),
            edges: graph.edges.filter(edge => (
                scopedNodeIds.has(edge.sourceNodeId) && scopedNodeIds.has(edge.targetNodeId)
            )),
        };
        const args = (functionNode.callArguments?.length
            ? functionNode.callArguments
            : getFunctionArgumentNames(functionNode.values?.arguments))
            .map(argument => argument.trim())
            .filter(isValidFunctionArgument)
            .filter((argument, index, all) => all.indexOf(argument) === index);
        const argumentBindings = args.map((_, index) => `__pfArg${index}`);
        const body: string = compileNodalGraphToCode(scopedGraph, {
            context: 'function',
            functionArguments: args,
            functionArgumentBindings: argumentBindings,
            includeLocalFunctions: false,
            instrumentRunProgress,
        });
        return `async function ${localFunctionSymbol(functionNode.id)}($page${argumentBindings.length ? `, ${argumentBindings.join(', ')}` : ''}) {\n${body
            .split('\n')
            .map((line: string) => line ? `    ${line}` : '')
            .join('\n')}\n}`;
    }).join('\n\n');

    if (context === 'function') {
        const functionArguments = (options.functionArguments ?? [])
            .filter(isValidFunctionArgument)
            .filter((argument, index, all) => all.indexOf(argument) === index);
        const inputObject = functionArguments.length > 0
            ? `{ ${functionArguments.map((argument, index) => (
                `${JSON.stringify(argument)}: ${options.functionArgumentBindings?.[index] ?? argument}`
            )).join(', ')} }`
            : '{}';

        return `// Generated from visual snippet graph.
// Nodal graph snapshot:
${graphJson}

${localFunctionDeclarations ? `${localFunctionDeclarations}\n\n` : ''}const $input = ${inputObject};
const $context = $input && typeof $input.$context === 'object' ? $input.$context : {};
const $output = {};
const $nodes = {};
const $run = {};
const $userOutput = {};
const $renderExpression = async (template, $locals = {}) => {
    const $scope = {
        ...($output && typeof $output === 'object' ? $output : {}),
        ...($run && typeof $run === 'object' ? $run : {}),
        $input,
        $nodes,
        $run,
        $context,
        $viewportWidth,
        $viewportHeight,
        ...($locals && typeof $locals === 'object' ? $locals : {}),
    };
    const renderSource = (source) => Function('$input', '$page', '$output', '$nodes', '$run', '$context', '$vars', '$viewportWidth', '$viewportHeight', '$scope', 'with ($scope) { return (async () => (' + source + '))(); }')($input, $page, $output, $nodes, $run, $context, typeof $vars === 'function' ? $vars : undefined, $viewportWidth, $viewportHeight, $scope);
    const templateParts = [...template.matchAll(/\\{\\{([\\s\\S]*?)\\}\\}/g)];
    const pureExpression = templateParts.length === 1 && template.trim() === templateParts[0][0] ? templateParts[0] : null;

    if (pureExpression) return await renderSource((pureExpression[1] || '').trim() || 'undefined');
    if (templateParts.length === 0) return template.trim() ? template : undefined;
    let renderedTemplate = '';
    let lastIndex = 0;
    for (const part of templateParts) {
        renderedTemplate += template.slice(lastIndex, part.index);
        const rendered = await renderSource((part[1] || '').trim() || 'undefined');
        renderedTemplate += rendered == null ? '' : String(rendered);
        lastIndex = (part.index ?? 0) + part[0].length;
    }
    return renderedTemplate + template.slice(lastIndex);
};
${lines.length ? lines.join('\n') : '    // Add and connect nodes from FUNCTION to generate executable steps.'}
    return $output;
`;
    }

    const compiledCode = `// Generated from visual flow graph.
// Nodal graph snapshot:
${graphJson}

${localFunctionDeclarations ? `${localFunctionDeclarations}\n\n` : ''}async function run($page, $input) {
    if (!$input || typeof $input !== 'object') $input = {};
    const $context = $input && typeof $input.$context === 'object' ? $input.$context : {};
    const $output = {};
    const $nodes = {};
    const $run = {};
    const $userOutput = {};
    const $renderExpression = async (template, $locals = {}) => {
        const $scope = {
            ...($output && typeof $output === 'object' ? $output : {}),
            ...($input && typeof $input === 'object' ? $input : {}),
            ...($run && typeof $run === 'object' ? $run : {}),
            $nodes,
            $run,
            $context,
            $viewportWidth,
            $viewportHeight,
            ...($locals && typeof $locals === 'object' ? $locals : {}),
        };
        const renderSource = (source) => Function('$input', '$page', '$output', '$nodes', '$run', '$context', '$vars', '$viewportWidth', '$viewportHeight', '$scope', 'with ($scope) { return (async () => (' + source + '))(); }')($input, $page, $output, $nodes, $run, $context, typeof $vars === 'function' ? $vars : undefined, $viewportWidth, $viewportHeight, $scope);
        const templateParts = [...template.matchAll(/\\{\\{([\\s\\S]*?)\\}\\}/g)];
        const pureExpression = templateParts.length === 1 && template.trim() === templateParts[0][0] ? templateParts[0] : null;

        if (pureExpression) return await renderSource((pureExpression[1] || '').trim() || 'undefined');
        if (templateParts.length === 0) return template.trim() ? template : undefined;
        let renderedTemplate = '';
        let lastIndex = 0;
        for (const part of templateParts) {
            renderedTemplate += template.slice(lastIndex, part.index);
            const rendered = await renderSource((part[1] || '').trim() || 'undefined');
            renderedTemplate += rendered == null ? '' : String(rendered);
            lastIndex = (part.index ?? 0) + part[0].length;
        }
        return renderedTemplate + template.slice(lastIndex);
    };
${lines.length ? lines.join('\n') : '    // Add and connect nodes from RUN to generate executable steps.'}
    const __nopSerializePreview = (value) => {
        try { return JSON.parse(JSON.stringify(value)); } catch (_) { return undefined; }
    };
    const __nopInputPreview = (() => {
        const input = __nopSerializePreview($input);
        if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
        const { $context: _context, ...rest } = input;
        return rest;
    })();
    const __nopResponse = $generateResponseSuccess('Flow completed');
    if (__nopResponse && typeof __nopResponse === 'object') {
        __nopResponse.__nodal_preview = {
            input: __nopInputPreview,
            output: __nopSerializePreview($userOutput),
            nodes: __nopSerializePreview($nodes),
            run: __nopSerializePreview($run),
        };
    }
    return __nopResponse;
}

async function terminate($page, $input, $output) {
    if (!$input || typeof $input !== 'object') $input = {};
    if (!$output || typeof $output !== 'object') $output = {};
    const $context = $input && typeof $input.$context === 'object' ? $input.$context : {};
    const $nodes = {};
    const $run = {};
    const $userOutput = {};
    const $renderExpression = async (template, $locals = {}) => {
        const $scope = {
            ...($output && typeof $output === 'object' ? $output : {}),
            ...($input && typeof $input === 'object' ? $input : {}),
            ...($run && typeof $run === 'object' ? $run : {}),
            $nodes,
            $run,
            $context,
            $viewportWidth,
            $viewportHeight,
            ...($locals && typeof $locals === 'object' ? $locals : {}),
        };
        const renderSource = (source) => Function('$input', '$page', '$output', '$nodes', '$run', '$context', '$vars', '$viewportWidth', '$viewportHeight', '$scope', 'with ($scope) { return (async () => (' + source + '))(); }')($input, $page, $output, $nodes, $run, $context, typeof $vars === 'function' ? $vars : undefined, $viewportWidth, $viewportHeight, $scope);
        const templateParts = [...template.matchAll(/\\{\\{([\\s\\S]*?)\\}\\}/g)];
        const pureExpression = templateParts.length === 1 && template.trim() === templateParts[0][0] ? templateParts[0] : null;

        if (pureExpression) return await renderSource((pureExpression[1] || '').trim() || 'undefined');
        if (templateParts.length === 0) return template.trim() ? template : undefined;
        let renderedTemplate = '';
        let lastIndex = 0;
        for (const part of templateParts) {
            renderedTemplate += template.slice(lastIndex, part.index);
            const rendered = await renderSource((part[1] || '').trim() || 'undefined');
            renderedTemplate += rendered == null ? '' : String(rendered);
            lastIndex = (part.index ?? 0) + part[0].length;
        }
        return renderedTemplate + template.slice(lastIndex);
    };
${finallyLines.length ? finallyLines.join('\n') : '    // Add nodes to the FINALLY line to generate cleanup steps.'}
}
`;

    if (!instrumentRunProgress) return compiledCode;

    return compiledCode
        .split('\n')
        .map((line, index) => line.replaceAll('__NOP_LINE__', String(index + 1)))
        .join('\n');
};

export const compileNodalGraphToSnippetCode = (graph: NodalGraph, args: string): string => compileNodalGraphToCode(graph, {
    context: 'function',
    functionArguments: args.split(',').map(argument => argument.trim()).filter(Boolean),
});
