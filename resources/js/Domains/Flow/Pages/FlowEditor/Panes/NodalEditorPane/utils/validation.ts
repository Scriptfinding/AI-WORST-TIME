import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { DataTableColumnType } from '@/Domains/DataTable/types';
import type { NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { getParameterMeta, getSignatureArgs } from './catalog';
import { getLoopParameterKeysForMode, LOOP_NODE_NAME } from './constants';
import { normalizeParameterValue, normalizeScalarParameterValue } from './expression';
import { normalizeHttpUrl } from './site';
import { getFunctionArgumentNames } from './functionArguments';
import { getNodeFlowPortDefinitions, isCallbackFlowPort } from './flowParameters';

export interface DataTableNodeResource {
    id: Id;
    name: string;
    description?: string | null;
    visibility?: string;
    owner?: { id: Id; name: string } | null;
    team?: { id: Id; name: string } | null;
    can_manage: boolean;
    columns: Array<{
        id: Id;
        name: string;
        type: DataTableColumnType;
    }>;
}

export interface NodeValidationResources {
    dataTables?: {
        status: 'loading' | 'loaded' | 'error';
        items: DataTableNodeResource[];
    };
    aiSetup?: {
        status: 'loading' | 'loaded' | 'error';
        hasAiIntegration: boolean;
        hasAiModel: boolean;
    };
    messengerSetup?: {
        status: 'loading' | 'loaded' | 'error';
        hasMessengerIntegration: boolean;
    };
    mailboxSetup?: {
        status: 'loading' | 'loaded' | 'error';
        hasMailboxIntegration: boolean;
        hasMailbox: boolean;
    };
    aiModels?: {
        status: 'loading' | 'loaded' | 'error';
        items: Array<{
            id: Id;
            name: string;
            ai_model_id: string;
            capabilities: Record<string, boolean>;
            scope: string;
            team_name: string | null;
            ai_integration: {
                id: Id;
                name: string;
                provider: string;
            };
        }>;
    };
    channels?: {
        status: 'loading' | 'loaded' | 'error';
        names: ReadonlySet<Id>;
    };
    mailboxWatchers?: {
        status: 'loading' | 'loaded' | 'error';
        names: ReadonlySet<Id>;
    };
}

export function getNodeParameterDisplayLabel(entry: HelpEntryDef, key: string): string {
    const meta = getParameterMeta(entry, key);
    if (entry.name === '$waitForEmail' && key === 'mailboxWatcherId') {
        return 'Mailbox Watcher';
    }
    if ((entry.name === '$aiControl' || entry.name === '$aiMessage') && key === 'aiModelId') {
        return 'AI Model';
    }
    return meta.label ?? key;
}

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
const DATA_TABLE_MUTATION_NODE_NAMES = new Set([
    '$dataTableInsertRow',
    '$dataTableUpdateRows',
    '$dataTableUpsertRows',
    '$dataTableDeleteRows',
    '$dataTableDelete',
    '$dataTableUpdate',
]);

const isValidIdentifier = (value: string) => (
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
    && !RESERVED_IDENTIFIERS.has(value)
    && !RUNTIME_IDENTIFIERS.has(value)
    && !value.startsWith('__pf')
    && !value.startsWith('nodeResult')
);

export interface NodeValidationIssue {
    path: string;
    label: string;
    message: string;
    kind?: 'connect-flow';
}

export function getUnavailableBrowserTabIssue(
    entry: HelpEntryDef,
    values: Record<string, NodeParameterValue>,
    availableTabNames: readonly string[],
): NodeValidationIssue | null {
    if (entry.name !== '$gotoTab') return null;

    const tabName = normalizeScalarParameterValue(values.tabName);
    if (tabName.mode !== 'fixed') return null;

    const normalizedName = tabName.value.trim();
    if (!normalizedName) {
        return {
            path: 'tabName',
            label: 'Tab Name',
            message: 'Select a browser tab.',
        };
    }
    if (availableTabNames.includes(normalizedName)) return null;

    return {
        path: 'tabName',
        label: 'Tab Name',
        message: `Browser tab "${normalizedName}" is not defined in this flow.`,
    };
}

function cleanArgName(arg: string) {
    return arg.replace(/\?$/, '').replace(/^\.\.\./, '');
}

function isOptionalArg(arg: string) {
    return arg.endsWith('?') || arg.startsWith('...');
}

function isEmptyParameterValue(value: NodeParameterValue | undefined): boolean {
    const normalized = normalizeParameterValue(value);

    if (normalized.mode === 'object') {
        if (normalized.inputMode === 'json') {
            const trimmed = normalized.value.trim();
            return trimmed === '' || trimmed === '{}';
        }

        return normalized.fields.length === 0;
    }

    if (normalized.mode === 'if-condition') {
        return normalized.rules.length === 0 || normalized.rules.every(rule => rule.left.value.trim() === '');
    }

    return normalized.value.trim() === '';
}

function objectBooleanValue(value: NodeParameterValue | undefined, key: string): boolean | null {
    const normalized = normalizeParameterValue(value);
    if (normalized.mode !== 'object') return null;
    if (normalized.inputMode === 'json') {
        if (normalized.jsonMode === 'expression') return null;
        try {
            const parsed: unknown = JSON.parse(normalized.value || '{}');
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;

            return (parsed as Record<string, unknown>)[key] === true;
        } catch {
            return false;
        }
    }
    const field = normalized.fields.find(candidate => candidate.key === key);

    return field ? normalizeScalarParameterValue(field.value).value === 'true' : false;
}

/**
 * Graphs saved before dedicated flow output ports existed configured flow
 * parameters inline (e.g. a login recipe stored as a function value). The
 * compiler still honors those values, so they satisfy the connection
 * requirement. Mirrored by hasLegacyFlowParameterValue() in
 * app/Rules/ValidNodalGraph.php.
 */
function hasLegacyFlowParameterValue(
    values: Record<string, NodeParameterValue>,
    path: string[],
): boolean {
    const [key, ...segments] = path;
    if (!key || values[key] === undefined) return false;

    let current: unknown = values[key];
    for (const segment of segments) {
        if (!current || typeof current !== 'object') return false;

        const record = current as Record<string, unknown>;
        if (record.mode === 'object') {
            if (record.inputMode === 'json') {
                if (record.jsonMode === 'expression') return true;

                try {
                    const parsed: unknown = JSON.parse(typeof record.value === 'string' ? record.value : '');
                    current = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                        ? (parsed as Record<string, unknown>)[segment]
                        : undefined;
                } catch {
                    return false;
                }
                continue;
            }

            const fields = Array.isArray(record.fields) ? record.fields as Array<Record<string, unknown>> : [];
            current = fields.find(field => field?.key === segment)?.value;
            continue;
        }

        if (record.mode !== undefined) {
            // A scalar expression covers the whole object; it cannot be
            // inspected, so assume it provides the nested value.
            return typeof record.value === 'string' && record.value.trim() !== '';
        }

        // Plain decoded JSON from a parent segment.
        current = record[segment];
    }

    if (current === null || current === undefined) return false;
    if (typeof current === 'string') return current.trim() !== '';
    if (typeof current !== 'object') return true;

    const leaf = current as Record<string, unknown>;
    if (typeof leaf.mode === 'string') {
        return !isEmptyParameterValue(current as NodeParameterValue);
    }

    return Array.isArray(current) ? current.length > 0 : Object.keys(leaf).length > 0;
}

function getMissingRequiredObjectFieldIssues(
    parentPath: string,
    meta: ReturnType<typeof getParameterMeta>,
    value: NodeParameterValue | undefined,
): NodeValidationIssue[] {
    const oneOfKeys = new Set(meta.requiredOneOf?.flat() ?? []);
    const requiredFields = Object.entries(meta.objectFields ?? {})
        .filter(([key, fieldMeta]) => fieldMeta.required && fieldMeta.valueType !== 'flow' && !oneOfKeys.has(key));
    if (requiredFields.length === 0) return [];

    const toIssues = (fields: typeof requiredFields) => fields.map(([key, fieldMeta]) => {
        const label = fieldMeta.label ?? key;
        return {
            path: `${parentPath}.${key}`,
            label,
            message: `${label} is required.`,
        };
    });
    const normalized = normalizeParameterValue(value);
    if (normalized.mode !== 'object') {
        return toIssues(requiredFields);
    }

    if (normalized.inputMode === 'json') {
        if (normalized.jsonMode === 'expression') return [];

        try {
            const parsed = JSON.parse(normalized.value || '{}');
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return toIssues(requiredFields);
            }

            return toIssues(requiredFields
                .filter(([key]) => {
                    const fieldValue = (parsed as Record<string, unknown>)[key];
                    return fieldValue === undefined || fieldValue === null || fieldValue === '';
                }));
        } catch {
            return toIssues(requiredFields);
        }
    }

    return toIssues(requiredFields
        .filter(([key]) => {
            const field = normalized.fields.find(candidate => candidate.key === key);
            return !field || isEmptyParameterValue(field.value);
        }));
}

