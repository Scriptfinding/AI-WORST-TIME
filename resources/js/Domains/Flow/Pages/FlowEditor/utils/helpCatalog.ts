import type {
    HelpEntryAvailability,
    HelpEntryDef,
    NodalParamDef,
    SiteUrlContextDef,
} from '@/Domains/Flow/Pages/FlowEditor/types';
import runHeaderRaw from '@/../../src/sandbox/run-header.js?raw';
import { nodalOutputToTypeScript } from './outputPreview';

export function parseHelpEntries(raw: string): HelpEntryDef[] {
    const entries: HelpEntryDef[] = [];
    const blockRe = /\/\*\s*@help\s+(.+?)\n([\s\S]*?)\*\//g;
    let match;
    while ((match = blockRe.exec(raw)) !== null) {
        const category = match[1].trim();
        const body = match[2];
        const sig = body.match(/@sig\s+(.+)/)?.[1]?.trim() || '';
        const desc = body.match(/@desc\s+(.+)/)?.[1]?.trim() || '';
        const aliases = body.match(/@aliases?\s+(.+)/)?.[1]
            ?.split(',')
            .map(alias => alias.trim())
            .filter(Boolean) ?? [];
        const nodalDesc = body.match(/@nodal-desc\s+(.+)/)?.[1]?.trim();
        const nodalOutput = body.match(/@(?:nodal-)?output\s+(.+)/)?.[1]?.trim();
        const rawAvailability = body.match(/@availability\s+(.+)/)?.[1]?.trim().toLowerCase();
        const availability: HelpEntryAvailability = rawAvailability === 'nodal'
            || rawAvailability === 'code'
            || rawAvailability === 'none'
            ? rawAvailability
            : 'both';
        const opt = body.match(/@opt\s+(.+)/)?.[1]?.trim();
        const evalExpr = body.match(/@eval\s+(.+)/)?.[1]?.trim();
        const siteUrlContexts = parseSiteUrlContexts(body);
        const nodalParams = addOptionDefaultValues(parseNodalParams(body), opt);
        const name = sig.replace(/\(.*$/, '');
        if (name) {
            entries.push({
                name,
                signature: sig,
                desc,
                ...(aliases.length > 0 ? { aliases } : {}),
                ...(nodalDesc ? { nodalDesc } : {}),
                ...(nodalOutput ? { nodalOutput } : {}),
                category,
                availability,
                options: opt,
                evalExpr,
                ...(Object.keys(nodalParams).length > 0 ? { nodalParams } : {}),
                ...(siteUrlContexts.length > 0 ? { siteUrlContexts } : {}),
            });
        }
    }
    return entries;
}

function toFriendlyLabel(value: string): string {
    if (value.replace(/\?$/, '') === 'structuredSpacing') return 'Structured content indentation';

    return value
        .replace(/\?$/, '')
        .replace(/^\.\.\./, '')
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, letter => letter.toUpperCase());
}

