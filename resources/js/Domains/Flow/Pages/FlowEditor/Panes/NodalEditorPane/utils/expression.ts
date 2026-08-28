import type { IfConditionCategory, IfConditionRule, NodeParameterValue, ObjectFieldValueType, ObjectNodeParameterField, RawNodeParameterValue, ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

export function normalizeScalarParameterValue(value: RawNodeParameterValue | unknown): ScalarNodeParameterValue {
    if (isRecord(value) && (value.mode === 'fixed' || value.mode === 'expression')) {
        return {
            mode: value.mode,
            value: typeof value.value === 'string' ? value.value : '',
        };
    }

    return {
        mode: 'fixed',
        value: typeof value === 'string' ? value : '',
    };
}

export const normalizeParameterValue = (value: RawNodeParameterValue | unknown): NodeParameterValue => {
    if (isRecord(value) && value.mode === 'if-condition') {
        const rules = Array.isArray(value.rules)
            ? value.rules.map((rule, index): IfConditionRule => {
                const source = isRecord(rule) ? rule : {};
                const category = typeof source.category === 'string' && ['string', 'number', 'dateTime', 'boolean', 'array', 'object'].includes(source.category)
                    ? source.category as IfConditionCategory
                    : 'string';

                return {
                    id: typeof source.id === 'string' ? source.id : `condition-${index}`,
                    category,
                    operator: typeof source.operator === 'string' ? source.operator : 'exists',
                    left: normalizeScalarParameterValue(source.left),
                    right: normalizeScalarParameterValue(source.right),
                };
            })
            : [];

        return {
            mode: 'if-condition',
            combinator: value.combinator === 'or' ? 'or' : 'and',
            rules: rules.length > 0 ? rules : [{
                id: 'condition-1',
                category: 'boolean',
                operator: 'isTrue',
                left: { mode: 'expression', value: '{{ true }}' },
                right: { mode: 'fixed', value: '' },
            }],
        };
    }

    if (isRecord(value) && value.mode === 'object') {
        const inputMode = value.inputMode === 'form' ? 'form' : 'json';
        const fields = Array.isArray(value.fields)
            ? value.fields.map((field, index): ObjectNodeParameterField => {
                const source = isRecord(field) ? field : {};
                return {
                    id: typeof source.id === 'string' ? source.id : `field-${index}`,
                    key: typeof source.key === 'string' ? source.key : '',
                    keyMode: source.keyMode === 'fixed' || source.keyMode === 'expression'
                        ? source.keyMode
                        : undefined,
                    valueType: typeof source.valueType === 'string' && ['string', 'number', 'dateTime', 'boolean', 'array', 'object'].includes(source.valueType)
                        ? source.valueType as IfConditionCategory
                        : undefined,
                    value: normalizeParameterValue(source.value),
                };
            })
            : [];

        return {
            mode: 'object',
            inputMode,
            jsonMode: value.jsonMode === 'expression' ? 'expression' : 'fixed',
            value: typeof value.value === 'string' ? value.value : '{}',
            fields,
        };
    }

    if (isRecord(value) && (value.mode === 'fixed' || value.mode === 'expression')) {
        return normalizeScalarParameterValue(value);
    }

    return {
        mode: 'fixed',
        value: typeof value === 'string' ? value : '',
    };
};

export const normalizeNodeValues = (values?: Record<string, RawNodeParameterValue>): Record<string, NodeParameterValue> => {
    return Object.fromEntries(
        Object.entries(values ?? {}).map(([key, value]) => [key, normalizeParameterValue(value)]),
    );
};

export const cloneNodeValues = (values: Record<string, NodeParameterValue>): Record<string, NodeParameterValue> => {
    const cloneValue = (value: NodeParameterValue): NodeParameterValue => {
        if (value.mode === 'if-condition') {
            return {
                ...value,
                rules: value.rules.map(rule => ({
                    ...rule,
                    left: { ...rule.left },
                    right: rule.right ? { ...rule.right } : undefined,
                })),
            };
        }

        if (value.mode !== 'object') return { ...value };

        return {
            ...value,
            fields: value.fields.map(field => ({
                ...field,
                value: cloneValue(field.value),
            })),
        };
    };

    return Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, cloneValue(value)]),
    );
};