function getMissingRequiredOneOfIssues(
    parentPath: string,
    meta: ReturnType<typeof getParameterMeta>,
    value: NodeParameterValue | undefined,
): NodeValidationIssue[] {
    if (!meta.requiredOneOf?.length) return [];

    const normalized = normalizeParameterValue(value);
    let hasValue: (key: string) => boolean;
    let visibleKeys: string[] = [];

    if (normalized.mode === 'object' && normalized.inputMode === 'json') {
        if (normalized.jsonMode === 'expression') return [];

        let parsed: Record<string, unknown> = {};
        try {
            const candidate = JSON.parse(normalized.value || '{}');
            if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
                parsed = candidate as Record<string, unknown>;
            }
        } catch {
            parsed = {};
        }
        hasValue = key => parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== '';
        visibleKeys = Object.keys(parsed);
    } else if (normalized.mode === 'object') {
        hasValue = key => {
            const field = normalized.fields.find(candidate => candidate.key === key);
            return Boolean(field && !isEmptyParameterValue(field.value));
        };
        visibleKeys = normalized.fields.map(field => field.key);
    } else {
        hasValue = () => false;
    }

    return meta.requiredOneOf.flatMap(group => {
        if (group.some(hasValue)) return [];

        const labels = group.map(key => meta.objectFields?.[key]?.label ?? key);
        const visibleKey = group.find(key => visibleKeys.includes(key)) ?? group[0];
        if (!visibleKey) return [];

        return [{
            path: `${parentPath}.${visibleKey}`,
            label: labels.join(' or '),
            message: `${labels.join(' or ')} is required.`,
        }];
    });
}

