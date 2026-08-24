import type { OnMount } from '@monaco-editor/react';
import { EXTRA_LIB_SOURCE, HELP_ENTRIES } from './helpCatalog';
import { completionRange, type CompletionModel, type CompletionPosition } from './completionCore';
import type { HelpEntryDef, NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
// Relative path on purpose: with the "@" alias Vite's dep optimizer treats this
// .d.ts as a real dependency and fails on devtools-protocol (types-only package),
// causing endless "504 Outdated Optimize Dep" loops.
import puppeteerTypesRaw from '../../../../../../../node_modules/puppeteer-core/lib/types.d.ts?raw';

let extraLibRegistered = false;
let helperOptionCompletionsRegistered = false;
let puppeteerCompletionsRegistered = false;
let dateTimeCompletionsRegistered = false;

type HelperObjectCompletionContext = {
    entry: HelpEntryDef;
    fields: Record<string, NodalParamDef>;
    typed: string;
};

type PuppeteerCompletionEntry = {
    name: string;
    type: 'method' | 'property';
    detail: string;
    documentation: string;
};

type DateTimeCompletionEntry = {
    name: string;
    type: 'method' | 'property';
    section: 'Suggested' | 'Edit' | 'Compare' | 'Format' | 'Component' | 'Other';
    detail: string;
    documentation: string;
    sortRank: number;
};

const PUPPETEER_TYPE_STUBS = `
type ChildProcess = any;
type ParseSelector<Selector extends string> = any;
declare class PassThrough {}
declare namespace ProtocolMapping {
    interface Events extends Record<string, [any]> {}
    interface Commands extends Record<string, { paramsType: [any?]; returnType: any }> {}
}
declare namespace Protocol {
    namespace Emulation {
        type UserAgentMetadata = any;
        interface SetEmulatedVisionDeficiencyRequest { type?: any }
    }
    namespace Input { type DragData = any }
    namespace Network {
        type CookiePartitionKey = any;
        type ErrorReason = any;
        type Initiator = any;
        type ResourceTiming = any;
        type ResourceType = any;
    }
    namespace Page { type DialogType = any }
    namespace Profiler { type ScriptCoverage = any }
    namespace Runtime { type RemoteObject = any }
    namespace Target { type TargetInfo = any }
}
declare namespace Session {
    type CapabilityRequest = Record<string, any>;
}
`;

const PUPPETEER_GLOBAL_TYPES = `${PUPPETEER_TYPE_STUBS}
${puppeteerTypesRaw
        .replace(/^\/\/\/ <reference types="node" \/>\s*/m, '')
        .replace(/^import(?:\s+type)?[\s\S]*?;\s*$/gm, '')
        .replace(/^export declare /gm, 'declare ')
        .replace(/^export \{[^}]*\}\s*$/gm, '')}
`;

const PUPPETEER_PAGE_COMPLETIONS = extractPuppeteerClassCompletions(puppeteerTypesRaw, 'Page');
const PUPPETEER_CLIENT_COMPLETIONS = extractPuppeteerClassCompletions(puppeteerTypesRaw, 'CDPSession');
const DATE_TIME_COMPLETIONS: DateTimeCompletionEntry[] = [
    { name: 'format()', type: 'method', section: 'Suggested', detail: 'format(dateFormat?: string): string', documentation: 'Format the DateTime using Luxon tokens, for example dd/LL/yyyy.', sortRank: 0 },
    { name: 'minus()', type: 'method', section: 'Suggested', detail: 'minus(amount: number, unit?: string): DateTime', documentation: 'Subtract a duration. Accepts an object duration or n8n-style amount and unit.', sortRank: 1 },
    { name: 'plus()', type: 'method', section: 'Suggested', detail: 'plus(amount: number, unit?: string): DateTime', documentation: 'Add a duration. Accepts an object duration or n8n-style amount and unit.', sortRank: 2 },
    { name: 'diffTo()', type: 'method', section: 'Suggested', detail: 'diffTo(otherDate, unit?): number | object', documentation: 'Return the difference from this DateTime to another date.', sortRank: 3 },
    { name: 'extract()', type: 'method', section: 'Suggested', detail: 'extract(part?: string): number', documentation: 'Extract one DateTime component such as year, month, day, hour or weekNumber.', sortRank: 4 },
    { name: 'endOf()', type: 'method', section: 'Edit', detail: 'endOf(unit: string): DateTime', documentation: 'Move to the end of a unit such as day, week, month or year.', sortRank: 20 },
    { name: 'set()', type: 'method', section: 'Edit', detail: 'set(values: object): DateTime', documentation: 'Set DateTime components such as year, month, day, hour or minute.', sortRank: 21 },
    { name: 'setLocale()', type: 'method', section: 'Edit', detail: 'setLocale(locale: string): DateTime', documentation: 'Return a DateTime with a different locale for formatting.', sortRank: 22 },
    { name: 'setZone()', type: 'method', section: 'Edit', detail: 'setZone(zone?: string): DateTime', documentation: 'Return a DateTime converted to another timezone.', sortRank: 23 },
    { name: 'startOf()', type: 'method', section: 'Edit', detail: 'startOf(unit: string): DateTime', documentation: 'Move to the start of a unit such as day, week, month or year.', sortRank: 24 },
    { name: 'toLocal()', type: 'method', section: 'Edit', detail: 'toLocal(): DateTime', documentation: 'Convert the DateTime to the local timezone.', sortRank: 25 },
    { name: 'toUTC()', type: 'method', section: 'Edit', detail: 'toUTC(offset?: number): DateTime', documentation: 'Convert the DateTime to UTC.', sortRank: 26 },
    { name: 'diffToNow()', type: 'method', section: 'Compare', detail: 'diffToNow(unit?: string): number | object', documentation: 'Return the difference from this DateTime to now.', sortRank: 40 },
    { name: 'equals()', type: 'method', section: 'Compare', detail: 'equals(otherDate: DateTime): boolean', documentation: 'Check whether another DateTime is exactly equal.', sortRank: 41 },
    { name: 'hasSame()', type: 'method', section: 'Compare', detail: 'hasSame(otherDate: DateTime, unit: string): boolean', documentation: 'Check whether another DateTime has the same unit value.', sortRank: 42 },
    { name: 'isBetween()', type: 'method', section: 'Compare', detail: 'isBetween(firstDate, secondDate): boolean', documentation: 'Check whether this DateTime lies strictly between two dates.', sortRank: 43 },
    { name: 'toISO()', type: 'method', section: 'Format', detail: 'toISO(options?: object): string | null', documentation: 'Format as an ISO 8601 string.', sortRank: 60 },
    { name: 'toLocaleString()', type: 'method', section: 'Format', detail: 'toLocaleString(options?: object): string', documentation: 'Format using Intl locale options.', sortRank: 61 },
    { name: 'toMillis()', type: 'method', section: 'Format', detail: 'toMillis(): number', documentation: 'Return the epoch timestamp in milliseconds.', sortRank: 62 },
    { name: 'toRelative()', type: 'method', section: 'Format', detail: 'toRelative(options?: object): string | null', documentation: 'Return a relative time string.', sortRank: 63 },
    { name: 'toSeconds()', type: 'method', section: 'Format', detail: 'toSeconds(): number', documentation: 'Return the epoch timestamp in seconds.', sortRank: 64 },
    { name: 'toString()', type: 'method', section: 'Format', detail: 'toString(): string', documentation: 'Return the DateTime as a string.', sortRank: 65 },
    { name: 'day', type: 'property', section: 'Component', detail: 'day: number', documentation: 'Day of the month.', sortRank: 80 },
    { name: 'hour', type: 'property', section: 'Component', detail: 'hour: number', documentation: 'Hour of the day.', sortRank: 81 },
    { name: 'isInDST', type: 'property', section: 'Component', detail: 'isInDST: boolean', documentation: 'Whether this DateTime is in daylight saving time.', sortRank: 82 },
    { name: 'isInLeapYear', type: 'property', section: 'Component', detail: 'isInLeapYear: boolean', documentation: 'Whether this DateTime is in a leap year.', sortRank: 83 },
    { name: 'isWeekend', type: 'property', section: 'Component', detail: 'isWeekend: boolean', documentation: 'Whether this DateTime falls on Saturday or Sunday.', sortRank: 84 },
    { name: 'locale', type: 'property', section: 'Component', detail: 'locale: string', documentation: 'Locale used by this DateTime.', sortRank: 85 },
    { name: 'millisecond', type: 'property', section: 'Component', detail: 'millisecond: number', documentation: 'Millisecond component.', sortRank: 86 },
    { name: 'minute', type: 'property', section: 'Component', detail: 'minute: number', documentation: 'Minute component.', sortRank: 87 },
    { name: 'month', type: 'property', section: 'Component', detail: 'month: number', documentation: 'Month number from 1 to 12.', sortRank: 88 },
    { name: 'monthLong', type: 'property', section: 'Component', detail: 'monthLong: string', documentation: 'Localized long month name.', sortRank: 89 },
    { name: 'monthShort', type: 'property', section: 'Component', detail: 'monthShort: string', documentation: 'Localized short month name.', sortRank: 90 },
    { name: 'quarter', type: 'property', section: 'Component', detail: 'quarter: number', documentation: 'Quarter number from 1 to 4.', sortRank: 91 },
    { name: 'second', type: 'property', section: 'Component', detail: 'second: number', documentation: 'Second component.', sortRank: 92 },
    { name: 'weekday', type: 'property', section: 'Component', detail: 'weekday: number', documentation: 'Weekday number where Monday is 1 and Sunday is 7.', sortRank: 93 },
    { name: 'weekdayLong', type: 'property', section: 'Component', detail: 'weekdayLong: string', documentation: 'Localized long weekday name.', sortRank: 94 },
    { name: 'weekdayShort', type: 'property', section: 'Component', detail: 'weekdayShort: string', documentation: 'Localized short weekday name.', sortRank: 95 },
    { name: 'weekNumber', type: 'property', section: 'Component', detail: 'weekNumber: number', documentation: 'ISO week number.', sortRank: 96 },
    { name: 'year', type: 'property', section: 'Component', detail: 'year: number', documentation: 'Full year.', sortRank: 97 },
    { name: 'zone', type: 'property', section: 'Component', detail: 'zone: Zone', documentation: 'Timezone object for this DateTime.', sortRank: 98 },
];

export function registerExtraLib(monaco: Parameters<OnMount>[1]) {
    if (!monaco || extraLibRegistered) return;
    extraLibRegistered = true;
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        ...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
        allowJs: true,
        checkJs: true,
    });
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
        PUPPETEER_GLOBAL_TYPES,
        'puppetflow-puppeteer.d.ts',
    );
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
        EXTRA_LIB_SOURCE,
        'puppetflow-globals.d.ts',
    );
}