const isParsableExpression = (source: string): boolean => {
    try {
        // Parse-only syntax check; the function is never invoked.
        new Function(`return (\n${source}\n);`);
        return true;
    } catch {
        return false;
    }
};

const formatFixedLiteral = (
    value: string | undefined,
    valueType?: NodalParamDef['valueType'],
) => {
    const trimmed = value?.trim();
    if (!trimmed) return 'undefined';
    if (
        valueType === 'string'
        || valueType === 'channel'
        || valueType === 'mailbox-watcher'
        || valueType === 'data-table'
    ) {
        return JSON.stringify(value);
    }
    if (valueType === 'number') return /^-?\d+(\.\d+)?$/.test(trimmed) ? trimmed : 'undefined';
    if (valueType === 'boolean') return trimmed === 'true' || trimmed === '1' ? 'true' : 'false';
    if (valueType === 'function' || valueType === 'code') return isParsableExpression(trimmed) ? trimmed : 'undefined';
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
    if (['true', 'false', 'null', 'undefined'].includes(trimmed)) return trimmed;
    if (/^[$[{('"`]/.test(trimmed) || /^(await |new |async |function )/.test(trimmed)) {
        // JS-looking fixed values are inlined as code, but only when they parse
        // as a standalone expression; otherwise they would corrupt the
        // structure of the compiled code, so fall back to a string literal.
        const parseTarget = trimmed.startsWith('await ') ? trimmed.slice(6) : trimmed;
        if (isParsableExpression(parseTarget)) return trimmed;
    }
    return JSON.stringify(trimmed);
};

const formatDataTableFiltersForCompiler = (value: string, awaitExpressions: boolean): string => {
    let filters: unknown;
    try {
        filters = JSON.parse(value || '[]');
    } catch {
        return '[]';
    }
    if (!Array.isArray(filters)) return '[]';

    const source = filters
        .filter((filter): filter is Record<string, unknown> => Boolean(filter && typeof filter === 'object' && !Array.isArray(filter)))
        .map(filter => {
            const fields = [
                `keyName: ${JSON.stringify(String(filter.keyName ?? ''))}`,
                `condition: ${JSON.stringify(String(filter.condition ?? 'eq'))}`,
            ];
            if (Object.prototype.hasOwnProperty.call(filter, 'keyValue')) {
                const keyValue = filter.keyValueMode === 'expression'
                    ? `$renderExpression(${JSON.stringify(String(filter.keyValue ?? ''))})`
                    : JSON.stringify(filter.keyValue);
                fields.push(`keyValue: ${filter.keyValueMode === 'expression' && awaitExpressions ? `await ${keyValue}` : keyValue}`);
            }

            return `{ ${fields.join(', ')} }`;
        })
        .join(', ');

    return `[${source}]`;
};

const createPreviewDateTime = (value: Date | string | number = new Date()) => {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    const clone = (next: Date) => createPreviewDateTime(next);
    const formatDateTimeLabel = () => `[DateTime: ${date.toISOString()}]`;

    return {
        get day() { return date.getDate(); },
        get hour() { return date.getHours(); },
        get isInDST() { return false; },
        get isInLeapYear() {
            const year = date.getFullYear();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },
        get isWeekend() {
            return date.getDay() === 0 || date.getDay() === 6;
        },
        get locale() { return Intl.DateTimeFormat().resolvedOptions().locale; },
        get millisecond() { return date.getMilliseconds(); },
        get minute() { return date.getMinutes(); },
        get month() { return date.getMonth() + 1; },
        get monthLong() { return date.toLocaleString(undefined, { month: 'long' }); },
        get monthShort() { return date.toLocaleString(undefined, { month: 'short' }); },
        get quarter() { return Math.floor(date.getMonth() / 3) + 1; },
        get second() { return date.getSeconds(); },
        get weekday() { return date.getDay() === 0 ? 7 : date.getDay(); },
        get weekdayLong() { return date.toLocaleString(undefined, { weekday: 'long' }); },
        get weekdayShort() { return date.toLocaleString(undefined, { weekday: 'short' }); },
        get weekNumber() {
            const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNumber = target.getUTCDay() || 7;
            target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
            const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
            return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        },
        get year() { return date.getFullYear(); },
        get zone() { return Intl.DateTimeFormat().resolvedOptions().timeZone; },
        format() { return date.toISOString(); },
        minus(amount = 0, unit = 'milliseconds') {
            const next = new Date(date.getTime());
            const normalized = String(unit).replace(/s$/, '');
            if (normalized === 'month') next.setMonth(next.getMonth() - amount);
            else if (normalized === 'year') next.setFullYear(next.getFullYear() - amount);
            else if (normalized === 'day') next.setDate(next.getDate() - amount);
            else if (normalized === 'hour') next.setHours(next.getHours() - amount);
            else if (normalized === 'minute') next.setMinutes(next.getMinutes() - amount);
            else if (normalized === 'second') next.setSeconds(next.getSeconds() - amount);
            else next.setMilliseconds(next.getMilliseconds() - amount);
            return clone(next);
        },
        plus(amount = 0, unit = 'milliseconds') {
            return this.minus(-amount, unit);
        },
        startOf(unit = 'day') {
            const next = new Date(date.getTime());
            if (unit === 'year') next.setMonth(0, 1);
            if (unit === 'month') next.setDate(1);
            if (['year', 'month', 'day'].includes(unit)) next.setHours(0, 0, 0, 0);
            return clone(next);
        },
        endOf(unit = 'day') {
            return this.startOf(unit).plus(1, unit).minus(1, 'millisecond');
        },
        extract(part = 'week') {
            const key = part === 'week' ? 'weekNumber' : part;
            return (this as Record<string, unknown>)[key];
        },
        diffTo(otherDate: Date | string | number, unit = 'days') {
            const diff = date.getTime() - new Date(otherDate).getTime();
            if (unit === 'seconds') return diff / 1000;
            if (unit === 'minutes') return diff / 60000;
            if (unit === 'hours') return diff / 3600000;
            return diff / 86400000;
        },
        diffToNow(unit = 'days') { return this.diffTo(new Date(), unit); },
        equals(otherDate: { toMillis?: () => number } | Date | string | number) {
            const otherMillis = typeof otherDate === 'object' && otherDate && 'toMillis' in otherDate && otherDate.toMillis
                ? otherDate.toMillis()
                : new Date(otherDate as Date | string | number).getTime();
            return date.getTime() === otherMillis;
        },
        hasSame(otherDate: Date | string | number, unit = 'day') {
            const other = createPreviewDateTime(otherDate);
            return this.extract(unit) === other.extract(unit);
        },
        isBetween(firstDate: Date | string | number, secondDate: Date | string | number) {
            const current = date.getTime();
            const first = new Date(firstDate).getTime();
            const second = new Date(secondDate).getTime();
            return first > second ? second < current && current < first : first < current && current < second;
        },
        set(values: Record<string, number>) {
            const next = new Date(date.getTime());
            if (values.year !== undefined) next.setFullYear(values.year);
            if (values.month !== undefined) next.setMonth(values.month - 1);
            if (values.day !== undefined) next.setDate(values.day);
            if (values.hour !== undefined) next.setHours(values.hour);
            if (values.minute !== undefined) next.setMinutes(values.minute);
            if (values.second !== undefined) next.setSeconds(values.second);
            if (values.millisecond !== undefined) next.setMilliseconds(values.millisecond);
            return clone(next);
        },
        setLocale() { return this; },
        setZone() { return this; },
        toISO() { return date.toISOString(); },
        toJSDate() { return new Date(date.getTime()); },
        toLocaleString(options?: Intl.DateTimeFormatOptions) { return date.toLocaleString(undefined, options); },
        toLocal() { return this; },
        toMillis() { return date.getTime(); },
        toRelative() { return null; },
        toSeconds() { return Math.floor(date.getTime() / 1000); },
        toJSON() { return formatDateTimeLabel(); },
        toString() { return formatDateTimeLabel(); },
        toUTC() { return this; },
        valueOf() { return date.getTime(); },
        [Symbol.toPrimitive]() { return formatDateTimeLabel(); },
    };
};

const evaluateExpressionSource = (source: string, scope: { inputData: unknown; pageData?: unknown; outputData: unknown; nodeData?: unknown; runData?: unknown; contextData?: unknown; variableData?: Record<string, unknown> }) => {
    if (source.includes('$page')) return `[Needs run: ${source}]`;

    const $input = scope.inputData;
    const $page = scope.pageData ?? {};
    const $output = scope.outputData;
    const $nodes = scope.nodeData ?? {};
    const $run = scope.runData ?? {};
    const $context = scope.contextData ?? {};
    const $viewportWidth = isRecord($input) && typeof $input.$viewportWidth === 'number'
        ? $input.$viewportWidth
        : 1280;
    const $viewportHeight = isRecord($input) && typeof $input.$viewportHeight === 'number'
        ? $input.$viewportHeight
        : 720;
    const $now = createPreviewDateTime();
    const $today = createPreviewDateTime(new Date(new Date().setHours(0, 0, 0, 0)));
    const $vars = (name: string) => Object.prototype.hasOwnProperty.call(scope.variableData ?? {}, name)
        ? scope.variableData?.[name]
        : `[Needs run: $vars(${JSON.stringify(name)})]`;
    const $scope = {
        ...(isRecord($output) ? $output : {}),
        ...(isRecord($input) ? $input : {}),
        ...(isRecord($run) ? $run : {}),
        $nodes,
        $run,
        $context,
        $viewportWidth,
        $viewportHeight,
        $now,
        $today,
    };
    const render = new Function('$input', '$page', '$output', '$nodes', '$run', '$context', '$vars', '$viewportWidth', '$viewportHeight', '$now', '$today', '$scope', `with ($scope) { return (${source}); }`);

    return render($input, $page, $output, $nodes, $run, $context, $vars, $viewportWidth, $viewportHeight, $now, $today, $scope);
};

const renderExpressionTemplate = (value: string, scope: { inputData: unknown; pageData?: unknown; outputData: unknown; nodeData?: unknown; runData?: unknown; contextData?: unknown; variableData?: Record<string, unknown> }) => {
    const trimmed = value.trim();
    const templateParts = [...value.matchAll(/\{\{([\s\S]*?)\}\}/g)];
    const pureExpression = templateParts.length === 1 && trimmed === templateParts[0][0]
        ? templateParts[0]
        : null;

    if (pureExpression) {
        return evaluateExpressionSource((pureExpression[1] ?? '').trim() || 'undefined', scope);
    }

    // Without {{ }} delimiters the value is a plain string, not code.
    if (templateParts.length === 0) return trimmed ? value : undefined;

    return value.replace(/\{\{([\s\S]*?)\}\}/g, (_, source: string) => {
        const rendered = evaluateExpressionSource(source.trim() || 'undefined', scope);
        return rendered === null || rendered === undefined ? '' : String(rendered);
    });
};

export const formatParameterForCompiler = (
    value: RawNodeParameterValue | undefined,
    options: {
        awaitExpressions?: boolean;
        valueType?: NodalParamDef['valueType'];
    } = {},
): string => {
    const normalized = normalizeParameterValue(value);
    if (normalized.mode === 'if-condition') return 'undefined';
    if (normalized.mode === 'fixed' && options.valueType === 'data-table-filters') {
        return formatDataTableFiltersForCompiler(normalized.value, options.awaitExpressions === true);
    }

    if (normalized.mode === 'object') {
        if (normalized.inputMode === 'json') {
            if (normalized.jsonMode === 'expression') {
                return formatJsonExpressionForCompiler(normalized.value, options);
            }

            return formatFixedLiteral(normalized.value || '{}');
        }

        const fields = normalized.fields
            .map(field => ({
                key: field.key.trim(),
                valueType: options.valueType === 'function-map' ? 'code' as const : field.valueType,
                value: field.value,
            }))
            .filter(field => field.key);

        if (fields.length === 0) return '{}';

        // Keys holding {{ }} templates compile to computed properties so the
        // property name is rendered at runtime like any expression value.
        const formatFieldKey = (key: string) => {
            if (!key.includes('{{')) return JSON.stringify(key);
            const rendered = `$renderExpression(${JSON.stringify(key)})`;
            return `[${options.awaitExpressions ? `await ${rendered}` : rendered}]`;
        };

        return `{ ${fields.map(field => `${formatFieldKey(field.key)}: ${formatTypedFieldForCompiler(field.value, field.valueType, options)}`).join(', ')} }`;
    }

    if (normalized.mode === 'expression') {
        const rendered = `$renderExpression(${JSON.stringify(normalized.value)})`;
        return options.awaitExpressions ? `await ${rendered}` : rendered;
    }

    return formatFixedLiteral(normalized.value, options.valueType);
};

const formatJsonExpressionForCompiler = (value: string, options: { awaitExpressions?: boolean } = {}) => {
    const rendered = `(async () => {
        const rendered = await $renderExpression(${JSON.stringify(value || '{}')});
        const coerceJsonValue = (item) => {
            if (Array.isArray(item)) return item.map(coerceJsonValue);
            if (item && typeof item === 'object') {
                return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, coerceJsonValue(value)]));
            }
            if (typeof item !== 'string') return item;
            const trimmed = item.trim();
            if (trimmed === 'true') return true;
            if (trimmed === 'false') return false;
            if (trimmed === 'null') return null;
            if (/^-?\\d+(\\.\\d+)?$/.test(trimmed)) return Number(trimmed);
            if (!/^[{[]/.test(trimmed)) return item;
            try { return coerceJsonValue(JSON.parse(trimmed)); } catch (_) {}
            try { return coerceJsonValue(Function('"use strict"; return (' + trimmed + ');')()); } catch (_) { return item; }
        };
        const parsed = typeof rendered === 'string' ? JSON.parse(rendered || '{}') : rendered;
        return coerceJsonValue(parsed);
    })()`;

    return options.awaitExpressions ? `await ${rendered}` : rendered;
};

const formatTypedFieldForCompiler = (
    value: RawNodeParameterValue | undefined,
    valueType: ObjectFieldValueType | undefined,
    options: { awaitExpressions?: boolean } = {},
) => {
    const source = formatParameterForCompiler(value, valueType === 'code'
        ? { ...options, valueType: 'code' }
        : options);
    const coerceLiteral = `((value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        if (!/^[{[]/.test(trimmed)) return value;
        try { return JSON.parse(trimmed); } catch (_) {}
        try { return Function('"use strict"; return (' + trimmed + ');')(); } catch (_) { return value; }
    })`;

    switch (valueType) {
        case 'number':
            return `Number(${source})`;
        case 'boolean':
            return `((value) => value === true || value === 'true' || value === 1 || value === '1')(${source})`;
        case 'array':
            return `((value) => { const coerced = ${coerceLiteral}(value); return Array.isArray(coerced) ? coerced : []; })(${source})`;
        case 'object':
            return `((value) => { const coerced = ${coerceLiteral}(value); return coerced && typeof coerced === 'object' && !Array.isArray(coerced) ? coerced : {}; })(${source})`;
        case 'string':
            return `String(${source} ?? '')`;
        case 'dateTime':
        default:
            return source;
    }
};

export const evaluateExpressionPreview = (
    value: string,
    scope: { inputData: unknown; pageData?: unknown; outputData: unknown; nodeData?: unknown; runData?: unknown; contextData?: unknown; variableData?: Record<string, unknown> },
): { ok: true; value: unknown } | { ok: false; error: string } => {
    try {
        return {
            ok: true,
            value: renderExpressionTemplate(value, scope),
        };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Expression could not be rendered.',
        };
    }
};

export const expressionForPath = (path: string) => `{{ ${path} }}`;