function parseNodalPlaceholders(body: string): { path: string[]; value: string }[] {
    const lines = body
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''));
    const placeholders: { path: string[]; value: string }[] = [];

    for (let index = 0; index < lines.length; index++) {
        const match = lines[index].match(/^@nodal-placeholder\s+([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*:\s*(.*)$/);
        if (!match) continue;

        const valueLines = [match[2]];
        while (index + 1 < lines.length && !lines[index + 1].trimStart().startsWith('@')) {
            valueLines.push(lines[++index]);
        }
        while (valueLines.length > 0 && valueLines[valueLines.length - 1].trim() === '') {
            valueLines.pop();
        }

        placeholders.push({
            path: match[1].split('.'),
            value: valueLines.join('\n'),
        });
    }

    return placeholders;
}

function parseSiteUrlContexts(body: string): SiteUrlContextDef[] {
    return Array.from(
        body.matchAll(/@site-url\s+([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s*:\s*([^\n]+)/g),
        match => ({
            contextPath: match[1].split('.'),
            urlPaths: match[2]
                .split(',')
                .map(path => path.trim())
                .filter(Boolean)
                .map(path => path.split('.')),
        }),
    );
}

const PARAM_SELECT_CHOICES: Record<string, { value: string; label: string }[]> = {
    format: [
        { value: 'text', label: 'Text' },
        { value: 'json', label: 'JSON' },
        { value: 'yaml', label: 'YAML' },
        { value: 'csv', label: 'CSV' },
        { value: 'toml', label: 'TOML' },
        { value: 'xml', label: 'XML' },
    ],
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(value => ({ value, label: value })),
    buttonType: [
        { value: 'left', label: 'Left click' },
        { value: 'right', label: 'Right click' },
        { value: 'middle', label: 'Middle click' },
    ],
    textFilter: [
        { value: 'contains', label: 'Contains' },
        { value: 'exact', label: 'Exact match' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
    ],
    bodyType: [
        { value: 'json', label: 'JSON' },
        { value: 'raw', label: 'Raw' },
        { value: 'form', label: 'Form URL Encoded' },
        { value: 'multipart', label: 'Multipart Form Data' },
    ],
    responseFormat: [
        { value: 'auto', label: 'Autodetect' },
        { value: 'json', label: 'JSON' },
        { value: 'text', label: 'Text' },
        // { value: 'file', label: 'File' },
    ],
    responseStatus: [
        { value: 'success', label: 'success' },
        { value: 'error', label: 'error' },
    ],
    sortOrder: [
        { value: 'asc', label: 'asc' },
        { value: 'desc', label: 'desc' },
    ],
    outputMode: [
        { value: 'text', label: 'Text' },
        { value: 'json', label: 'JSON' },
        { value: 'schema', label: 'JSON schema' },
    ],
    mode: [
        { value: 'replace', label: 'Replace' },
        { value: 'append', label: 'Append' },
        { value: 'prepend', label: 'Prepend' },
    ],
    waitUntil: [
        { value: 'networkidle0', label: 'networkidle0' },
        { value: 'domcontentloaded', label: 'domcontentloaded' },
        { value: 'networkidle2', label: 'networkidle2' },
        { value: 'load', label: 'load' },
        { value: 'commit', label: 'commit' },
    ],
};

function parseNodalParams(body: string): Record<string, NodalParamDef> {
    const params: Record<string, NodalParamDef> = {};
    const matches = body.matchAll(/@(?:nodal-)?param\s+([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)(?:\s+\[([a-zA-Z,\s-]+)\])?\s*[:-]\s*(.+)/g);

    for (const match of matches) {
        const path = match[1];
        const hintTokens = parseNodalParamHintTokens(match[2]);
        const tabNameInput = hintTokens.includes('tab-name');
        const valueType = tabNameInput
            ? 'string'
            : normalizeNodalParamType(hintTokens.find(token => token !== 'required'));
        const required = hintTokens.includes('required');
        const picker = hintTokens.includes('selector') ? 'selector' as const : undefined;
        const description = match[3].trim();
        const input = tabNameInput
            ? 'tab-name'
            : hintTokens.includes('textarea')
            ? 'textarea'
            : valueType === 'boolean'
                ? 'boolean'
                : valueType === 'number'
                    ? 'number'
                    : valueType === 'array'
                        ? 'textarea'
                        : valueType === 'function' || valueType === 'code'
                            ? 'code'
                            : valueType === 'custom-object'
                                ? 'custom-object'
                                : valueType === 'getter-map'
                                    ? 'getter-map'
                                    : valueType === 'function-map'
                                        ? 'function-map'
                                : valueType === 'object'
                                    ? 'object'
                                    : valueType === 'channel'
                                        || valueType === 'mailbox-watcher'
                                        || valueType === 'ai-model'
                                        || valueType === 'ai-vision-model'
                                        ? valueType
                                        : undefined;
        const [paramName, ...fieldPath] = path.split('.');
        const fieldName = fieldPath[fieldPath.length - 1];
        const selectChoices = PARAM_SELECT_CHOICES[fieldName ?? paramName];
        const effectiveInput = selectChoices ? 'select' : input;

        if (!fieldName) {
            params[paramName] = {
                ...params[paramName],
                label: params[paramName]?.label ?? toFriendlyLabel(paramName),
                description,
                ...(valueType ? { valueType } : {}),
                ...(required ? { required } : {}),
                ...(picker ? { picker } : {}),
                ...(effectiveInput ? { input: effectiveInput } : {}),
                ...(selectChoices ? { options: selectChoices } : {}),
            };
            continue;
        }

        const fieldDefinition: NodalParamDef = {
            label: toFriendlyLabel(fieldName),
            description,
            ...(valueType ? { valueType } : {}),
            ...(required ? { required } : {}),
            ...(picker ? { picker } : {}),
            ...(effectiveInput ? { input: effectiveInput } : {}),
            ...(selectChoices ? { options: selectChoices } : {}),
        };
        const setNestedField = (
            objectFields: Record<string, NodalParamDef>,
            remainingPath: string[],
        ): Record<string, NodalParamDef> => {
            const [key, ...rest] = remainingPath;
            if (!key) return objectFields;
            if (rest.length === 0) {
                return { ...objectFields, [key]: { ...objectFields[key], ...fieldDefinition } };
            }

            const current = objectFields[key];
            return {
                ...objectFields,
                [key]: {
                    ...current,
                    label: current?.label ?? toFriendlyLabel(key),
                    description: current?.description ?? `Configure ${toFriendlyLabel(key)}.`,
                    input: 'object',
                    objectFields: setNestedField(current?.objectFields ?? {}, rest),
                },
            };
        };

        params[paramName] = {
            ...params[paramName],
            label: params[paramName]?.label ?? toFriendlyLabel(paramName),
            description: params[paramName]?.description ?? `Configure ${toFriendlyLabel(paramName)}.`,
            input: 'object',
            objectFields: setNestedField(params[paramName]?.objectFields ?? {}, fieldPath),
        };
    }

    const oneOfMatches = body.matchAll(/@nodal-one-of\s+([^\n]+)/g);
    for (const match of oneOfMatches) {
        const paths = match[1]
            .split(',')
            .map(path => path.trim())
            .filter(Boolean)
            .map(path => path.split('.'));
        const parentName = paths[0]?.[0];
        const fieldNames = paths.map(([, fieldName]) => fieldName).filter(Boolean);
        const sameParent = paths.every(([candidateParent, fieldName]) => (
            candidateParent === parentName && Boolean(fieldName)
        ));

        if (!parentName || fieldNames.length < 2 || !sameParent || !params[parentName]) continue;

        params[parentName] = {
            ...params[parentName],
            requiredOneOf: [
                ...(params[parentName].requiredOneOf ?? []),
                fieldNames,
            ],
        };
    }

    for (const placeholder of parseNodalPlaceholders(body)) {
        const [paramName, ...fieldPath] = placeholder.path;
        let meta: NodalParamDef | undefined = params[paramName];
        for (const fieldName of fieldPath) {
            meta = meta?.objectFields?.[fieldName];
        }
        if (meta) meta.placeholder = placeholder.value;
    }

    return params;
}

function addOptionDefaultValues(
    params: Record<string, NodalParamDef>,
    options?: string,
): Record<string, NodalParamDef> {
    const optionDefaults = parseOptionDefaultFields(options);
    if (Object.keys(optionDefaults).length === 0) return params;

    return {
        ...params,
        options: {
            ...params.options,
            label: params.options?.label ?? toFriendlyLabel('options'),
            description: params.options?.description ?? 'Configure options.',
            input: 'object',
            objectFields: mergeObjectFields(optionDefaults, params.options?.objectFields),
        },
    };
}

const OPTION_NUMBER_FIELDS = new Set([
    'timeout',
    'delay',
    'sleep',
    'speed',
    'index',
    'tabCount',
    'loggedMarkerTimeout',
]);

function parseOptionDefaultFields(options?: string): Record<string, NodalParamDef> {
    if (!options) return {};

    return Object.fromEntries(
        options
            .split(',')
            .map(option => option.trim())
            .filter(Boolean)
            .flatMap(option => {
                const [rawKey, ...rawDefaultParts] = option.split(':');
                const key = rawKey?.trim();
                if (!key) return [];

                const defaultValue = normalizeOptionDefaultValue(rawDefaultParts.join(':'));
                const valueType = OPTION_NUMBER_FIELDS.has(key) || /^-?\d+(\.\d+)?$/.test(defaultValue ?? '')
                    ? 'number' as const
                    : defaultValue === 'true' || defaultValue === 'false'
                        ? 'boolean' as const
                        : undefined;
                const input = valueType === 'number' || valueType === 'boolean' ? valueType : undefined;
                const selectChoices = PARAM_SELECT_CHOICES[key];
                return [[key, {
                    label: toFriendlyLabel(key),
                    description: defaultValue ? `Default: ${defaultValue}` : `Configure ${toFriendlyLabel(key)}.`,
                    ...(defaultValue ? { defaultValue } : {}),
                    ...(valueType ? { valueType } : {}),
                    ...(input ? { input } : {}),
                    ...(selectChoices ? { input: 'select' as const, options: selectChoices } : {}),
                } satisfies NodalParamDef]];
            }),
    );
}

function mergeObjectFields(
    baseFields: Record<string, NodalParamDef>,
    overrideFields?: Record<string, NodalParamDef>,
): Record<string, NodalParamDef> {
    const keys = new Set([...Object.keys(baseFields), ...Object.keys(overrideFields ?? {})]);

    return Object.fromEntries(
        [...keys].map(key => [key, {
            ...(baseFields[key] ?? {}),
            ...(overrideFields?.[key] ?? {}),
        }]),
    );
}

function normalizeOptionDefaultValue(value: string): string | undefined {
    const cleaned = value
        .trim()
        .split(/\s+-\s+/, 1)[0]
        .trim();
    const firstUnionValue = cleaned.split('|')[0]?.trim() ?? cleaned;
    const numericFallback = firstUnionValue.match(/^\([^)]*(-?\d+(?:\.\d+)?)[^)]*\)$/)?.[1];
    const defaultValue = numericFallback ?? firstUnionValue;
    const unquotedDefaultValue = defaultValue.replace(/^(['"])(.*)\1$/, '$2');
    if (unquotedDefaultValue.toLowerCase() === 'flow timeout') return '30000';

    return unquotedDefaultValue.toLowerCase() === 'null' ? undefined : unquotedDefaultValue;
}

function parseNodalParamHintTokens(rawHints: string | undefined): string[] {
    return (rawHints ?? '')
        .split(/[\s,]+/)
        .map(token => token.trim().toLowerCase())
        .filter(Boolean);
}

function normalizeNodalParamType(type: string | undefined): NodalParamDef['valueType'] | undefined {
    if (!type) return undefined;

    const normalized = type.toLowerCase();
    if (['int', 'integer', 'float', 'double'].includes(normalized)) return 'number';
    if (['string', 'number', 'boolean', 'array', 'object', 'custom-object', 'getter-map', 'function-map', 'function', 'code', 'flow', 'channel', 'mailbox-watcher', 'ai-model', 'ai-vision-model'].includes(normalized)) {
        return normalized as NodalParamDef['valueType'];
    }

    return undefined;
}

export const ALL_HELP_ENTRIES: HelpEntryDef[] = parseHelpEntries(runHeaderRaw)
    .filter(entry => entry.availability !== 'none');
export const HELP_ENTRIES: HelpEntryDef[] = ALL_HELP_ENTRIES.filter(entry => entry.availability !== 'nodal');

const ASYNC_RUNTIME_HELPER_NAMES = new Set(
    Array.from(
        runHeaderRaw.matchAll(/const\s+(\$\w+)\s*=\s*async\s+function/g),
        match => match[1],
    ),
);

export const ASYNC_HELPER_NAMES = new Set(
    HELP_ENTRIES
        .map(entry => entry.name)
        .filter(name => ASYNC_RUNTIME_HELPER_NAMES.has(name)),
);

function toTypeScriptType(meta?: NodalParamDef): string {
    if (!meta) return 'any';

    if (meta.objectFields && Object.keys(meta.objectFields).length > 0) {
        const fields = Object.entries(meta.objectFields)
            .map(([fieldName, fieldMeta]) => {
                const description = getNodalParamDoc(fieldMeta);
                const optional = fieldMeta.required ? '' : '?';
                return `${description}${fieldName}${optional}: ${toTypeScriptType(fieldMeta)};`;
            })
            .join(' ');

        return `{ ${fields} }`;
    }

    if (meta.valueType === 'string' || meta.valueType === 'number' || meta.valueType === 'boolean') {
        return meta.valueType;
    }

    if (meta.valueType === 'array') return 'any[]';
    if (meta.valueType === 'getter-map') return 'Record<string, string>';
    if (meta.valueType === 'function-map') return 'Record<string, Function>';
    if (
        meta.valueType === 'channel'
        || meta.valueType === 'mailbox-watcher'
        || meta.valueType === 'ai-model'
        || meta.valueType === 'ai-vision-model'
    ) return 'string';
    if (meta.valueType === 'function') return 'Function';
    if (meta.valueType === 'code') return 'any';
    if (meta.valueType === 'flow') return '() => Promise<void>';
    if (meta.valueType === 'object' || meta.valueType === 'custom-object') return 'Record<string, any>';

    return 'any';
}

function getNodalParamDoc(meta: NodalParamDef): string {
    const details = [
        meta.description,
        meta.defaultValue ? `Default: ${meta.defaultValue}` : null,
    ].filter(Boolean);

    return details.length > 0 ? `/** ${details.join(' ')} */ ` : '';
}

function getParameterDeclaration(entry: HelpEntryDef, arg: string): string {
    const trimmedArg = arg.trim();
    const paramName = trimmedArg.replace(/\?$/, '').replace(/\.\.\./g, '');
    const variadic = trimmedArg.startsWith('...');
    const optional = trimmedArg.endsWith('?') || trimmedArg.includes('...');
    const paramMeta = entry.nodalParams?.[paramName];
    const paramType = toTypeScriptType(paramMeta);

    if (variadic) return `...${paramName}: ${paramType}[]`;

    return `${paramName}${optional ? '?' : ''}: ${paramType}`;
}

const DATE_TIME_DECLARATIONS = `
type PuppetflowDurationUnit = 'millisecond' | 'milliseconds' | 'second' | 'seconds' | 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days' | 'week' | 'weeks' | 'month' | 'months' | 'quarter' | 'quarters' | 'year' | 'years';
type PuppetflowDurationLike = Partial<Record<PuppetflowDurationUnit, number>>;
interface PuppetflowDateTime {
    readonly day: number;
    readonly hour: number;
    readonly isInDST: boolean;
    readonly isInLeapYear: boolean;
    readonly isWeekend: boolean;
    readonly locale: string;
    readonly millisecond: number;
    readonly minute: number;
    readonly month: number;
    readonly monthLong: string;
    readonly monthShort: string;
    readonly quarter: number;
    readonly second: number;
    readonly weekday: number;
    readonly weekdayLong: string;
    readonly weekdayShort: string;
    readonly weekNumber: number;
    readonly year: number;
    readonly zone: unknown;
    format(dateFormat?: string): string;
    minus(duration: PuppetflowDurationLike): PuppetflowDateTime;
    minus(amount: number, unit?: PuppetflowDurationUnit): PuppetflowDateTime;
    plus(duration: PuppetflowDurationLike): PuppetflowDateTime;
    plus(amount: number, unit?: PuppetflowDurationUnit): PuppetflowDateTime;
    diffTo(otherDate: string | Date | PuppetflowDateTime, unit?: PuppetflowDurationUnit | PuppetflowDurationUnit[]): number | Record<string, number>;
    diffToNow(unit?: PuppetflowDurationUnit | PuppetflowDurationUnit[]): number | Record<string, number>;
    extract(part?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond' | 'weekNumber' | 'weekday'): number;
    endOf(unit: string, options?: Record<string, any>): PuppetflowDateTime;
    equals(otherDate: PuppetflowDateTime): boolean;
    hasSame(otherDate: PuppetflowDateTime, unit: string): boolean;
    isBetween(firstDate: string | Date | PuppetflowDateTime, secondDate: string | Date | PuppetflowDateTime): boolean;
    set(values: Record<string, number>): PuppetflowDateTime;
    setLocale(locale: string): PuppetflowDateTime;
    setZone(zone?: string, options?: Record<string, any>): PuppetflowDateTime;
    startOf(unit: string, options?: Record<string, any>): PuppetflowDateTime;
    toISO(options?: Record<string, any>): string | null;
    toLocaleString(options?: Record<string, any>): string;
    toLocal(): PuppetflowDateTime;
    toMillis(): number;
    toRelative(options?: Record<string, any>): string | null;
    toSeconds(): number;
    toString(): string;
    toUTC(offset?: number, options?: Record<string, any>): PuppetflowDateTime;
}
declare const DateTime: {
    now(): PuppetflowDateTime;
    fromISO(value: string, options?: Record<string, any>): PuppetflowDateTime;
    fromJSDate(value: Date, options?: Record<string, any>): PuppetflowDateTime;
    fromMillis(value: number, options?: Record<string, any>): PuppetflowDateTime;
};
declare const Duration: any;
declare const Interval: any;
`;

function generateExtraLibDeclarations(entries: HelpEntryDef[]): string {
    const lines: string[] = [
        DATE_TIME_DECLARATIONS,
        'declare const $input: any;',
        'declare const $output: any;',
        'declare const $nodes: any;',
        'declare const $run: any;',
        'declare const $context: any;',
    ];
    for (const entry of entries) {
        const { name, signature, desc, options, category } = entry;
        lines.push(`/** ${desc}${options ? ' Options: ' + options : ''} */`);
        if (category === 'Globals') {
            if (name === '$input' || name === '$json' || name === '$output' || name === '$run' || name === '$context') continue;
            if (name === '$page') {
                lines.push('declare const $page: Page;');
                continue;
            }
            if (name === '$client') {
                lines.push('declare const $client: CDPSession;');
                continue;
            }
            if (name === '$now' || name === '$today') {
                lines.push(`declare const ${name}: PuppetflowDateTime;`);
                continue;
            }
            lines.push(`declare const ${name}: any;`);
        } else {
            if (name === '$vars') {
                lines.push('declare const $vars: any;');
                continue;
            }
            const argsMatch = signature.match(/\(([^)]*)\)/);
            const args = argsMatch ? argsMatch[1] : '';
            const typedArgs = args.split(',').filter(Boolean).map(arg => getParameterDeclaration(entry, arg)).join(', ');
            lines.push(`declare function ${name}(${typedArgs}): ${nodalOutputToTypeScript(entry.nodalOutput)};`);
        }
    }
    return lines.join('\n');
}

export const EXTRA_LIB_SOURCE = generateExtraLibDeclarations(HELP_ENTRIES);

export function extractFunctionSources(raw: string): Record<string, string> {
    const fns: Record<string, string> = {};
    const re = /const\s+(\$\w+)\s*=\s*(async\s+)?function/g;
    let match;
    while ((match = re.exec(raw)) !== null) {
        const name = match[1];
        const braceStart = raw.indexOf('{', re.lastIndex);
        if (braceStart === -1) continue;
        let depth = 1;
        let index = braceStart + 1;
        while (index < raw.length && depth > 0) {
            if (raw[index] === '{') depth += 1;
            else if (raw[index] === '}') depth -= 1;
            index += 1;
        }
        fns[name] = raw.substring(match.index, index) + ';';
    }
    return fns;
}

const EVAL_FUNCTIONS = extractFunctionSources(runHeaderRaw);

const HELP_EVAL_DATE_TIME_SOURCE = `
const __helpEvalDateTime = (value = new Date()) => {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    const api = {
        get day() { return date.getDate(); },
        get hour() { return date.getHours(); },
        get millisecond() { return date.getMilliseconds(); },
        get minute() { return date.getMinutes(); },
        get month() { return date.getMonth() + 1; },
        get quarter() { return Math.floor(date.getMonth() / 3) + 1; },
        get second() { return date.getSeconds(); },
        get weekday() { return date.getDay() === 0 ? 7 : date.getDay(); },
        get weekNumber() {
            const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNumber = target.getUTCDay() || 7;
            target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
            const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
            return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        },
        get year() { return date.getFullYear(); },
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
            return __helpEvalDateTime(next);
        },
        plus(amount = 0, unit = 'milliseconds') { return api.minus(-amount, unit); },
        startOf(unit = 'day') {
            const next = new Date(date.getTime());
            if (unit === 'year') next.setMonth(0, 1);
            if (unit === 'month') next.setDate(1);
            if (unit === 'year' || unit === 'month' || unit === 'day') next.setHours(0, 0, 0, 0);
            return __helpEvalDateTime(next);
        },
        toISO() { return date.toISOString(); },
        toJSDate() { return new Date(date.getTime()); },
        toMillis() { return date.getTime(); },
        toSeconds() { return Math.floor(date.getTime() / 1000); },
        toString() { return date.toString(); },
    };
    return api;
};
const $now = __helpEvalDateTime();
const $today = __helpEvalDateTime(new Date(new Date().setHours(0, 0, 0, 0)));
`;

export function runHelpEval(evalExpr: string): { result: unknown; error?: undefined } | { result?: undefined; error: string } {
    try {
        const referenced = Object.keys(EVAL_FUNCTIONS).filter(name => evalExpr.includes(name));
        const code = HELP_EVAL_DATE_TIME_SOURCE + referenced.map(name => EVAL_FUNCTIONS[name]).join('\n') + '\nreturn ' + evalExpr + ';';
        const fn = new Function(code);
        return { result: fn() };
    } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}