export function registerCompletions(monaco: Parameters<OnMount>[1]) {
    if (!monaco) return { dispose: () => {} };
    registerExtraLib(monaco);

    registerPuppeteerDotCompletions(monaco);
    registerDateTimeDotCompletions(monaco);

    if (helperOptionCompletionsRegistered) return { dispose: () => {} };
    helperOptionCompletionsRegistered = true;

    monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['{', ',', ' '],
        provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
            const context = getHelperObjectCompletionContext(model, position);
            if (!context) return { suggestions: [] };

            const range = completionRange(position, context.typed);
            return {
                suggestions: Object.entries(context.fields)
                    .filter(([fieldName]) => fieldName.toLowerCase().startsWith(context.typed.toLowerCase()))
                    .map(([fieldName, fieldMeta]) => ({
                        label: fieldName,
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: fieldName,
                        detail: fieldMeta.valueType ?? 'option',
                        documentation: [
                            fieldMeta.description,
                            fieldMeta.defaultValue ? `Default: ${fieldMeta.defaultValue}` : null,
                        ].filter(Boolean).join(' '),
                        range,
                        sortText: fieldName,
                    })),
            };
        },
    });

    return { dispose: () => {} };
}

function registerPuppeteerDotCompletions(monaco: Parameters<OnMount>[1]) {
    if (puppeteerCompletionsRegistered) return;
    puppeteerCompletionsRegistered = true;

    monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['.'],
        provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
            const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
            const match = linePrefix.match(/(\$(?:page|client))\.([a-zA-Z_$][\w$]*)?$/);
            if (!match) return { suggestions: [] };

            const root = match[1];
            const typed = match[2] ?? '';
            const entries = root === '$page' ? PUPPETEER_PAGE_COMPLETIONS : PUPPETEER_CLIENT_COMPLETIONS;
            const range = completionRange(position, typed);

            return {
                suggestions: entries
                    .filter(entry => entry.name.toLowerCase().startsWith(typed.toLowerCase()))
                    .map(entry => ({
                        label: entry.name,
                        kind: entry.type === 'method'
                            ? monaco.languages.CompletionItemKind.Method
                            : monaco.languages.CompletionItemKind.Property,
                        insertText: entry.name,
                        detail: entry.detail,
                        documentation: entry.documentation,
                        range,
                        sortText: entry.name,
                    })),
            };
        },
    });
}