function getUnavailableFixedValueIssue(
    entry: HelpEntryDef,
    key: string,
    meta: ReturnType<typeof getParameterMeta>,
    values: Record<string, NodeParameterValue>,
    resources?: NodeValidationResources,
): NodeValidationIssue[] {
    const normalized = normalizeScalarParameterValue(values[key]);
    const value = normalized.value.trim();
    if (normalized.mode !== 'fixed' || !value) return [];

    const label = getNodeParameterDisplayLabel(entry, key);
    const unavailable = (message = `${label} is no longer available.`): NodeValidationIssue[] => [{
        path: key,
        label,
        message,
    }];
    const inputType = meta.input ?? meta.valueType;

    if (inputType === 'select' && meta.options?.length) {
        return meta.options.some(option => option.value === value) ? [] : unavailable();
    }

    if (inputType === 'channel' && resources?.channels?.status === 'loaded') {
        return [...resources.channels.names].some(id => String(id) === value) ? [] : unavailable();
    }

    if (inputType === 'mailbox-watcher' && resources?.mailboxWatchers?.status === 'loaded') {
        return [...resources.mailboxWatchers.names].some(id => String(id) === value) ? [] : unavailable();
    }

    if (inputType === 'data-table' && resources?.dataTables?.status === 'loaded') {
        const table = resources.dataTables.items.find(item => String(item.id) === value);
        if (!table) return unavailable();
        if (DATA_TABLE_MUTATION_NODE_NAMES.has(entry.name) && !table.can_manage) {
            return unavailable(`${label} is read only for this flow actor.`);
        }

        return [];
    }

    if (
        (inputType === 'ai-model' || inputType === 'ai-vision-model')
        && resources?.aiModels?.status === 'loaded'
    ) {
        const model = resources.aiModels.items.find(item => String(item.id) === value);
        if (!model) return unavailable();
        if (inputType === 'ai-model' && model.capabilities.text !== true) {
            return unavailable(`${label} does not support text.`);
        }
        if (inputType === 'ai-vision-model' && model.capabilities.vision !== true) {
            return unavailable(`${label} does not support vision.`);
        }
    }

    return [];
}