function registerDateTimeDotCompletions(monaco: Parameters<OnMount>[1]) {
    if (dateTimeCompletionsRegistered) return;
    dateTimeCompletionsRegistered = true;

    monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['.'],
        provideCompletionItems: (model: CompletionModel, position: CompletionPosition) => {
            const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
            const match = linePrefix.match(/(\$(?:now|today)(?:\.[a-zA-Z_$][\w$]*(?:\([^()]*\))?)*)\.([a-zA-Z_$][\w$]*)?$/);
            if (!match) return { suggestions: [] };

            const typed = match[2] ?? '';
            const range = completionRange(position, typed);

            return {
                suggestions: DATE_TIME_COMPLETIONS
                    .filter(entry => entry.name.replace(/\(\)$/, '').toLowerCase().startsWith(typed.toLowerCase()))
                    .map(entry => ({
                        label: entry.name,
                        kind: entry.type === 'method'
                            ? monaco.languages.CompletionItemKind.Method
                            : monaco.languages.CompletionItemKind.Property,
                        insertText: entry.name,
                        detail: `${entry.section}: ${entry.detail}`,
                        documentation: entry.documentation,
                        range,
                        sortText: String(entry.sortRank).padStart(3, '0') + entry.name,
                    })),
            };
        },
    });
}

function getHelperObjectCompletionContext(model: CompletionModel, position: CompletionPosition): HelperObjectCompletionContext | null {
    const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
    const call = findActiveHelperCall(linePrefix);
    if (!call) return null;

    const entry = HELP_ENTRIES.find(helpEntry => helpEntry.name === call.name);
    if (!entry) return null;

    const argNames = getSignatureArgNames(entry.signature);
    const argName = argNames[call.argIndex];
    if (!argName) return null;

    const fields = entry.nodalParams?.[argName]?.objectFields;
    if (!fields || Object.keys(fields).length === 0) return null;

    const typed = getCurrentObjectKeyPrefix(call.currentArg);
    if (typed === null) return null;

    return { entry, fields, typed };
}

function extractPuppeteerClassCompletions(source: string, className: string): PuppeteerCompletionEntry[] {
    const classBody = extractClassBody(source, className);
    if (!classBody) return [];

    const entries = new Map<string, PuppeteerCompletionEntry>();
    const lines = classBody.split('\n');
    let docLines: string[] = [];
    let collectingDoc = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('/**')) {
            collectingDoc = true;
            docLines = [trimmed];
            continue;
        }

        if (collectingDoc) {
            docLines.push(trimmed);
            if (trimmed.endsWith('*/')) collectingDoc = false;
            continue;
        }

        const methodMatch = trimmed.match(/^(?:abstract\s+)?([a-zA-Z_$][\w$]*)\s*\((.*)\):\s*([^;]+);$/);
        const getterMatch = trimmed.match(/^(?:abstract\s+)?get\s+([a-zA-Z_$][\w$]*)\s*\(\):\s*([^;]+);$/);
        const propertyMatch = trimmed.match(/^(?:abstract\s+)?([a-zA-Z_$][\w$]*)\s*:\s*([^;]+);$/);
        const match = methodMatch ?? getterMatch ?? propertyMatch;
        if (!match || match[1].startsWith('_')) {
            docLines = [];
            continue;
        }

        const name = match[1];
        const isMethod = Boolean(methodMatch);
        const args = methodMatch?.[2] ?? '';
        const returnType = methodMatch?.[3] ?? getterMatch?.[2] ?? propertyMatch?.[2] ?? 'unknown';
        entries.set(name, {
            name,
            type: isMethod ? 'method' : 'property',
            detail: isMethod ? `${name}(${args}): ${returnType}` : `${name}: ${returnType}`,
            documentation: cleanJsDoc(docLines),
        });
        docLines = [];
    }

    return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function extractClassBody(source: string, className: string): string | null {
    const classMatch = source.match(new RegExp(`class\\s+${className}\\b[^{]*\\{`));
    if (!classMatch?.index) return null;

    const openBraceIndex = source.indexOf('{', classMatch.index);
    let depth = 1;
    let index = openBraceIndex + 1;

    while (index < source.length && depth > 0) {
        const char = source[index];
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        index += 1;
    }

    return source.slice(openBraceIndex + 1, index - 1);
}