export function getMissingRequiredParameters(
    entry: HelpEntryDef,
    values: Record<string, NodeParameterValue>,
    connectedOutputPorts?: ReadonlySet<string>,
    resources?: NodeValidationResources,
): NodeValidationIssue[] {
    const args = getSignatureArgs(entry.signature);
    const effectiveArgs = entry.name === LOOP_NODE_NAME
        ? args.filter(arg => getLoopParameterKeysForMode(normalizeScalarParameterValue(values.mode).value || 'items').includes(cleanArgName(arg)))
        : args;

    const issues: NodeValidationIssue[] = effectiveArgs.flatMap(arg => {
        const key = cleanArgName(arg);
        const meta = getParameterMeta(entry, key);
        const required = meta.required ?? !isOptionalArg(arg);
        const hasRequiredObjectFields = Object.values(meta.objectFields ?? {})
            .some(fieldMeta => fieldMeta.required)
            || (meta.requiredOneOf?.length ?? 0) > 0;

        if (meta.valueType === 'flow') return [];
        if (!required || !isEmptyParameterValue(values[key]) || hasRequiredObjectFields) return [];

        const label = getNodeParameterDisplayLabel(entry, key);
        return [{
            path: key,
            label,
            message: `${label} is required.`,
        }];
    });

    for (const arg of effectiveArgs) {
        const key = cleanArgName(arg);
        const meta = getParameterMeta(entry, key);
        issues.push(...getMissingRequiredObjectFieldIssues(key, meta, values[key]));
        issues.push(...getMissingRequiredOneOfIssues(key, meta, values[key]));
        issues.push(...getUnavailableFixedValueIssue(entry, key, meta, values, resources));
    }

    if (entry.name === '$mapElement' || entry.name === '$mapManyElements') {
        const getters = normalizeParameterValue(values.getters);
        if (getters.mode === 'object' && getters.inputMode === 'form') {
            const seenKeys = new Set<string>();
            getters.fields.forEach(field => {
                const outputKey = field.key.trim();
                const getter = normalizeScalarParameterValue(field.value).value;
                const path = `getters.${outputKey}`;
                if (!outputKey) {
                    issues.push({ path: 'getters.', label: 'Output key', message: 'Output key is required.' });
                } else if (seenKeys.has(outputKey)) {
                    issues.push({ path, label: outputKey, message: `Output key "${outputKey}" is duplicated.` });
                }
                seenKeys.add(outputKey);
                if (getter === 'attribute:' || (getter.startsWith('attribute:') && !getter.slice('attribute:'.length).trim())) {
                    issues.push({ path, label: outputKey || 'Getter', message: 'Attribute name is required.' });
                }
            });
        }
    }

    const availableOutputPorts = connectedOutputPorts;
    for (const { parameter: definition } of getNodeFlowPortDefinitions(entry).filter(isCallbackFlowPort)) {
        if (!availableOutputPorts) continue;
        if (!definition.meta.required) continue;
        if (availableOutputPorts.has(definition.portId)) continue;
        if (hasLegacyFlowParameterValue(values, definition.path)) continue;

        issues.push({
            path: definition.path.join('.'),
            label: definition.label,
            message: `Connect ${definition.label} on the canvas.`,
            kind: 'connect-flow',
        });
    }

    const gotoUrl = normalizeScalarParameterValue(values.url);
    if (
        entry.name === '$gotoUrl'
        && gotoUrl.mode === 'fixed'
        && gotoUrl.value.trim()
        && !normalizeHttpUrl(gotoUrl.value)
    ) {
        issues.push({
            path: 'url',
            label: 'Web page URL',
            message: 'Enter a valid web page URL.',
        });
    }
    const gotoUrlTabName = normalizeScalarParameterValue(values.tabName);
    if (
        entry.name === '$gotoUrl'
        && gotoUrlTabName.mode === 'fixed'
        && !gotoUrlTabName.value.trim()
    ) {
        issues.push({
            path: 'tabName',
            label: 'Tab Name',
            message: 'Select a browser tab.',
        });
    }

    if (entry.name === 'FUNCTION') {
        const functionName = normalizeScalarParameterValue(values.name).value.trim();
        if (functionName && !isValidIdentifier(functionName)) {
            issues.push({
                path: 'name',
                label: 'Function name',
                message: 'Use a valid, non-reserved JavaScript identifier.',
            });
        }
        const functionArguments = getFunctionArgumentNames(values.arguments);
        if (
            functionArguments.some(argument => !isValidIdentifier(argument))
            || new Set(functionArguments).size !== functionArguments.length
        ) {
            issues.push({
                path: 'arguments',
                label: 'Arguments',
                message: 'Use unique, non-reserved JavaScript identifiers.',
            });
        }
    }

    if (entry.category === 'Data Tables') {
        const filters = normalizeScalarParameterValue(values.filters);
        const requiresFilters = [
            '$dataTableUpsertRows',
            '$dataTableRowExists',
            '$dataTableRowDoesNotExist',
            '$dataTableDeleteRows',
        ].includes(entry.name);
        let parsedFilters: unknown = null;
        if (filters.mode === 'fixed') {
            try {
                parsedFilters = JSON.parse(filters.value || '[]');
            } catch {
                parsedFilters = null;
            }
        }
        if (requiresFilters && filters.mode === 'fixed' && (!Array.isArray(parsedFilters) || parsedFilters.length === 0)) {
            issues.push({
                path: 'filters',
                label: 'Filters',
                message: 'Add at least one filter. Use Expression mode when filters are computed at runtime.',
            });
        }
        if (entry.name === '$dataTableUpdateRows' && filters.mode === 'fixed' && Array.isArray(parsedFilters) && parsedFilters.length === 0) {
            if (objectBooleanValue(values.options, 'updateAll') === false) {
                issues.push({
                    path: 'filters',
                    label: 'Filters',
                    message: 'Add a filter or explicitly enable Update All in options.',
                });
            }
        }
    }

    return issues;
}

export function hasMissingRequiredParameters(entry: HelpEntryDef, values: Record<string, NodeParameterValue>) {
    return getMissingRequiredParameters(entry, values).length > 0;
}