function cleanJsDoc(lines: string[]): string {
    return lines
        .map(line => line
            .replace(/^\/\*\*?/, '')
            .replace(/\*\/$/, '')
            .replace(/^\*\s?/, '')
            .trim())
        .filter(line => line && !line.startsWith('@public'))
        .join('\n');
}

function findActiveHelperCall(linePrefix: string): { name: string; argIndex: number; currentArg: string } | null {
    const calls = [...linePrefix.matchAll(/\$\w+\s*\(/g)];

    for (let i = calls.length - 1; i >= 0; i -= 1) {
        const match = calls[i];
        const openParenIndex = (match.index ?? 0) + match[0].lastIndexOf('(');
        const callBody = linePrefix.slice(openParenIndex + 1);
        if (getBalance(callBody, '(', ')') < 0) continue;

        const args = splitTopLevelArguments(callBody);
        return {
            name: match[0].replace(/\s*\($/, ''),
            argIndex: Math.max(0, args.length - 1),
            currentArg: args[args.length - 1] ?? '',
        };
    }

    return null;
}

function splitTopLevelArguments(value: string): string[] {
    const args: string[] = [];
    let start = 0;
    let depth = 0;
    let quote: string | null = null;
    let escaped = false;

    for (let i = 0; i < value.length; i += 1) {
        const char = value[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }

        if (char === '(' || char === '{' || char === '[') depth += 1;
        if (char === ')' || char === '}' || char === ']') depth -= 1;

        if (char === ',' && depth === 0) {
            args.push(value.slice(start, i));
            start = i + 1;
        }
    }

    args.push(value.slice(start));
    return args;
}

function getCurrentObjectKeyPrefix(currentArg: string): string | null {
    const objectBody = getOpenObjectBody(currentArg);
    if (objectBody === null) return null;

    const currentProperty = getTextAfterLastTopLevelSeparator(objectBody);
    if (currentProperty.includes(':')) return null;

    const match = currentProperty.match(/([a-zA-Z_$][\w$]*)$/);
    return match?.[1] ?? '';
}

function getOpenObjectBody(value: string): string | null {
    let depth = 0;
    let openIndex = -1;
    let quote: string | null = null;
    let escaped = false;

    for (let i = 0; i < value.length; i += 1) {
        const char = value[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }

        if (char === '{') {
            if (depth === 0) openIndex = i;
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0) openIndex = -1;
        }
    }

    return openIndex === -1 ? null : value.slice(openIndex + 1);
}

function getTextAfterLastTopLevelSeparator(value: string): string {
    let depth = 0;
    let start = 0;
    let quote: string | null = null;
    let escaped = false;

    for (let i = 0; i < value.length; i += 1) {
        const char = value[i];

        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }

        if (char === '{' || char === '[' || char === '(') depth += 1;
        if (char === '}' || char === ']' || char === ')') depth -= 1;

        if (char === ',' && depth === 0) start = i + 1;
    }

    return value.slice(start);
}

function getBalance(value: string, open: string, close: string): number {
    return [...value].reduce((balance, char) => {
        if (char === open) return balance + 1;
        if (char === close) return balance - 1;
        return balance;
    }, 0);
}

function getSignatureArgNames(signature: string): string[] {
    const argsMatch = signature.match(/\(([^)]*)\)/);
    const args = argsMatch ? argsMatch[1] : '';

    return args
        .split(',')
        .map(arg => arg.trim().replace(/\?$/, '').replace(/^\.\.\./, ''))
        .filter(Boolean);
}
